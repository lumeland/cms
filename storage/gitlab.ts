import { posix } from "../deps/std.ts";
import { GitLabAPI } from "./apis/gitlab.ts";
import { BaseGitAPI, defaultCommitMessage } from "./_base_git.ts";

import type { Storage } from "../types.ts";

export class GitLab extends BaseGitAPI<GitLabAPI> {
  static create(repository: string, token: string): GitLab {
    const [owner, repo, ...path] = repository.split("/");

    const api = new GitLabAPI("https://gitlab.com", {
      token: token,
      owner: owner,
      repo: repo,
      branch: "main",
      commitMessage: defaultCommitMessage,
    });

    return new GitLab({
      api,
      owner,
      repo,
      path: path.join("/"),
    });
  }

  directory(id: string): Storage {
    return new GitLab({
      api: this.api,
      owner: this.owner,
      repo: this.repo,
      path: posix.join(this.path, id),
    });
  }
}

export default GitLab;
