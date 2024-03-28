import Document from "./document.ts";

import type { EntryMetadata, ResolvedField, Storage } from "../types.ts";

export interface CollectionOptions {
  name: string;
  description?: string;
  storage: Storage;
  fields: ResolvedField[];
}

export default class Collection {
  name: string;
  description?: string;
  #storage: Storage;
  #fields: ResolvedField[];

  constructor(options: CollectionOptions) {
    this.name = options.name;
    this.description = options.description;
    this.#storage = options.storage;
    this.#fields = options.fields;
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
    const name = this.#storage.name(id);
    return new Document({
      entry: this.#storage.get(name),
      fields: this.#fields,
      isNew: true,
    });
  }

  get(id: string): Document {
    return new Document({ entry: this.#storage.get(id), fields: this.#fields });
  }

  async delete(id: string): Promise<void> {
    await this.#storage.delete(id);
  }

  async rename(id: string, newId: string): Promise<string> {
    const newName = this.#storage.name(newId);
    await this.#storage.rename(id, newName);
    return newName;
  }
}
