import {
  contentType,
  decodeBase64,
  encodeBase64,
  extname,
  posix,
} from "../deps/std.ts";
import { fromFilename } from "./transformers/mod.ts";
import { slugify } from "../core/utils/string.ts";
import { Octokit } from "npm:octokit";

import type {
  OctokitResponse,
  RequestParameters,
} from "npm:octokit/octokit.d.ts";
import type { Data, Entry, EntryMetadata, Storage } from "../types.ts";

export interface Options {
  client: Octokit;
  owner: string;
  repo: string;
  path?: string;
  branch?: string;
  commitMessage?: (options: Options, info?: OctokitResponse) => string;
}

export default class GitHub implements Storage {
  client: Octokit;
  owner: string;
  repo: string;
  path: string;
  branch?: string;
  commitMessage: (options: Options, info?: OctokitResponse) => string;

  constructor(options: Options) {
    this.client = options.client;
    this.owner = options.owner;
    this.repo = options.repo;
    this.path = options.path || "";
    this.branch = options.branch;
    this.commitMessage = options.commitMessage || (({ path }, info) => {
      return info ? `Update file ${path}` : `Create file ${path}`;
    });
  }

  async *[Symbol.asyncIterator]() {
    const info = await fetchInfo({
      client: this.client,
      owner: this.owner,
      repo: this.repo,
      path: this.path,
      branch: this.branch,
    });

    if (!Array.isArray(info)) {
      return;
      // throw new Error(`Invalid directory: ${this.path}`);
    }

    for (const entry of info) {
      if (entry.type === "file") {
        yield {
          name: entry.name,
          src: entry.download_url,
        };
      }
    }
  }

  name(name: string): string {
    return slugify(name);
  }

  directory(id: string): Storage {
    return new GitHub({
      client: this.client,
      owner: this.owner,
      repo: this.repo,
      path: posix.join(this.path, id),
      branch: this.branch,
      commitMessage: this.commitMessage,
    });
  }

  get(id: string): Entry {
    return new GitHubEntry({
      client: this.client,
      owner: this.owner,
      repo: this.repo,
      path: posix.join(this.path, id),
      branch: this.branch,
      commitMessage: this.commitMessage,
    });
  }

  async delete(id: string) {
    const info = await fetchInfo({
      client: this.client,
      owner: this.owner,
      repo: this.repo,
      path: posix.join(this.path, id),
      branch: this.branch,
    });

    const sha = info?.sha;

    if (!sha) {
      throw new Error(`File not found: ${this.path}`);
    }

    await this.client.rest.repos.deleteFile({
      owner: this.owner,
      repo: this.repo,
      path: posix.join(this.path, id),
      message: "Delete file",
      branch: this.branch,
      sha,
    });
  }

  async rename(id: string, newId: string): Promise<void> {
    const content = await readBinaryContent({
      client: this.client,
      owner: this.owner,
      repo: this.repo,
      path: posix.join(this.path, id),
      branch: this.branch,
    });

    await this.client.rest.repos.createOrUpdateFileContents({
      owner: this.owner,
      repo: this.repo,
      path: posix.join(this.path, newId),
      message: "Rename file",
      content: encodeBase64(content || ""),
      branch: this.branch,
    });

    await this.delete(id);
  }
}

export class GitHubEntry implements Entry {
  metadata: EntryMetadata;
  client: Octokit;
  owner: string;
  repo: string;
  path: string;
  branch?: string;
  commitMessage: (options: Options, info?: OctokitResponse) => string;

  constructor(options: Options) {
    this.client = options.client;
    this.owner = options.owner;
    this.repo = options.repo;
    this.path = options.path || "";
    this.branch = options.branch;
    this.commitMessage = options.commitMessage!;
    this.metadata = {
      name: this.path,
      src:
        `https://raw.githubusercontent.com/${options.owner}/${options.repo}/${options.branch}/${options.path}`,
    };
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
    const content = await transformer.fromData(data);

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
  params?: RequestParameters,
): Promise<OctokitResponse | undefined> {
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
  const content = await fetchInfo(options, {
    mediaType: {
      format: "base64",
    },
  });

  return content ? decodeBase64(content.content) : undefined;
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
    message: options.commitMessage!(options, exists),
    content: encodeBase64(content),
    sha: exists?.sha,
  });
}
