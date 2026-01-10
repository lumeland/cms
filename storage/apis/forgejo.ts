import { decodeBase64, encodeBase64, posix } from "../../deps/std.ts";

import type { CommitMessage, GitAPI, GitEntry } from "./types.ts";

export interface Options {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  commitMessage: CommitMessage;
}

export class ForgejoAPI implements GitAPI {
  #baseUrl: string;
  #token: string;
  owner: string;
  repo: string;
  branch: string;
  commitMessage: CommitMessage;

  constructor(baseUrl: string, options: Options) {
    this.#baseUrl = baseUrl;
    this.#token = options.token;
    this.owner = options.owner;
    this.repo = options.repo;
    this.branch = options.branch;
    this.commitMessage = options.commitMessage;
  }

  #getUrl(path: string) {
    if (path?.startsWith("/")) {
      path = path.slice(1);
    }
    const pathname = posix.join(
      "/api/v1/repos/",
      this.owner,
      this.repo,
      "contents",
      encodeURIComponent(path ?? ""),
    );
    return `${this.#baseUrl}${pathname}?ref=${this.branch}`;
  }

  async #fetch(path: string, options: RequestInit = {}) {
    options.method ??= "GET";
    const headers = new Headers();
    headers.set("Accept", "application/json");
    headers.set("Authorization", `token ${this.#token}`);
    if (options.method !== "GET") {
      headers.set("Content-Type", "application/json");
    }

    const url = this.#getUrl(path);
    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(
        `Forgejo API request failed: ${res.status} ${res.statusText}\n${body}`,
      );
    }
    return await res.json();
  }

  /** List the files of a directory. */
  async *listFiles(path = "", depth = 0): AsyncGenerator<GitEntry> {
    try {
      const result = await this.#fetch(path);

      for (const entry of result) {
        if (entry.type === "dir") {
          if (depth) {
            yield* this.listFiles(posix.join(path, entry.name), depth - 1);
          }
          continue;
        }
        yield {
          name: entry.name,
          type: entry.type,
          path: entry.path,
        };
      }
    } catch {
      // Ignore
    }
  }

  /** Get the text content of a file. */
  async getTextContent(path = ""): Promise<string | undefined> {
    try {
      const content = await this.getBinaryContent(path);
      return new TextDecoder().decode(content);
    } catch {
      // Ignore
    }
  }

  /** Get the binary content of a file. */
  async getBinaryContent(
    path = "",
  ): Promise<Uint8Array<ArrayBuffer> | undefined> {
    try {
      const result = await this.#fetch(path);
      return decodeBase64(result.content);
    } catch {
      // Ignore
    }
  }

  async #getSha(path: string): Promise<string | undefined> {
    try {
      const exists = await this.#fetch(path);
      return exists.sha;
    } catch {
      // Ignore
    }
  }

  async setContent(path: string, content: ArrayBuffer | Uint8Array | string) {
    const sha = await this.#getSha(path);

    // The file exists
    if (typeof sha === "string") {
      await this.#fetch(path, {
        method: "PUT",
        body: JSON.stringify({
          branch: this.branch,
          content: encodeBase64(content),
          message: this.commitMessage({ action: "update", path }),
          sha,
        }),
      });
      return;
    }

    await this.#fetch(path, {
      method: "POST",
      body: JSON.stringify({
        branch: this.branch,
        content: encodeBase64(content),
        message: this.commitMessage({ action: "create", path }),
      }),
    });
  }

  /** Delete a file */
  async deleteFile(path: string) {
    const sha = await this.#getSha(path);

    if (!sha) {
      throw new Error(`File not found: ${path}`);
    }

    await this.#fetch(path, {
      method: "DELETE",
      body: JSON.stringify({
        message: this.commitMessage({ action: "delete", path }),
        sha,
      }),
    });
  }

  /** Rename a file */
  async rename(path: string, newPath: string): Promise<void> {
    const content = await this.getBinaryContent(path);

    if (!content) {
      throw new Error(`File not found: ${path}`);
    }

    await this.#fetch(newPath, {
      method: "POST",
      body: JSON.stringify({
        content: encodeBase64(content),
        message: this.commitMessage({ action: "update", path }),
      }),
    });

    await this.deleteFile(path);
  }

  getFileUrl(path: string): string {
    return `https://codeberg.org/${this.owner}/${this.repo}/raw/branch/${this.branch}${path}`;
  }
}
