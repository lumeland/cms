import type { Data, Entry, ResolvedField } from "../types.ts";

export interface DocumentOptions {
  name?: string;
  description?: string;
  entry: Entry;
  fields: ResolvedField[];
  isNew?: boolean;
}

export default class Document {
  #name?: string;
  description?: string;
  #entry: Entry;
  #fields: ResolvedField[];
  #data?: Data;

  constructor(options: DocumentOptions) {
    this.#name = options.name;
    this.description = options.description;
    this.#entry = options.entry;
    this.#fields = options.fields;

    if (options.isNew) {
      this.#data = {};
    }
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

  async read() {
    if (this.#data === undefined) {
      this.#data = await this.#entry.readData();
    }

    return this.#data;
  }

  async write(data: Data) {
    const currentData = await this.read();

    for (const field of this.fields || []) {
      await field.applyChanges(currentData, data, field);
    }

    this.#data = currentData;
    await this.#entry.writeData(currentData);
  }
}
