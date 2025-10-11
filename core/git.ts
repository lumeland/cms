import { slugify } from "./utils/string.ts";

import type { Versioning } from "../types.ts";

export interface Options {
  root?: string;
  prodBranch?: string;
  branchPrefix?: string;
  command?: string;
  remote?: string;
}

export const defaults: Options = {
  prodBranch: "main",
  branchPrefix: "lumecms/",
  command: "git",
  remote: "origin",
};

export class Git implements Versioning {
  root: string;
  prodBranch: string;
  command: string;
  branchPrefix: string;
  remote: string;

  constructor(userOptions?: Options) {
    const options = { ...defaults, ...userOptions } as Required<Options>;

    this.root = options.root ?? Deno.cwd();
    this.prodBranch = options.prodBranch;
    this.branchPrefix = options.branchPrefix;
    this.command = options.command;
    this.remote = options.remote;
  }

  *[Symbol.iterator](): Generator<Version> {
    const current = this.#gitCurrentBranch();
    const allBranches = new Set([
      current,
      ...this.#git("branch", "--list")
        .split("\n")
        .map((b) => b.replace("*", "").trim()),
    ]);

    for (const branch of allBranches) {
      if (branch !== this.prodBranch && !branch.startsWith(this.branchPrefix)) {
        continue;
      }

      yield {
        name: this.#branchToName(branch),
        isCurrent: branch === current,
        isProduction: branch === this.prodBranch,
      };
    }
  }

  /* Returns the current version */
  current(): Version {
    const branch = this.#gitCurrentBranch();
    const name = this.#branchToName(branch);

    return {
      name,
      isCurrent: true,
      isProduction: branch === this.prodBranch,
    };
  }

  /* Creates a new version */
  create(name: string): void {
    const branch = this.#nameToBranch(name);

    // Check if the version already exists
    if (this.#gitLocalBranchExists(branch)) {
      throw new Error(`Version ${name} already exists (${branch})`);
    }

    this.#git("checkout", "-b", branch, this.prodBranch);
  }

  /* Changes the current version */
  change(name: string) {
    const branch = this.#nameToBranch(name);

    // Check if the version exists
    if (!this.#gitLocalBranchExists(branch)) {
      throw new Error(`Version ${name} does not exist`);
    }

    const currentBranch = this.#gitCurrentBranch();

    // If the current branch exists in the remote, pull changes
    if (this.#gitRemoteBranchExists(currentBranch)) {
      try {
        this.#git("pull", this.remote, currentBranch);
      } catch {
        // Ignore.
      }
    }

    // If there are pending changes, commit them before changing the branch
    if (this.#gitPendingChanges()) {
      // Add and commit changes
      this.#git("add", ".");
      this.#git("commit", "-m", "Changes from CMS");
    }

    // If the current branch is not the production branch, push changes to the remote
    if (currentBranch !== this.prodBranch) {
      this.#git("push", this.remote, currentBranch);
    }

    // Checkout to the new branch
    this.#git("checkout", branch);

    // Pull changes from the remote if exists
    if (this.#gitRemoteBranchExists(branch)) {
      this.#git("pull", this.remote, branch);
    }
  }

  /* Publishes a version */
  publish(name: string): void {
    const branch = this.#nameToBranch(name);

    // Check if the version exists
    if (!this.#gitLocalBranchExists(branch)) {
      throw new Error(`Version ${name} does not exist`);
    }

    // Change to the production branch
    this.change(this.prodBranch);

    // If the version to publish is not production,
    // merge it into the production branch and remove it
    if (branch !== this.prodBranch) {
      this.#git("merge", branch);
      // Push changes to the remote before deleting the branch
      this.#git("push", this.remote, this.prodBranch);
      this.#git("branch", "-d", branch);
      // If the branch exists in the remote, delete it there too
      if (this.#gitRemoteBranchExists(branch)) {
        this.#git("push", this.remote, "--delete", branch);
      }
    } else {
      // Push changes to the remote
      this.#git("push", this.remote, this.prodBranch);
    }
  }

  /* Delete a version */
  delete(name: string): void {
    const branch = this.#nameToBranch(name);

    if (branch === this.prodBranch) {
      throw new Error(`Cannot delete production branch`);
    }

    // If the current branch is the one to be deleted,
    // change to the production branch
    if (branch === this.#gitCurrentBranch()) {
      this.change(this.prodBranch);
    }

    this.#git("branch", "-D", branch);

    // If the branch exists in the remote, delete it there too
    if (this.#gitRemoteBranchExists(branch)) {
      this.#git("push", this.remote, "--delete", branch);
    }
  }

  /** Converts a version name to a branch name */
  #nameToBranch(name: string): string {
    name = slugify(name);
    if (name !== this.prodBranch && !name.startsWith(this.branchPrefix)) {
      name = this.branchPrefix + name;
    }
    return name;
  }

  /** Converts a branch name to a version name */
  #branchToName(branch: string): string {
    if (branch.startsWith(this.branchPrefix)) {
      return branch.slice(this.branchPrefix.length);
    }

    return branch;
  }

  /** Runs a git command and returns the stdout as string */
  #git(...args: string[]): string {
    const command = new Deno.Command(this.command, {
      args,
      cwd: this.root,
      stdout: "piped",
      stderr: "piped",
    });

    const result = command.outputSync();

    if (result.code !== 0) {
      const decoder = new TextDecoder();
      throw new Error(`
Git error:
${decoder.decode(result.stdout)}
${decoder.decode(result.stderr)}
`);
    }

    const decoder = new TextDecoder();
    return decoder.decode(result.stdout).trim();
  }

  #gitLocalBranchExists(branch: string): boolean {
    return this.#git("branch", "--list", branch) !== "";
  }

  #gitRemoteBranchExists(branch: string): boolean {
    return this.#git("ls-remote", "--heads", this.remote, branch) !== "";
  }
  #gitPendingChanges(): boolean {
    return this.#git("status", "--porcelain") !== "";
  }
  #gitCurrentBranch(): string {
    return this.#git("branch", "--show-current");
  }
}

export interface Version {
  name: string;
  isCurrent: boolean;
  isProduction: boolean;
}
