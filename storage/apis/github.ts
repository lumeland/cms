import { encodeBase64, posix } from "../../deps/std.ts";
import { Octokit } from "npm:octokit@5.0.3";

import type { CommitMessage, GitAPI, GitEntry } from "./types.ts";

export interface Options {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  commitMessage: CommitMessage;
}

export class GitHubAPI implements GitAPI {
  #client: Octokit;
  owner: string;
  repo: string;
  branch: string;
  commitMessage: CommitMessage;

  constructor(options: Options) {
    this.#client = new Octokit({ auth: options.token });
    this.owner = options.owner;
    this.repo = options.repo;
    this.branch = options.branch;
    this.commitMessage = options.commitMessage;
  }

  /** List the files of a directory. */
  async *listFiles(path = "", depth = 0): AsyncGenerator<GitEntry> {
    path = removeLeadingSlash(path);

    try {
      const result = await this.#client.rest.repos.getContent({
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
    path = removeLeadingSlash(path);

    try {
      const result = await this.#client.rest.repos.getContent({
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
  async getBinaryContent(
    path = "",
  ): Promise<Uint8Array<ArrayBuffer> | undefined> {
    path = removeLeadingSlash(path);

    // https://github.com/octokit/rest.js/issues/14#issuecomment-584413497
    const endpoint = this.#client.rest.repos.getContent.endpoint({
      owner: this.owner,
      repo: this.repo,
      ref: this.branch,
      path,
      mediaType: {
        format: "raw",
      },
    });

    const auth = await this.#client.auth() as { token: string };
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
    path = removeLeadingSlash(path);
    let sha: string | undefined;

    try {
      const exists = await this.#client.rest.repos.getContent({
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

    await this.#client.rest.repos.createOrUpdateFileContents({
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
    path = removeLeadingSlash(path);
    const result = await this.#client.rest.repos.getContent({
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

    await this.#client.rest.repos.deleteFile({
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
    path = removeLeadingSlash(path);
    newPath = removeLeadingSlash(newPath);

    const content = await this.getBinaryContent(path);

    if (!content) {
      throw new Error(`File not found: ${path}`);
    }

    await this.#client.rest.repos.createOrUpdateFileContents({
      owner: this.owner,
      repo: this.repo,
      branch: this.branch,
      path: newPath,
      message: this.commitMessage({ action: "update", path }),
      content: encodeBase64(content),
    });

    await this.deleteFile(path);
  }

  getFileUrl(path: string): string {
    return `https://raw.githubusercontent.com/${this.owner}/${this.repo}/${this.branch}${path}`;
  }
}

function removeLeadingSlash(path: string) {
  return path.startsWith("/") ? path.slice(1) : path;
}
