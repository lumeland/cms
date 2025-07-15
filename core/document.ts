import { TransformError } from "../storage/transformers/transform_error.js";
import type { CMSContent, Data, Entry } from "../types.ts";

export interface DocumentOptions {
  name?: string;
  label?: string;
  description?: string;
  entry: Entry;
  fields: Lume.CMS.ResolvedField[];
  url?: string;
  views?: string[] | ((data?: Data) => string[] | undefined);
}

export default class Document {
  #name?: string;
  #label?: string;
  description?: string;
  #entry: Entry;
  #fields: Lume.CMS.ResolvedField[];
  url?: string;
  views?: string[] | ((data?: Data) => string[] | undefined);

  constructor(options: DocumentOptions) {
    this.#name = options.name;
    this.#label = options.label;
    this.description = options.description;
    this.#entry = options.entry;
    this.#fields = options.fields;
    this.url = options.url;
    this.views = options.views;
  }

  get fields() {
    return this.#fields;
  }

  get name() {
    return this.#name ?? this.#entry.metadata.name;
  }

  get label() {
    return this.#label ?? this.name;
  }

  get src() {
    return this.#entry.metadata.src;
  }

  async readText(): Promise<string> {
    return await this.#entry.readText();
  }

  async writeText(content: string) {
    await this.#entry.writeText(content);
  }

  async read(create = false) {
    try {
      return (await this.#entry.readData()) ?? {};
    } catch (err) {
      if (!(err instanceof TransformError) && create) {
        return {};
      }
      throw err;
    }
  }

  async write(data: Data, cms: CMSContent, create = false) {
    let currentData = await this.read(create);
    const fields = this.fields || [];

    const isArray = fields.length === 1 && fields[0].name === "[]" &&
      ("[]" in data);

    if (isArray) {
      currentData = { "[]": currentData };
    }

    for (const field of this.fields || []) {
      await field.applyChanges(currentData, data, field, this, cms);
    }

    if (isArray) {
      currentData = currentData["[]"] as Data;
    }

    await this.#entry.writeData(currentData);
  }
}
