import { normalizePath } from "../core/utils/path.ts";
import { slugify } from "../core/utils/string.ts";
import { contentType, globToRegExp, posix } from "../deps/std.ts";
import { fromFilename } from "./transformers/mod.ts";

import type { Data, Entry, EntrySource, Storage } from "../types.ts";

export interface Options {
  root?: string;
  path?: string;
}

export const defaults: Options = {
  path: "**",
};

type MemoryStorage = Map<string, string | Uint8Array>;

/**
 * This storage is similar to FS but stores the data in memory instead of the filesystem.
 * It is useful for testing purposes or when you want to avoid disk I/O.
 */
export default class Memory implements Storage {
  #storage: MemoryStorage;
  root: string;
  path: string;
  extension?: string;

  static create(path = "/") {
    return new Memory({ path });
  }

  constructor(userOptions?: Options, storage: MemoryStorage = new Map()) {
    this.#storage = storage;
    const options = { ...defaults, ...userOptions } as Required<Options>;
    const pos = options.path.indexOf("*");
    options.root ??= "/";

    if (pos === -1) {
      options.root = posix.join(options.root, options.path);
      options.path = "**";
    } else if (pos > 0) {
      options.root = posix.join(options.root, options.path.slice(0, pos));
      options.path = options.path.slice(pos);
    }

    this.root = normalizePath(options.root);
    this.path = options.path;

    // Avoid errors for paths like "src:articles/**/*{.jpg,.png,.gif,.svg}"
    const ext = this.path.match(/\.\w+$/);
    if (ext) {
      this.extension = ext[0];
    }
  }

  async *[Symbol.asyncIterator](): AsyncGenerator<EntrySource> {
    const root = this.root;
    const regexp = globToRegExp(posix.resolve(root, this.path));

    for await (const path of this.#storage.keys()) {
      if (path.includes("/_") || path.includes("/.") || !regexp.test(path)) {
        continue;
      }
      const src = normalizePath(path);
      const name = src.slice(root.length + 1);
      yield {
        name,
        path: posix.join("/", name),
        src,
      };
    }
  }

  source(name: string): EntrySource {
    return {
      src: posix.join(this.root, name),
      name,
      path: posix.join("/", name),
    };
  }

  name(name: string): string {
    const newName = slugify(name);

    return (this.extension && !newName.endsWith(this.extension))
      ? newName + this.extension
      : newName;
  }

  directory(path: string): Storage {
    return new Memory({
      root: this.root,
      path,
    }, this.#storage);
  }

  get(name: string): Entry {
    return new MemoryEntry(this.source(name), this.#storage);
  }

  delete(name: string) {
    const src = posix.join(this.root, name);
    this.#storage.delete(src);
    return Promise.resolve();
  }

  rename(name: string, newName: string) {
    const src = posix.join(this.root, name);
    const entry = this.#storage.get(name);
    if (entry === undefined) {
      throw new Error(`File not found: ${src}`);
    }

    const dest = posix.join(this.root, newName);
    this.#storage.delete(src);
    this.#storage.set(dest, entry);
    return Promise.resolve();
  }
}

export class MemoryEntry implements Entry {
  source: EntrySource;
  #storage: MemoryStorage;

  constructor(source: EntrySource, storage: MemoryStorage) {
    this.source = source;
    this.#storage = storage;
  }

  readText(): Promise<string> {
    const { src } = this.source;
    const content = this.#storage.get(src);

    if (content === undefined) {
      throw new Error(`File not found: ${src}`);
    }

    return Promise.resolve(
      content instanceof Uint8Array
        ? new TextDecoder().decode(content)
        : content,
    );
  }

  writeText(content: string): Promise<void> {
    const { src } = this.source;
    this.#storage.set(src, content);

    return Promise.resolve();
  }

  async readData(): Promise<Data> {
    const { src } = this.source;
    const content = await this.readText();
    const transformer = fromFilename(src);

    return transformer.toData(content);
  }

  async writeData(data: Data) {
    const { src } = this.source;
    const transformer = fromFilename(src);
    const content = (await transformer.fromData(data))
      .replaceAll(/\r\n/g, "\n"); // Unify line endings

    await this.writeText(content);
  }

  readFile(): Promise<File> {
    const { src, name } = this.source;
    const content = this.#storage.get(src);
    if (content === undefined) {
      throw new Error(`File not found: ${src}`);
    }
    const type = contentType(posix.extname(src));
    const data = content instanceof Uint8Array
      ? content
      : new TextEncoder().encode(content);

    return Promise.resolve(new File([new Blob([data])], name, { type }));
  }

  async writeFile(file: File) {
    const { src } = this.source;
    const content = await file.arrayBuffer();
    this.#storage.set(src, new Uint8Array(content));
  }
}
