import { prepareField } from "./utils/data.ts";
import { TransformError } from "../storage/transformers/transform_error.js";
import type { CMSContent, Data, Entry, PreviewUrl } from "../types.ts";

export interface DocumentOptions {
  name?: string;
  label?: string;
  description?: string;
  entry: Entry;
  fields?: Lume.CMS.ResolvedField;
  previewUrl?: PreviewUrl;
  views?: string[] | ((data?: Data) => string[] | undefined);
  transform?: (
    data: Data,
    CmsContent: CMSContent,
    isNew: boolean,
  ) => void | Promise<void>;
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
  #fields?: Lume.CMS.ResolvedField;
  previewUrl?: PreviewUrl;
  views?: string[] | ((data?: Data) => string[] | undefined);
  permissions: Permissions;
  transform?: (
    data: Data,
    CmsContent: CMSContent,
    isNew: boolean,
  ) => void | Promise<void>;

  constructor(options: DocumentOptions) {
    this.#name = options.name;
    this.#label = options.label;
    this.description = options.description;
    this.#entry = options.entry;
    this.#fields = options.fields;
    this.previewUrl = options.previewUrl;
    this.views = options.views;
    this.transform = options.transform;
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

  get storage() {
    return this.#entry.storage;
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

  async write(data: Data, cms: CMSContent, create = false): Promise<Data> {
    if (!this.fields) {
      throw new Error("Cannot write data without fields");
    }

    const currentData = await this.read(create);
    const fields = await prepareField(this.fields, cms, currentData, this);
    await this.fields.applyChanges(currentData, data, fields, this, cms);
    const dataToSave = currentData.root;

    if (this.transform) {
      await this.transform(dataToSave, cms, create);
    }

    await this.#entry.writeData(dataToSave);
    return dataToSave;
  }
}
