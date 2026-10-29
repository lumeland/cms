import { join } from "../deps/path.ts";
import { GitHubAPI } from "./api.ts";
import { BaseGitAPI, defaultCommitMessage } from "@lumeland/cms/storage/base-git.ts";

import type { Storage } from "@lumeland/cms/types.ts";

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
      path: join(this.path, id),
    });
  }
}

export default GitHub;
