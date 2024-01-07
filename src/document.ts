import type { Data, Entry, ResolvedField } from "./types.ts";

export default class Document {
  #storage: Entry<Data>;
  #fields: ResolvedField[];
  #data?: Data;

  constructor(store: Entry<Data>, fields: ResolvedField[], isNew = false) {
    this.#storage = store;
    this.#fields = fields;

    if (isNew) {
      this.#data = {};
    }
  }

  get fields() {
    return this.#fields;
  }

  get src(): string | undefined {
    return this.#storage.src;
  }

  async read() {
    if (this.#data === undefined) {
      this.#data = await this.#storage.read();
    }

    return this.#data;
  }

  async write(data: Data) {
    const currentData = await this.read();
    await mergeRecursive(currentData, data, this.fields);
    this.#data = currentData;
    await this.#storage.write(currentData);
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
