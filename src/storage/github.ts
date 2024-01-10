import { join } from "std/path/posix/join.ts";
import { fromFilename } from "./transformers/mod.ts";
import { Octokit } from "npm:octokit";

import type { Data, Entry, Storage } from "../types.ts";

export interface Options {
  client: Octokit;
  owner: string;
  repo: string;
  path?: string;
}

export class GitHubStorage implements Storage<Data> {
  client: Octokit;
  owner: string;
  repo: string;
  path: string;

  constructor(options: Options) {
    this.client = options.client;
    this.owner = options.owner;
    this.repo = options.repo;
    this.path = options.path || "";
  }

  async *[Symbol.asyncIterator]() {
    const data = await getContent<{ type: string; name: string }[]>(
      this.client,
      {
        owner: this.owner,
        repo: this.repo,
        path: this.path,
      },
    );

    if (!Array.isArray(data)) {
      throw new Error(`Invalid directory: ${this.path}`);
    }

    for (const entry of data) {
      if (entry.type === "file") {
        yield entry.name;
      }
    }
  }

  directory(id: string) {
    return new GitHubStorage({
      client: this.client,
      owner: this.owner,
      repo: this.repo,
      path: join(this.path, id),
    });
  }

  get(id: string): GitHubEntry {
    return new GitHubEntry({
      client: this.client,
      owner: this.owner,
      repo: this.repo,
      path: join(this.path, id),
    });
  }

  async delete(id: string) {
    const data = await getContent<{ sha: string }>(this.client, {
      owner: this.owner,
      repo: this.repo,
      path: join(this.path, id),
    });

    const sha = data?.sha;

    if (!sha) {
      throw new Error(`File not found: ${this.path}`);
    }

    await this.client.rest.repos.deleteFile({
      owner: this.owner,
      repo: this.repo,
      path: join(this.path, id),
      message: "Delete file",
      sha,
    });
  }

  async rename(id: string, newId: string): Promise<void> {
    throw new Error("Not implemented");
  }
}

export class GitHubEntry implements Entry<Data> {
  client: Octokit;
  owner: string;
  repo: string;
  path: string;

  constructor(options: Options) {
    this.client = options.client;
    this.owner = options.owner;
    this.repo = options.repo;
    this.path = options.path || "";
  }

  async read(): Promise<Data> {
    const data = await getContent<string>(this.client, {
      mediaType: {
        format: "raw",
      },
      owner: this.owner,
      repo: this.repo,
      path: this.path,
    });

    if (!data) {
      throw new Error(`Item not found: ${this.path}`);
    }

    const transformer = fromFilename(this.path);

    return transformer.toData(data);
  }

  async write(data: Data) {
    const transformer = fromFilename(this.path);
    const content = await transformer.fromData(data);

    const exists = await getContent<{ sha: string }>(this.client, {
      owner: this.owner,
      repo: this.repo,
      path: this.path,
    });

    const sha = exists?.sha;

    await this.client.rest.repos.createOrUpdateFileContents({
      owner: this.owner,
      repo: this.repo,
      path: this.path,
      message: sha ? "Update file" : "Create file",
      content: btoa(content),
      sha,
    });
  }
}

async function getContent<T>(
  client: Octokit,
  options: any,
): Promise<T | undefined> {
  try {
    const result = await client.rest.repos.getContent(options);

    if (result.status !== 200) {
      return;
    }

    return result.data as T;
  } catch (error) {
    console.error(error);
  }
}
