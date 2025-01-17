import {
  contentType,
  encodeBase64,
  extname,
  globToRegExp,
  posix,
} from "../deps/std.ts";
import { fromFilename } from "./transformers/mod.ts";
import { slugify } from "../core/utils/string.ts";
import { normalizePath } from "../core/utils/path.ts";

import type { Octokit } from "npm:octokit";
import type { Data, Entry, EntryMetadata, Storage } from "../types.ts";

export interface Options {
  client: Octokit;
  owner: string;
  repo: string;
  path?: string;
  branch?: string;
  commitMessage?: (options: CommitMessageOptions) => string;
}

interface CommitMessageOptions {
  action: "create" | "update" | "delete";
  path: string;
}

export default class GitHub implements Storage {
  client: Octokit;
  owner: string;
  repo: string;
  root: string;
  path: string;
  extension?: string;
  branch?: string;
  commitMessage: (options: CommitMessageOptions) => string;

  constructor(options: Options) {
    this.client = options.client;
    this.owner = options.owner;
    this.repo = options.repo;
    this.branch = options.branch;
    this.commitMessage = options.commitMessage || function ({ action, path }) {
      switch (action) {
        case "create":
          return `Create file ${path}`;
        case "update":
          return `Update file ${path}`;
        case "delete":
          return `Delete file ${path}`;
      }
    };

    const path = options.path || "";
    const pos = path.indexOf("*");

    if (pos === -1) {
      this.root = normalizePath(path).slice(1);
      this.path = "**";
    } else if (pos > 0) {
      this.root = normalizePath(path.slice(0, pos)).slice(1);
      this.path = path.slice(pos);
      this.extension = posix.extname(path);
    } else {
      this.root = "";
      this.path = path;
      this.extension = posix.extname(path);
    }
  }

  async *[Symbol.asyncIterator]() {
    const info = await fetchInfo({
      client: this.client,
      owner: this.owner,
      repo: this.repo,
      path: this.root,
      branch: this.branch,
    });

    if (!Array.isArray(info)) {
      return;
      // throw new Error(`Invalid directory: ${this.path}`);
    }

    const regexp = globToRegExp(this.path, { extended: true });

    for (const entry of info) {
      if (entry.type === "file") {
        if (!regexp.test(entry.name)) {
          continue;
        }

        yield {
          label: entry.name,
          name: entry.name,
          src: entry.download_url,
        };
      }
    }
  }

  name(name: string): string {
    const newName = slugify(name);

    return (this.extension && !newName.endsWith(this.extension))
      ? newName + this.extension
      : newName;
  }

  directory(id: string): Storage {
    return new GitHub({
      client: this.client,
      owner: this.owner,
      repo: this.repo,
      path: posix.join(this.root, id),
      branch: this.branch,
      commitMessage: this.commitMessage,
    });
  }

  get(name: string): Entry {
    const path = posix.join(this.root, name);
    return new GitHubEntry({
      client: this.client,
      owner: this.owner,
      repo: this.repo,
      path: posix.join(this.root, name),
      branch: this.branch,
      commitMessage: this.commitMessage,
    }, {
      label: name,
      name: name,
      src:
        `https://raw.githubusercontent.com/${this.owner}/${this.repo}/${this.branch}/${path}`,
    });
  }

  async delete(name: string) {
    const path = posix.join(this.root, name);
    const info = await fetchInfo({
      client: this.client,
      owner: this.owner,
      repo: this.repo,
      path,
      branch: this.branch,
    });

    const sha = info?.sha;

    if (!sha) {
      throw new Error(`File not found: ${path}`);
    }

    await this.client.rest.repos.deleteFile({
      owner: this.owner,
      repo: this.repo,
      path,
      message: this.commitMessage({ action: "delete", path }),
      branch: this.branch,
      sha,
    });
  }

  async rename(name: string, newName: string): Promise<void> {
    const content = await readBinaryContent({
      client: this.client,
      owner: this.owner,
      repo: this.repo,
      path: posix.join(this.root, name),
      branch: this.branch,
    });

    const path = posix.join(this.root, newName);
    await this.client.rest.repos.createOrUpdateFileContents({
      owner: this.owner,
      repo: this.repo,
      path,
      message: this.commitMessage({ action: "create", path }),
      content: encodeBase64(content || ""),
      branch: this.branch,
    });

    await this.delete(name);
  }
}

export class GitHubEntry implements Entry {
  metadata: EntryMetadata;
  client: Octokit;
  owner: string;
  repo: string;
  path: string;
  branch?: string;
  commitMessage: (options: CommitMessageOptions) => string;

  constructor(options: Options, metadata: EntryMetadata) {
    this.client = options.client;
    this.owner = options.owner;
    this.repo = options.repo;
    this.path = options.path || "";
    this.branch = options.branch;
    this.commitMessage = options.commitMessage!;
    this.metadata = metadata;
  }

  async readData(): Promise<Data> {
    const data = await readTextContent({
      client: this.client,
      owner: this.owner,
      repo: this.repo,
      path: this.path,
      branch: this.branch,
    });

    const transformer = fromFilename(this.path);
    return transformer.toData(data || "");
  }

  async writeData(data: Data) {
    const transformer = fromFilename(this.path);
    const content = (await transformer.fromData(data))
      .replaceAll(/\r\n/g, "\n"); // Unify line endings

    await writeContent({
      client: this.client,
      owner: this.owner,
      repo: this.repo,
      path: this.path,
      branch: this.branch,
      commitMessage: this.commitMessage,
    }, content);
  }

  async readFile(): Promise<File> {
    const data = await readBinaryContent({
      client: this.client,
      owner: this.owner,
      repo: this.repo,
      path: this.path,
      branch: this.branch,
    });

    if (!data) {
      throw new Error(`File not found: ${this.path}`);
    }

    const type = contentType(extname(this.path));

    return new File([new Blob([data])], this.path, { type });
  }

  async writeFile(file: File) {
    await writeContent({
      client: this.client,
      owner: this.owner,
      repo: this.repo,
      path: this.path,
      branch: this.branch,
      commitMessage: this.commitMessage,
    }, await file.arrayBuffer());
  }
}

async function fetchInfo(
  options: Options,
  params?: Record<string, unknown>,
  // deno-lint-ignore no-explicit-any
): Promise<any | undefined> {
  const { client, owner, repo, path, branch } = options;
  try {
    const result = await client.rest.repos.getContent({
      owner,
      repo,
      path: path || "",
      ref: branch,
      ...params,
    });

    if (result.status !== 200) {
      return;
    }

    return result.data;
  } catch {
    // Ignore
  }
}

async function readTextContent(
  options: Options,
): Promise<string | undefined> {
  const result = await fetchInfo(options, {
    mediaType: {
      format: "raw",
    },
  });

  return result as string;
}

async function readBinaryContent(
  options: Options,
): Promise<Uint8Array | undefined> {
  const { client, owner, repo, path, branch } = options;

  // https://github.com/octokit/rest.js/issues/14#issuecomment-584413497
  const endpoint = client.rest.repos.getContent.endpoint({
    owner,
    repo,
    path,
    ref: branch,
    mediaType: {
      format: "raw",
    },
  });

  const auth = await client.auth() as { token: string };
  const response = await fetch(endpoint.url, {
    method: endpoint.method,
    headers: {
      ...endpoint.headers as Record<string, string>,
      authorization: `Bearer ${auth.token}`,
    },
  });

  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
}

async function writeContent(
  options: Options,
  content: ArrayBuffer | Uint8Array | string,
) {
  const exists = await fetchInfo(options);
  const { client, owner, repo, path, branch } = options;

  if (!path) {
    throw new Error("Invalid path");
  }

  await client.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    branch,
    message: options.commitMessage!({
      action: exists ? "update" : "create",
      path,
    }),
    content: encodeBase64(content),
    sha: exists?.sha,
  });
}
