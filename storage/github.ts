import { posix } from "../deps/std.ts";
import { GitHubAPI } from "./apis/github.ts";
import { BaseGitAPI, defaultCommitMessage } from "./_base_git.ts";

import type { Storage } from "../types.ts";

export class GitHub extends BaseGitAPI<GitHubAPI> {
  static create(repository: string, token: string): GitHub {
    const [owner, repo, ...path] = repository.split("/");

    const api = new GitHubAPI({
      token: token,
      owner: owner,
      repo: repo,
      branch: "main",
      commitMessage: defaultCommitMessage,
    });

    return new GitHub({
      api,
      owner,
      repo,
      path: path.join("/"),
    });
  }

  directory(id: string): Storage {
    return new GitHub({
      api: this.api,
      owner: this.owner,
      repo: this.repo,
      path: posix.join(this.path, id),
    });
  }
}
