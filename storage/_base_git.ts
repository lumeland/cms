import { contentType, extname, globToRegExp, posix } from "../deps/std.ts";
import { fromFilename } from "./transformers/mod.ts";
import { slugify } from "../core/utils/string.ts";
import { normalizePath } from "../core/utils/path.ts";

import type { CommitMessage, GitAPI } from "./apis/types.ts";
import type { Data, Entry, EntrySource, Storage } from "../types.ts";

export interface Options<API extends GitAPI> {
  api: API;
  owner: string;
  repo: string;
  path: string;
}

export const defaultCommitMessage: CommitMessage = function ({ action, path }) {
  switch (action) {
    case "create":
      return `Create file ${path}`;
    case "update":
      return `Update file ${path}`;
    case "delete":
      return `Delete file ${path}`;
  }
};

export abstract class BaseGitAPI<API extends GitAPI> implements Storage {
  api: API;
  owner: string;
  repo: string;
  path: string;
  pattern: string;
  extension?: string;

  constructor(options: Options<API>) {
    this.api = options.api;
    this.owner = options.owner;
    this.repo = options.repo;
    [this.path, this.pattern, this.extension] = parsePath(options.path);
  }

  async *[Symbol.asyncIterator](): AsyncGenerator<EntrySource> {
    const regexp = globToRegExp(this.pattern, { extended: true });
    const depth = getDepth(this.pattern);
    const offsetPath = this.path.length;

    for await (const entry of this.api.listFiles(this.path, depth)) {
      if (entry.type === "file") {
        const name = offsetPath ? entry.path.slice(offsetPath) : entry.path;

        if (!regexp.test(name)) {
          continue;
        }

        const path = posix.join(this.path, name);

        yield {
          name,
          path,
          src: this.api.getFileUrl(path),
        };
      }
    }
  }

  source(name: string): EntrySource {
    const path = posix.join("/", this.path, name);
    return {
      name: name,
      path,
      src: this.api.getFileUrl(path),
    };
  }

  name(name: string): string {
    const newName = slugify(name);

    return (this.extension && !newName.endsWith(this.extension))
      ? newName + this.extension
      : newName;
  }

  abstract directory(id: string): Storage;

  get(name: string): Entry {
    return new GitAPIEntry(this.source(name), this);
  }

  async delete(name: string) {
    const path = posix.join(this.path, name);
    await this.api.deleteFile(path);
  }

  async rename(name: string, newName: string): Promise<void> {
    name = posix.join(this.path, name);
    newName = posix.join(this.path, newName);

    await this.api.rename(name, newName);
  }
}

export class GitAPIEntry implements Entry {
  readonly source: EntrySource;
  #storage: BaseGitAPI<GitAPI>;

  constructor(source: EntrySource, storage: BaseGitAPI<GitAPI>) {
    this.source = source;
    this.#storage = storage;
  }

  get storage() {
    return this.#storage;
  }

  async readText(): Promise<string> {
    return await this.#storage.api.getTextContent(this.source.path) || "";
  }

  async writeText(content: string): Promise<void> {
    await this.#storage.api.setContent(this.source.path, content);
  }

  async readData(): Promise<Data> {
    const data = await this.readText();
    const transformer = fromFilename(this.source.path);
    return transformer.toData(data);
  }

  async writeData(data: Data) {
    const transformer = fromFilename(this.source.path);
    const content = (await transformer.fromData(data))
      .replaceAll(/\r\n/g, "\n"); // Unify line endings

    await this.writeText(content);
  }

  async readFile(): Promise<File> {
    const data = await this.#storage.api.getBinaryContent(this.source.path);

    if (!data) {
      throw new Error(`File not found: ${this.source.path}`);
    }

    const type = contentType(extname(this.source.path));

    return new File([new Blob([data])], this.source.path, { type });
  }

  async writeFile(file: File) {
    await this.#storage.api.setContent(
      this.source.path,
      await file.arrayBuffer(),
    );
  }
}

function parsePath(path: string): [string, string, string?] {
  path = normalizePath(path);

  const pos = path.indexOf("*");

  // path does not contain * (e.g. "posts")
  if (pos === -1) {
    return [path, "**"];
  }

  // path contains * (e.g. "posts/*.md")
  if (pos > 0) {
    const base = path.slice(0, pos - 1);
    const pattern = path.slice(pos);
    const extension = posix.extname(path);
    return [base, pattern, extension];
  }

  // path starts with * (e.g. "*.md")
  return ["", path, undefined];
}

function getDepth(pattern: string): number {
  if (pattern.includes("**/")) {
    return Infinity;
  }

  if (pattern.includes("*/")) {
    return 1;
  }

  return 0;
}
