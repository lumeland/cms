import { join } from "std/path/posix/join.ts";
import { fromFilename } from "./transformers/mod.ts";
import { contentType } from "std/media_types/content_type.ts";
import { extname } from "std/path/extname.ts";
import { Octokit } from "npm:octokit";
import { encodeBase64 } from "std/encoding/base64.ts";

import type { Data, Entry, Storage } from "../types.ts";

export interface Options {
  client: Octokit;
  owner: string;
  repo: string;
  path?: string;
}

abstract class BaseStorage {
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
      return;
      // throw new Error(`Invalid directory: ${this.path}`);
    }

    for (const entry of data) {
      if (entry.type === "file") {
        yield entry.name;
      }
    }
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
    const content = await getContent<string>(this.client, {
      mediaType: {
        format: "raw",
      },
      owner: this.owner,
      repo: this.repo,
      path: join(this.path, id),
    });

    await this.client.rest.repos.createOrUpdateFileContents({
      owner: this.owner,
      repo: this.repo,
      path: join(this.path, newId),
      message: "Rename file",
      content: btoa(content || ""),
    });

    await this.delete(id);
  }
}

abstract class BaseEntry {
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

  async _read(): Promise<Uint8Array | undefined> {
    const data = await getContent<string>(this.client, {
      mediaType: {
        format: "raw",
      },
      owner: this.owner,
      repo: this.repo,
      path: this.path,
    });

    if (data) {
      return new TextEncoder().encode(data);
    }
  }

  async _write(content: ArrayBuffer | Uint8Array | string) {
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
      content: encodeBase64(content),
      sha,
    });
  }
}

export class GitHubDataStorage extends BaseStorage implements Storage<Data> {
  directory(id: string) {
    return new GitHubDataStorage({
      client: this.client,
      owner: this.owner,
      repo: this.repo,
      path: join(this.path, id),
    });
  }

  get(id: string): GitHubDataEntry {
    return new GitHubDataEntry({
      client: this.client,
      owner: this.owner,
      repo: this.repo,
      path: join(this.path, id),
    });
  }
}

export class GitHubDataEntry extends BaseEntry implements Entry<Data> {
  async read(): Promise<Data> {
    const data = await this._read();
    const transformer = fromFilename(this.path);

    return transformer.toData(new TextDecoder().decode(data));
  }

  async write(data: Data) {
    const transformer = fromFilename(this.path);
    const content = await transformer.fromData(data);
    await this._write(content);
  }
}

export class GitHubFileStorage extends BaseStorage implements Storage<File> {
  directory(id: string) {
    return new GitHubFileStorage({
      client: this.client,
      owner: this.owner,
      repo: this.repo,
      path: join(this.path, id),
    });
  }

  get(id: string): GitHubFileEntry {
    return new GitHubFileEntry({
      client: this.client,
      owner: this.owner,
      repo: this.repo,
      path: join(this.path, id),
    });
  }
}

export class GitHubFileEntry extends BaseEntry implements Entry<File> {
  async read(): Promise<File> {
    const data = await this._read();
    const type = contentType(extname(this.path));

    if (!data) {
      throw new Error(`File not found: ${this.path}`);
    }

    return new File([new Blob([data])], this.path, { type });
  }

  async write(file: File) {
    await this._write(await file.arrayBuffer());
  }
}

async function getContent<T>(
  client: Octokit,
  // deno-lint-ignore no-explicit-any
  options: any,
): Promise<T | undefined> {
  try {
    const result = await client.rest.repos.getContent(options);

    if (result.status !== 200) {
      return;
    }

    return result.data as T;
  } catch {
    // Ignore
  }
}
