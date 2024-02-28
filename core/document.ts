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
    await mergeRecursive(currentData, data, this.fields);
    this.#data = currentData;
    await this.#entry.writeData(currentData);
  }
}

async function mergeRecursive(
  target: Data,
  changes: Data,
  fields: ResolvedField[],
) {
  for (const [key, value] of Object.entries(changes)) {
    const field = fields.find((field) => field.name === key);

    // TODO: transformData should be recursive
    if (field?.transformData) {
      target[key] = await field.transformData(value, field);
      continue;
    }

    if (typeof value === "object" && !Array.isArray(value)) {
      if (!(key in target)) {
        target[key] = {};
      }

      await mergeRecursive(target[key] as Data, value as Data, fields);
      continue;
    }

    target[key] = value;
  }
}
