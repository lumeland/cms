import { join } from "std/path/posix/join.ts";
import { fromFilename } from "./transformers/mod.ts";
import { contentType } from "std/media_types/content_type.ts";
import { extname } from "std/path/extname.ts";
import { Octokit } from "npm:octokit";
import { decodeBase64, encodeBase64 } from "std/encoding/base64.ts";

import type {
  OctokitResponse,
  RequestParameters,
} from "npm:octokit/octokit.d.ts";
import type { Data, Entry, Storage } from "../types.ts";

export interface Options {
  client: Octokit;
  owner: string;
  repo: string;
  path?: string;
}

export class GitHubStorage implements Storage {
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
    const info = await fetchInfo({
      client: this.client,
      owner: this.owner,
      repo: this.repo,
      path: this.path,
    });

    if (!Array.isArray(info)) {
      return;
      // throw new Error(`Invalid directory: ${this.path}`);
    }

    for (const entry of info) {
      if (entry.type === "file") {
        yield entry.name;
      }
    }
  }

  directory(id: string): Storage {
    return new GitHubStorage({
      client: this.client,
      owner: this.owner,
      repo: this.repo,
      path: join(this.path, id),
    });
  }

  get(id: string): Entry {
    return new GitHubEntry({
      client: this.client,
      owner: this.owner,
      repo: this.repo,
      path: join(this.path, id),
    });
  }

  async delete(id: string) {
    const info = await fetchInfo({
      client: this.client,
      owner: this.owner,
      repo: this.repo,
      path: join(this.path, id),
    });

    const sha = info?.sha;

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
    const content = await readBinaryContent({
      client: this.client,
      owner: this.owner,
      repo: this.repo,
      path: join(this.path, id),
    });

    await this.client.rest.repos.createOrUpdateFileContents({
      owner: this.owner,
      repo: this.repo,
      path: join(this.path, newId),
      message: "Rename file",
      content: encodeBase64(content || ""),
    });

    await this.delete(id);
  }
}

export class GitHubEntry {
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

  async readData(): Promise<Data> {
    const data = await readTextContent({
      client: this.client,
      owner: this.owner,
      repo: this.repo,
      path: this.path,
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
    }, content);
  }

  async readFile(): Promise<File> {
    const data = await readBinaryContent({
      client: this.client,
      owner: this.owner,
      repo: this.repo,
      path: this.path,
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
    }, await file.arrayBuffer());
  }
}

async function fetchInfo(
  options: Required<Options>,
  params?: RequestParameters,
): Promise<OctokitResponse | undefined> {
  const { client, owner, repo, path } = options;
  try {
    const result = await client.rest.repos.getContent({
      owner,
      repo,
      path,
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
  options: Required<Options>,
): Promise<string | undefined> {
  const result = await fetchInfo(options, {
    mediaType: {
      format: "raw",
    },
  });

  return result as string;
}

async function readBinaryContent(
  options: Required<Options>,
): Promise<Uint8Array | undefined> {
  const content = await fetchInfo(options, {
    mediaType: {
      format: "base64",
    },
  });

  return content ? decodeBase64(content.content) : undefined;
}

async function writeContent(
  options: Required<Options>,
  content: ArrayBuffer | Uint8Array | string,
) {
  const exists = await fetchInfo(options);
  const sha = exists?.sha;
  const { client, owner, repo, path } = options;

  await client.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message: sha ? "Update file" : "Create file",
    content: encodeBase64(content),
    sha,
  });
}
