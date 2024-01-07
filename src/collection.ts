import Document from "./document.ts";

import type { Data, ResolvedField, Storage } from "./types.ts";

export default class Collection {
  #storage: Storage<Data>;
  #fields: ResolvedField[];

  constructor(storage: Storage<Data>, fields: ResolvedField[]) {
    this.#storage = storage;
    this.#fields = fields;
  }

  get fields() {
    return this.#fields;
  }

  async *[Symbol.asyncIterator]() {
    for await (const id of this.#storage) {
      yield id;
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
