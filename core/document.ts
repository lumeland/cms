import type { Data, Entry, ResolvedField } from "../types.ts";

export interface DocumentOptions {
  name?: string;
  description?: string;
  entry: Entry;
  fields: ResolvedField[];
  url?: string;
}

export default class Document {
  #name?: string;
  description?: string;
  #entry: Entry;
  #fields: ResolvedField[];
  url?: string;

  constructor(options: DocumentOptions) {
    this.#name = options.name;
    this.description = options.description;
    this.#entry = options.entry;
    this.#fields = options.fields;
    this.url = options.url;
  }

  get fields() {
    return this.#fields;
  }

  get name() {
    return this.#name ?? this.#entry.metadata.name;
  }

  get src() {
    return this.#entry.metadata.src;
  }

  async read(create = false) {
    try {
      return await this.#entry.readData();
    } catch (err) {
      if (create) {
        return {};
      }
      throw err;
    }
  }

  async write(data: Data, create = false) {
    const currentData = await this.read(create);

    for (const field of this.fields || []) {
      await field.applyChanges(currentData, data, field);
    }

    await this.#entry.writeData(currentData);
  }
}
