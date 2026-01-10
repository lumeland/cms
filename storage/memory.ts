import { normalizeName, normalizePath } from "../core/utils/path.ts";
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
export class Memory implements Storage {
  #storage: MemoryStorage;
  root: string;
  path: string;
  pattern: string;
  extension?: string;

  static create(path = "/") {
    return new Memory({ path });
  }

  get storageMap() {
    return this.#storage;
  }

  constructor(userOptions?: Options, storage: MemoryStorage = new Map()) {
    this.#storage = storage;
    const options = { ...defaults, ...userOptions } as Required<Options>;
    this.root = normalizePath(options.root ?? "/");
    const pos = options.path.indexOf("*");

    if (pos === -1) {
      this.path = options.path;
      this.pattern = "**";
    } else if (pos === 0) {
      this.path = "";
      this.pattern = options.path;
    } else {
      this.path = options.path.slice(0, pos);
      this.pattern = options.path.slice(pos);
    }

    // Avoid errors for paths like "src:articles/**/*{.jpg,.png,.gif,.svg}"
    const ext = this.pattern.match(/\.\w+$/);
    if (ext) {
      this.extension = ext[0];
    }
  }

  async *[Symbol.asyncIterator](): AsyncGenerator<EntrySource> {
    const { root, path, pattern } = this;
    const regexp = globToRegExp(posix.join(root, path, pattern));

    for await (const entry of this.#storage.keys()) {
      if (entry.includes("/_") || entry.includes("/.") || !regexp.test(entry)) {
        continue;
      }
      const src = normalizePath(entry);
      const name = normalizeName(src.slice(root.length + path.length));
      yield {
        name,
        path: posix.join("/", path, name),
        src,
      };
    }
  }

  source(name: string): EntrySource {
    return {
      src: posix.join(this.root, this.path, name),
      name,
      path: posix.join("/", this.path, name),
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
      root: posix.join(this.root, this.path),
      path,
    }, this.#storage);
  }

  get(name: string): Entry {
    return new MemoryEntry(this.source(name), this);
  }

  delete(name: string) {
    const src = posix.join(this.root, this.path, name);
    this.#storage.delete(src);
    return Promise.resolve();
  }

  rename(name: string, newName: string) {
    const src = posix.join(this.root, this.path, name);
    const dest = posix.join(this.root, this.path, newName);

    const entry = this.#storage.get(src);
    if (entry === undefined) {
      throw new Error(`File not found: ${src}`);
    }

    this.#storage.delete(src);
    this.#storage.set(dest, entry);
    return Promise.resolve();
  }
}

export default Memory;

export class MemoryEntry implements Entry {
  source: EntrySource;
  #storage: Memory;

  constructor(source: EntrySource, storage: Memory) {
    this.source = source;
    this.#storage = storage;
  }

  get storage() {
    return this.#storage;
  }

  readText(): Promise<string> {
    const { src } = this.source;
    const content = this.#storage.storageMap.get(src);

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
    this.#storage.storageMap.set(src, content);

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
    const content = this.#storage.storageMap.get(src);
    if (content === undefined) {
      throw new Error(`File not found: ${src}`);
    }
    const type = contentType(posix.extname(src));
    const data = content instanceof Uint8Array
      ? content as Uint8Array<ArrayBuffer>
      : new TextEncoder().encode(content);

    return Promise.resolve(new File([new Blob([data])], name, { type }));
  }

  async writeFile(file: File) {
    const { src } = this.source;
    const content = await file.arrayBuffer();
    this.#storage.storageMap.set(src, new Uint8Array(content));
  }
}
