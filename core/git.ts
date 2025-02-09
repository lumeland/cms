import { slugify } from "./utils/string.ts";

import type { Versioning } from "../types.ts";

export interface Options {
  root?: string;
  prodBranch?: string;
  prefix?: string;
  command?: string;
  remote?: string;
  onPublish?: (name: string) => void | Promise<void>;
}

export const defaults: Required<Omit<Options, "onPublish">> = {
  root: Deno.cwd(),
  prodBranch: "main",
  prefix: "lumecms/",
  command: "git",
  remote: "origin",
};

export class Git implements Versioning {
  root: string;
  prodBranch: string;
  command: string;
  prefix: string;
  remote: string;
  onPublish?: (name: string) => void | Promise<void>;

  constructor(userOptions?: Options) {
    const options = { ...defaults, ...userOptions };

    this.root = options.root;
    this.prodBranch = options.prodBranch;
    this.prefix = options.prefix;
    this.command = options.command;
    this.remote = options.remote;
  }

  async *[Symbol.asyncIterator]() {
    const current = await this.current();
    const allBranches = await this.#runGitCommand("branch", "--list");

    for (const item of allBranches.split("\n")) {
      const branch = item.slice(2).trim();

      if (branch !== this.prodBranch && !branch.startsWith(this.prefix)) {
        continue;
      }

      const name = this.#branchToName(branch);
      yield {
        name,
        isCurrent: name === current.name,
        isProduction: name === this.prodBranch,
      };
    }
  }

  /* Returns the current version */
  async current() {
    const branch = await this.#runGitCommand("branch", "--show-current");
    const name = this.#branchToName(branch.trim());

    return {
      name,
      isCurrent: true,
      isProduction: name === this.prodBranch,
    };
  }

  /* Creates a new version */
  async create(name: string): Promise<void> {
    name = slugify(name);

    if (await this.#exists(name)) {
      throw new Error(`Version ${name} already exists`);
    }

    await this.#runGitCommand("checkout", "-b", this.#nameToBranch(name));
  }

  /* Changes the current version */
  async change(name: string) {
    name = slugify(name);

    if (!(await this.#exists(name))) {
      throw new Error(`Version ${name} does not exist`);
    }

    // Commit changes before changing the branch
    await this.#commit();

    // Checkout to the version branch and pull possible changes
    await this.#runGitCommand("checkout", this.#nameToBranch(name));
    await this.#pull();
  }

  /* Publishes a version */
  async publish(name: string): Promise<void> {
    if (!(await this.#exists(name))) {
      throw new Error(`Version ${name} does not exist`);
    }

    // Get the branch name
    const branch = this.#nameToBranch(name);

    // Checkout to the production branch and pull possible changes
    await this.change(this.prodBranch);
    await this.#pull();

    // Merge the version branch into the production branch
    if (branch !== this.prodBranch) {
      await this.#runGitCommand("merge", branch);
      await this.#runGitCommand("branch", "-d", branch);
    }

    // Push changes to the remote
    await this.#runGitCommand("push", this.remote, this.prodBranch);

    // Call the onPublish callback
    if (this.onPublish) {
      await this.onPublish(name);
    }
  }

  /* Delete a version */
  async delete(name: string): Promise<void> {
    if (!(await this.#exists(name))) {
      return;
    }

    if (name === this.prodBranch) {
      throw new Error(`Cannot delete production branch`);
    }

    // If the current branch is the one to be deleted,
    // change to the production branch
    const current = await this.current();

    if (current.name === name) {
      await this.change(this.prodBranch);
    }

    const branch = this.#nameToBranch(name);
    await this.#runGitCommand("branch", "-D", branch);
  }

  async #exists(name: string): Promise<boolean> {
    const existing = await Array.fromAsync(this);
    return existing.some((version) => version.name === name);
  }

  #nameToBranch(name: string): string {
    if (name !== this.prodBranch && !name.startsWith(this.prefix)) {
      name = this.prefix + name;
    }
    return name;
  }

  #branchToName(branch: string): string {
    if (branch.startsWith(this.prefix)) {
      return branch.slice(this.prefix.length);
    }

    return branch;
  }

  async #pull(): Promise<void> {
    const current = await this.#runGitCommand("branch", "--show-current");

    // Check if the current branch exists in the remote and pull it
    const branches = await this.#runGitCommand(
      "ls-remote",
      "--heads",
      this.remote,
      current,
    );

    if (branches) {
      await this.#runGitCommand("pull", this.remote, current);
    }
  }

  async #commit(message = "Changes from CMS"): Promise<void> {
    await this.#pull();
    await this.#runGitCommand("add", ".");

    const changes = await this.#runGitCommand("status", "--porcelain");

    if (changes) {
      await this.#runGitCommand("commit", "-m", message);
    }
  }

  async #runGitCommand(...args: string[]): Promise<string> {
    const command = new Deno.Command(this.command, {
      args,
      cwd: this.root,
      stdout: "piped",
      stderr: "piped",
    });

    const result = await command.output();

    if (result.code !== 0) {
      const decoder = new TextDecoder();
      throw new Error(`
Git error:
${decoder.decode(result.stdout)}
${decoder.decode(result.stderr)}
`);
    }

    const decoder = new TextDecoder();
    return decoder.decode(result.stdout);
  }
}
