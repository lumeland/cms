import Document from "./document.ts";

import type { EntryMetadata, ResolvedField, Storage } from "../types.ts";

export default class Collection {
  name: string;
  #storage: Storage;
  #fields: ResolvedField[];

  constructor(name: string, storage: Storage, fields: ResolvedField[]) {
    this.name = name;
    this.#storage = storage;
    this.#fields = fields;
  }

  get fields() {
    return this.#fields;
  }

  async *[Symbol.asyncIterator](): AsyncGenerator<EntryMetadata> {
    for await (const metadata of this.#storage) {
      yield metadata;
    }
  }

  create(id: string): Document {
    return new Document(this.#storage.get(id), this.#fields, true);
  }

  get(id: string): Document {
    return new Document(this.#storage.get(id), this.#fields);
  }

  async delete(id: string): Promise<void> {
    await this.#storage.delete(id);
  }

  async rename(id: string, newId: string): Promise<void> {
    await this.#storage.rename(id, newId);
  }
}
