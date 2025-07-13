import { slugify } from "../core/utils/string.ts";

import type { Data, Entry, EntryMetadata, Storage } from "../types.ts";

export interface Options {
  prefix?: string[];
  kv: Deno.Kv;
}

export default class Kv implements Storage {
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

  async *[Symbol.asyncIterator]() {
    for await (const entry of this.kv.list({ prefix: this.prefix })) {
      const name = entry.key.slice(this.prefix.length).join("/");
      yield {
        label: name,
        name,
        src: entry.key.join("/"),
      };
    }
  }

  name(name: string): string {
    return slugify(name);
  }

  directory(name: string): Storage {
    return new Kv({
      kv: this.kv,
      prefix: key(this.prefix, name),
    });
  }

  get(name: string): Entry {
    return new KvEntry({
      kv: this.kv,
      prefix: this.prefix,
      name,
    });
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

export interface DocumentOptions extends Options {
  kv: Deno.Kv;
  prefix: string[];
  name: string;
}

export class KvEntry implements Entry {
  metadata: EntryMetadata;
  kv: Deno.Kv;
  key: string[];

  constructor(options: DocumentOptions) {
    this.kv = options.kv;
    this.key = [...options.prefix, ...options.name.split("/")];
    this.metadata = {
      label: options.name,
      name: options.name,
      src: this.key.join("/"),
    };
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
    const item = await this.kv.get<Data>(this.key);

    if (!item.value) {
      throw new Error(`Item not found: ${this.key.join("/")}`);
    }

    return item.value;
  }

  async writeData(data: Data) {
    await this.kv.set(this.key, data);
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
