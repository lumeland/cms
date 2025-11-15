import { posix } from "../deps/std.ts";
import { ForgejoAPI } from "./apis/forgejo.ts";
import { BaseGitAPI, defaultCommitMessage } from "./_base_git.ts";

import type { Storage } from "../types.ts";

export class Codeberg extends BaseGitAPI<ForgejoAPI> {
  static create(repository: string, token: string): Codeberg {
    const [owner, repo, ...path] = repository.split("/");

    const api = new ForgejoAPI("https://codeberg.org", {
      token: token,
      owner: owner,
      repo: repo,
      branch: "main",
      commitMessage: defaultCommitMessage,
    });

    return new Codeberg({
      api,
      owner,
      repo,
      path: path.join("/"),
    });
  }

  directory(id: string): Storage {
    return new Codeberg({
      api: this.api,
      owner: this.owner,
      repo: this.repo,
      path: posix.join(this.path, id),
    });
  }
}

export default Codeberg;
