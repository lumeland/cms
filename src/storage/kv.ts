import type { Data, Entry, Storage } from "../types.ts";

export interface Options {
  prefix?: string[];
  kv: Deno.Kv;
}

export class KvStorage implements Storage {
  prefix: string[];
  kv: Deno.Kv;

  constructor(options: Options) {
    this.prefix = options.prefix || [];
    this.kv = options.kv;
  }

  #getKey(id: string) {
    return [...this.prefix, ...id.split("/")];
  }

  async *[Symbol.asyncIterator]() {
    for await (const entry of this.kv.list({ prefix: this.prefix })) {
      yield entry.key.slice(this.prefix.length).join("/");
    }
  }

  directory(id: string): Storage {
    const prefix = this.#getKey(id);
    return new KvStorage({ kv: this.kv, prefix });
  }

  get(id: string): Entry {
    const key = this.#getKey(id);
    return new KvEntry({ kv: this.kv, key });
  }

  async delete(id: string) {
    const key = this.#getKey(id);
    await this.kv.delete(key);
  }

  async rename(id: string, newId: string) {
    const key = this.#getKey(id);
    const newKey = this.#getKey(newId);
    const data = await this.kv.get(key);

    if (!data) {
      throw new Error(`Item not found: ${id}`);
    }

    await this.kv.set(newKey, data.value);
    await this.kv.delete(key);
  }
}

export interface DocumentOptions extends Options {
  kv: Deno.Kv;
  key: string[];
}

export class KvEntry implements Entry {
  key: string[];
  kv: Deno.Kv;

  constructor(options: DocumentOptions) {
    this.key = options.key;
    this.kv = options.kv;
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
