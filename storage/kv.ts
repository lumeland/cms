import { slugify } from "../core/utils/string.ts";

import type { Data, Entry, EntrySource, Storage } from "../types.ts";

export interface Options {
  prefix?: string[];
  kv: Deno.Kv;
}

export class Kv implements Storage {
  prefix: string[];
  kv: Deno.Kv;

  static async create(path?: string) {
    const kv = await Deno.openKv(path);
    return new Kv({ kv });
  }

  constructor(options: Options) {
    this.prefix = options.prefix || [];
    this.kv = options.kv;
  }

  async *[Symbol.asyncIterator](): AsyncGenerator<EntrySource> {
    for await (const entry of this.kv.list({ prefix: this.prefix })) {
      const name = entry.key.slice(this.prefix.length).join("/");
      const path = entry.key.join("/");

      yield {
        name,
        path,
        src: path,
      };
    }
  }

  name(name: string): string {
    return slugify(name);
  }

  source(name: string): EntrySource {
    const path = key(this.prefix, name).join("/");

    return {
      name,
      path,
      src: path,
    };
  }

  directory(name: string): Storage {
    return new Kv({
      kv: this.kv,
      prefix: key(this.prefix, name),
    });
  }

  get(name: string): Entry {
    return new KvEntry(this.source(name), this);
  }

  async delete(name: string) {
    await this.kv.delete(key(this.prefix, name));
  }

  async rename(name: string, newName: string) {
    const oldKey = key(this.prefix, name);
    const newKey = key(this.prefix, newName);
    const data = await this.kv.get(oldKey);

    if (!data) {
      throw new Error(`Item not found: ${name}`);
    }

    await this.kv.set(newKey, data.value);
    await this.kv.delete(oldKey);
  }
}

export default Kv;

export class KvEntry implements Entry {
  source: EntrySource;
  #storage: Kv;

  constructor(source: EntrySource, kv: Kv) {
    this.#storage = kv;
    this.source = source;
  }

  get storage() {
    return this.#storage;
  }

  async readText(): Promise<string> {
    const data = await this.readData();
    return JSON.stringify(data, null, 2);
  }

  async writeText(content: string): Promise<void> {
    const data = JSON.parse(content) as Data;
    await this.writeData(data);
  }

  async readData(): Promise<Data> {
    const { src } = this.source;
    const item = await this.#storage.kv.get<Data>(src.split("/"));

    if (!item.value) {
      throw new Error(`Item not found: ${src}`);
    }

    return item.value;
  }

  async writeData(data: Data) {
    const { src } = this.source;
    await this.#storage.kv.set(src.split("/"), data);
  }

  readFile(): Promise<File> {
    throw new Error("Binary files not allowed in KV storage");
  }

  writeFile(): Promise<void> {
    throw new Error("Binary files not allowed in KV storage");
  }
}

function key(prefix: string[], name: string) {
  return [...prefix, ...name.split("/")];
}
