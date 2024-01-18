import type { Versioning } from "../types.ts";

export interface Options {
  root?: string;
  prodBranch?: string;
  prefix?: string;
  git?: string;
}

export const defaults: Required<Options> = {
  root: Deno.cwd(),
  prodBranch: "main",
  prefix: "cms/",
  git: "git",
};

export class Git implements Versioning {
  root: string;
  prodBranch: string;
  git: string;
  prefix: string;

  constructor(userOptions?: Options) {
    const options = { ...defaults, ...userOptions };

    this.root = options.root;
    this.prodBranch = options.prodBranch;
    this.prefix = options.prefix;
    this.git = options.git;
  }

  async *[Symbol.asyncIterator]() {
    const allBranches = await this.#runGitCommand("branch", "--list");

    for (const branch of allBranches.split("\n")) {
      const name = branch.slice(2).trim();

      if (name !== this.prodBranch && !name.startsWith(this.prefix)) {
        continue;
      }

      yield this.#branchToId(name);
    }
  }

  /* Returns the current version */
  async current() {
    const branch = await this.#runGitCommand("branch", "--show-current");
    return this.#branchToId(branch.trim());
  }

  async create(id: string): Promise<void> {
    if (await this.#exists(id)) {
      throw new Error(`Version ${id} already exists`);
    }

    await this.#runGitCommand("checkout", "-b", this.#idToBranch(id));
  }

  /* Changes the current version */
  async change(id: string) {
    if (!(await this.#exists(id))) {
      throw new Error(`Version ${id} does not exist`);
    }

    await this.#runGitCommand("checkout", this.#idToBranch(id));
  }

  /* Publishes a version */
  async publish(id: string): Promise<void> {
    if (!(await this.#exists(id))) {
      throw new Error(`Version ${id} does not exist`);
    }

    await this.#runGitCommand("checkout", this.prodBranch);
    await this.#runGitCommand("merge", this.#idToBranch(id));
  }

  async #exists(id: string): Promise<boolean> {
    const existing = await Array.fromAsync(this);
    return existing.includes(id);
  }

  #idToBranch(id: string): string {
    if (id !== this.prodBranch && !id.startsWith(this.prefix)) {
      id = this.prefix + id;
    }
    return id;
  }

  #branchToId(branch: string): string {
    if (branch.startsWith(this.prefix)) {
      return branch.slice(this.prefix.length);
    }

    return branch;
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
      throw new Error(decoder.decode(result.stderr));
    }

    const decoder = new TextDecoder();
    return decoder.decode(result.stdout);
  }
}
