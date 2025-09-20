import { decodeBase64, encodeBase64, posix } from "../../deps/std.ts";

import type { CommitMessage, GitAPI, GitEntry } from "./types.ts";

export interface Options {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  commitMessage: CommitMessage;
}

export class GitLabAPI implements GitAPI {
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

  #getUrl(route: string, path?: string) {
    const id = encodeURIComponent(`${this.owner}/${this.repo}`);
    if (path?.startsWith("/")) {
      path = path.slice(1);
    }
    const pathname = posix.join(
      "/api/v4/projects",
      id,
      route,
      path ? encodeURIComponent(path) : "",
    );
    return `${this.#baseUrl}${pathname}`;
  }

  async #fetch(url: string, options: RequestInit = {}) {
    options.method ??= "GET";
    const headers = new Headers();
    headers.set("Accept", "application/json");
    headers.set("PRIVATE-TOKEN", this.#token);
    if (options.method !== "GET") {
      headers.set("Content-Type", "application/json");
    }

    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(
        `GitLab API request failed: ${res.status} ${res.statusText}\n${body}`,
      );
    }
    return res;
  }

  async #fetchJson(url: string, options: RequestInit = {}) {
    const res = await this.#fetch(url, options);
    return await res.json();
  }

  /** List the files of a directory. */
  async *listFiles(path = "", depth = 0): AsyncGenerator<GitEntry> {
    if (path?.startsWith("/")) {
      path = path.slice(1);
    }

    try {
      const url = this.#getUrl("/repository/tree") +
        `?ref=${this.branch}&path=${encodeURIComponent(path)}`;
      const result = await this.#fetchJson(url);

      for (const entry of result) {
        if (entry.type === "dir") {
          if (depth) {
            yield* this.listFiles(posix.join(path, entry.name), depth - 1);
          }
          continue;
        }

        yield {
          name: entry.name,
          type: entry.type === "blob" ? "file" : "dir",
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
  async getBinaryContent(path = ""): Promise<Uint8Array | undefined> {
    if (path?.startsWith("/")) {
      path = path.slice(1);
    }
    try {
      const url = this.#getUrl("/repository/files", path) +
        `?ref=${this.branch}`;
      const result = await this.#fetchJson(url);

      return decodeBase64(result.content);
    } catch {
      // Ignore
    }
  }

  async #exists(path: string): Promise<boolean> {
    try {
      const url = this.#getUrl("/repository/files", path) +
        `?ref=${this.branch}`;
      const res = await this.#fetch(url, { method: "HEAD" });
      return res.ok;
    } catch {
      return false;
    }
  }

  async setContent(path: string, content: ArrayBuffer | Uint8Array | string) {
    const exists = await this.#exists(path);
    const url = this.#getUrl("/repository/files", path);
    await this.#fetch(url, {
      method: exists ? "PUT" : "POST",
      body: JSON.stringify({
        branch: this.branch,
        encoding: "base64",
        content: encodeBase64(content),
        commit_message: this.commitMessage({
          action: exists ? "update" : "create",
          path,
        }),
      }),
    });
  }

  /** Delete a file */
  async deleteFile(path: string) {
    const exists = await this.#exists(path);

    if (!exists) {
      throw new Error(`File not found: ${path}`);
    }

    const url = this.#getUrl("/repository/files", path);
    await this.#fetch(url, {
      method: "DELETE",
      body: JSON.stringify({
        commit_message: this.commitMessage({ action: "delete", path }),
        branch: this.branch,
      }),
    });
  }

  /** Rename a file */
  async rename(path: string, newPath: string): Promise<void> {
    const content = await this.getBinaryContent(path);

    if (!content) {
      throw new Error(`File not found: ${path}`);
    }

    const url = this.#getUrl("/repository/files", newPath);
    await this.#fetch(url, {
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
