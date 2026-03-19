import { slugify } from "./utils/string.ts";

import type User from "./user.ts";

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

export default class Git {
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
  change(user: User, name: string) {
    const branch = this.#nameToBranch(name);

    // Check if the version exists
    if (!this.#gitLocalBranchExists(branch)) {
      throw new Error(`Version ${name} does not exist`);
    }

    const currentBranch = this.#gitCurrentBranch();

    // Update the current branch before changing
    if (currentBranch !== this.prodBranch) {
      this.sync(user);
    } else {
      this.#gitCommit(user);
    }

    // Checkout to the new branch and update
    this.#git("checkout", branch);
    this.update();
  }

  /* Publishes a version */
  publish(user: User, name: string): void {
    const branch = this.#nameToBranch(name);

    if (!this.#gitLocalBranchExists(branch)) {
      throw new Error(`Version ${name} does not exist`);
    }

    this.change(user, this.prodBranch);

    if (branch !== this.prodBranch) {
      this.#git("merge", branch);
      this.sync(user);
      this.delete(user, name);
    } else {
      this.sync(user);
    }
  }

  /* Delete a version */
  delete(user: User, name: string): void {
    const branch = this.#nameToBranch(name);

    if (branch === this.prodBranch) {
      throw new Error(`Cannot delete production branch`);
    }

    // If the current branch is the one to be deleted,
    // change to the production branch
    if (branch === this.#gitCurrentBranch()) {
      this.change(user, this.prodBranch);
    }

    this.#git("branch", "-D", branch);

    // If the branch exists in the remote, delete it there too
    if (this.#gitRemoteBranchExists(branch)) {
      this.#git("push", this.remote, "--delete", branch);
    }
  }

  /** Updates the current branch (pull) */
  update(): void {
    const branch = this.#gitCurrentBranch();

    if (this.#gitRemoteBranchExists(branch)) {
      try {
        this.#git("pull", this.remote, branch);
      } catch {
        // Ignore.
      }
    }
  }

  /* Sync the current branch (pull & push) */
  sync(user: User): void {
    this.update();
    this.#gitCommit(user);
    this.#git("push", this.remote, this.#gitCurrentBranch());
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
    const [cmd, ...rest] = args;

    const command = new Deno.Command(this.command, {
      args: [cmd, ...rest],
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
  #gitCurrentBranch(): string {
    return this.#git("branch", "--show-current");
  }
  #gitCommit(user: User): void {
    const pendingChanges = this.#git("status", "--porcelain") !== "";

    if (pendingChanges) {
      this.#git("add", ".");

      // Add the current user as author
      const name = user.name;
      const email = user.email;
      this.#git(
        "commit",
        `--author=${name}${email ? ` <${email}>` : "<>"}`,
        "-m",
        "Changes from CMS",
      );
    }
  }
}

export interface Version {
  name: string;
  isCurrent: boolean;
  isProduction: boolean;
}
