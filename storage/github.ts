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
import { Octokit } from "npm:octokit@5.0.3";

import type { Data, Entry, EntrySource, Storage } from "../types.ts";

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

interface GitEntry {
  name: string;
  path: string;
  sha: string;
  size: number;
  download_url: string;
  type: "file" | "dir";
}

class GitClient {
  client: Octokit;
  owner: string;
  repo: string;
  branch: string;
  commitMessage: (options: CommitMessageOptions) => string;

  constructor(options: Options) {
    this.client = options.client;
    this.owner = options.owner;
    this.repo = options.repo;
    this.commitMessage = options.commitMessage!;
    this.branch = options.branch || "main";
  }

  /** List the files of a directory. */
  async *listFiles(path = "", depth = 0): AsyncGenerator<GitEntry> {
    try {
      const result = await this.client.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        ref: this.branch,
        path,
      });

      if (result.status !== 200) {
        return;
      }

      for (const entry of result.data as GitEntry[]) {
        if (entry.type === "dir") {
          if (depth) {
            yield* this.listFiles(posix.join(path, entry.name), depth - 1);
          }
          continue;
        }
        yield entry;
      }
    } catch {
      // Ignore
    }
  }

  /** Get the text content of a file. */
  async getTextContent(path = ""): Promise<string | undefined> {
    try {
      const result = await this.client.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        ref: this.branch,
        path,
        mediaType: {
          format: "raw",
        },
      });

      if (result.status !== 200) {
        return;
      }

      return result.data as unknown as string;
    } catch {
      // Ignore
    }
  }

  /** Get the binary content of a file. */
  async getBinaryContent(path = ""): Promise<Uint8Array | undefined> {
    // https://github.com/octokit/rest.js/issues/14#issuecomment-584413497
    const endpoint = this.client.rest.repos.getContent.endpoint({
      owner: this.owner,
      repo: this.repo,
      ref: this.branch,
      path,
      mediaType: {
        format: "raw",
      },
    });

    const auth = await this.client.auth() as { token: string };
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

  async setContent(path: string, content: ArrayBuffer | Uint8Array | string) {
    let sha: string | undefined;

    try {
      const exists = await this.client.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        ref: this.branch,
        path,
      });

      // @ts-ignore: Property 'sha' does not exist
      sha = exists.data.sha;
    } catch {
      // Ignore
    }

    await this.client.rest.repos.createOrUpdateFileContents({
      owner: this.owner,
      repo: this.repo,
      branch: this.branch,
      path,
      message: this.commitMessage({ action: sha ? "update" : "create", path }),
      content: encodeBase64(content),
      sha,
    });
  }

  /** Delete a file */
  async deleteFile(path: string) {
    const result = await this.client.rest.repos.getContent({
      owner: this.owner,
      repo: this.repo,
      ref: this.branch,
      path,
    });

    if (result.status !== 200) {
      return;
    }

    // @ts-ignore: Property 'sha' does not exist
    const sha = result.data.sha;

    if (!sha) {
      throw new Error(`File not found: ${path}`);
    }

    await this.client.rest.repos.deleteFile({
      owner: this.owner,
      repo: this.repo,
      branch: this.branch,
      path,
      message: this.commitMessage({ action: "delete", path }),
      sha,
    });
  }

  /** Rename a file */
  async rename(path: string, newPath: string): Promise<void> {
    const content = await this.getBinaryContent(path);

    await this.client.rest.repos.createOrUpdateFileContents({
      owner: this.owner,
      repo: this.repo,
      branch: this.branch,
      path: newPath,
      message: this.commitMessage({ action: "update", path }),
      content: encodeBase64(content || ""),
    });

    await this.deleteFile(path);
  }
}

export default class GitHub implements Storage {
  git: GitClient;
  client: Octokit;
  owner: string;
  repo: string;
  root: string;
  path: string;
  extension?: string;
  branch?: string;
  commitMessage: (options: CommitMessageOptions) => string;

  static create(repository: string, auth: string) {
    const [owner, repo, ...path] = repository.split("/");
    const client = new Octokit({ auth });
    return new GitHub({ client, owner, repo, path: path.join("/") });
  }

  constructor(options: Options) {
    options.commitMessage ??= function ({ action, path }) {
      switch (action) {
        case "create":
          return `Create file ${path}`;
        case "update":
          return `Update file ${path}`;
        case "delete":
          return `Delete file ${path}`;
      }
    };

    this.client = options.client;
    this.owner = options.owner;
    this.repo = options.repo;
    this.branch = options.branch;
    this.commitMessage = options.commitMessage;

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
    this.git = new GitClient(options);
  }

  async *[Symbol.asyncIterator](): AsyncGenerator<EntrySource> {
    const regexp = globToRegExp(this.path, { extended: true });
    const depth = getDepth(this.path);
    const offsetPath = this.root.length ? this.root.length + 1 : 0;

    for await (const entry of this.git.listFiles(this.root, depth)) {
      if (entry.type === "file") {
        const name = offsetPath ? entry.path.slice(offsetPath) : entry.path;

        if (!regexp.test(name)) {
          continue;
        }

        yield {
          name,
          path: posix.join(this.root, name),
          src: entry.download_url,
        };
      }
    }
  }

  source(name: string): EntrySource {
    const path = posix.join(this.root, name);
    return {
      name: name,
      path: posix.join(this.root, name),
      src:
        `https://raw.githubusercontent.com/${this.owner}/${this.repo}/${this.branch}/${path}`,
    };
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
    return new GitHubEntry(this.source(name), this.git);
  }

  async delete(name: string) {
    const path = posix.join(this.root, name);
    await this.git.deleteFile(path);
  }

  async rename(name: string, newName: string): Promise<void> {
    name = posix.join(this.root, name);
    newName = posix.join(this.root, newName);

    await this.git.rename(name, newName);
  }
}

export class GitHubEntry implements Entry {
  readonly source: EntrySource;
  readonly git: GitClient;

  constructor(source: EntrySource, git: GitClient) {
    this.source = source;
    this.git = git;
  }

  async readText(): Promise<string> {
    return await this.git.getTextContent(this.source.path) || "";
  }

  async writeText(content: string): Promise<void> {
    await this.git.setContent(this.source.path, content);
  }

  async readData(): Promise<Data> {
    const data = await this.readText();
    const transformer = fromFilename(this.source.path);
    return transformer.toData(data);
  }

  async writeData(data: Data) {
    const transformer = fromFilename(this.source.path);
    const content = (await transformer.fromData(data))
      .replaceAll(/\r\n/g, "\n"); // Unify line endings

    await this.writeText(content);
  }

  async readFile(): Promise<File> {
    const data = await this.git.getBinaryContent(this.source.path);

    if (!data) {
      throw new Error(`File not found: ${this.source.path}`);
    }

    const type = contentType(extname(this.source.path));

    return new File([new Blob([data])], this.source.path, { type });
  }

  async writeFile(file: File) {
    await this.git.setContent(this.source.path, await file.arrayBuffer());
  }
}

function getDepth(path: string): number {
  if (path.includes("**/")) {
    return Infinity;
  }

  if (path.includes("*/")) {
    return 1;
  }

  return 0;
}
