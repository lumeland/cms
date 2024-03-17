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
  #isNew?: boolean;

  constructor(options: DocumentOptions) {
    this.#name = options.name;
    this.description = options.description;
    this.#entry = options.entry;
    this.#fields = options.fields;
    this.#isNew = options.isNew;
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
    if (this.#isNew) {
      return {};
    }
    return await this.#entry.readData();
  }

  async write(data: Data) {
    const currentData = await this.read();

    for (const field of this.fields || []) {
      await field.applyChanges(currentData, data, field);
    }

    await this.#entry.writeData(currentData);
    this.#isNew = false;
  }
}
