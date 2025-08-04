import { prepareField } from "./utils/data.ts";
import { TransformError } from "../storage/transformers/transform_error.js";
import type { CMSContent, Data, Entry, PreviewURL } from "../types.ts";

export interface DocumentOptions {
  name?: string;
  label?: string;
  description?: string;
  entry: Entry;
  fields: Lume.CMS.ResolvedField;
  previewURL?: PreviewURL;
  views?: string[] | ((data?: Data) => string[] | undefined);
  edit?: boolean;
}

interface Permissions {
  edit: boolean;
}

export default class Document {
  #name?: string;
  #label?: string;
  description?: string;
  #entry: Entry;
  #fields: Lume.CMS.ResolvedField;
  previewURL?: PreviewURL;
  views?: string[] | ((data?: Data) => string[] | undefined);
  permissions: Permissions;

  constructor(options: DocumentOptions) {
    this.#name = options.name;
    this.#label = options.label;
    this.description = options.description;
    this.#entry = options.entry;
    this.#fields = options.fields;
    this.previewURL = options.previewURL;
    this.views = options.views;
    this.permissions = {
      edit: options.edit ?? true,
    };
  }

  get fields() {
    return this.#fields;
  }

  get name() {
    return this.#name ?? this.#entry.source.name;
  }

  get label() {
    return this.#label ?? this.name;
  }

  get source() {
    return this.#entry.source;
  }

  async readText(create = false): Promise<string> {
    try {
      return await this.#entry.readText();
    } catch (err) {
      if (create) {
        return "";
      }
      throw err;
    }
  }

  async writeText(content: string) {
    await this.#entry.writeText(content);
  }

  async read(create = false) {
    try {
      return {
        root: (await this.#entry.readData()) ?? {},
      };
    } catch (err) {
      if (!(err instanceof TransformError) && create) {
        return { root: {} };
      }
      throw err;
    }
  }

  async write(data: Data, cms: CMSContent, create = false) {
    const currentData = await this.read(create);
    const fields = await prepareField(this.fields, cms, currentData);
    await this.fields.applyChanges(currentData, data, fields, this, cms);
    await this.#entry.writeData(currentData.root);
  }
}
