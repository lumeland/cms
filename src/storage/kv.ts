import type { Data, Entry, EntryMetadata, Storage } from "../types.ts";

export interface Options {
  prefix?: string[];
  kv: Deno.Kv;
}

export default class Kv implements Storage {
  prefix: string[];
  kv: Deno.Kv;

  constructor(options: Options) {
    this.prefix = options.prefix || [];
    this.kv = options.kv;
  }

  async *[Symbol.asyncIterator]() {
    for await (const entry of this.kv.list({ prefix: this.prefix })) {
      yield {
        name: entry.key.slice(this.prefix.length).join("/"),
        src: entry.key.join("/"),
      };
    }
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
      name: options.name,
      src: this.key.join("/"),
    };
  }

  async readData(): Promise<Data> {
    const item = await this.kv.get<Data>(this.key);

    if (!item.value) {
      throw new Error(`Item not found: ${this.key.join("/")}`);
    }

    return item?.value;
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
