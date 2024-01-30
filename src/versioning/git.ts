import type { Versioning } from "../types.ts";

export interface Options {
  root?: string;
  prodBranch?: string;
  prefix?: string;
  git?: string;
  remote?: string;
}

export const defaults: Required<Omit<Options, "remoteUrl">> = {
  root: Deno.cwd(),
  prodBranch: "main",
  prefix: "lumecms/",
  git: "git",
  remote: "origin",
};

export class Git implements Versioning {
  root: string;
  prodBranch: string;
  git: string;
  prefix: string;
  remote: string;

  constructor(userOptions?: Options) {
    const options = { ...defaults, ...userOptions };

    this.root = options.root;
    this.prodBranch = options.prodBranch;
    this.prefix = options.prefix;
    this.git = options.git;
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
    if (await this.#exists(name)) {
      throw new Error(`Version ${name} already exists`);
    }

    await this.#runGitCommand("checkout", "-b", this.#nameToBranch(name));
  }

  /* Changes the current version */
  async change(name: string) {
    if (!(await this.#exists(name))) {
      throw new Error(`Version ${name} does not exist`);
    }

    await this.#commit();
    await this.#runGitCommand("checkout", this.#nameToBranch(name));
    await this.#pull();
  }

  /* Publishes a version */
  async publish(name: string): Promise<void> {
    if (!(await this.#exists(name))) {
      throw new Error(`Version ${name} does not exist`);
    }

    const branch = this.#nameToBranch(name);

    await this.change(this.prodBranch);

    if (branch !== this.prodBranch) {
      await this.#runGitCommand("merge", branch);
      await this.#runGitCommand("branch", "-d", branch);
    }

    await this.#runGitCommand("push", this.remote, this.prodBranch);
  }

  /* Deletes a version */
  async delete(name: string): Promise<void> {
    if (!(await this.#exists(name))) {
      return;
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
    const command = new Deno.Command(this.git, {
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
