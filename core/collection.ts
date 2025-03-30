import Document from "./document.ts";

import type { Data, EntryMetadata, Labelizer, Storage } from "../types.ts";

export interface CollectionOptions {
  name: string;
  label?: string;
  description?: string;
  storage: Storage;
  fields: Lume.CMSResolvedField[];
  url?: string;
  views?: string[];
  documentName?: string | ((changes: Data) => string | undefined);
  documentLabel?: Labelizer;
  create?: boolean;
  delete?: boolean;
}

interface Permissions {
  create: boolean;
  delete: boolean;
}

export default class Collection {
  name: string;
  label: string;
  description?: string;
  #storage: Storage;
  #fields: Lume.CMSResolvedField[];
  url?: string;
  views?: string[];
  documentName?: string | ((changes: Data) => string | undefined);
  documentLabel?: Labelizer;
  permissions: Permissions;

  constructor(options: CollectionOptions) {
    this.name = options.name;
    this.label = options.label || options.name;
    this.description = options.description;
    this.#storage = options.storage;
    this.#fields = options.fields;
    this.url = options.url;
    this.views = options.views;
    this.documentName = options.documentName;
    this.documentLabel = options.documentLabel;
    this.permissions = {
      create: options.create ?? true,
      delete: options.delete ?? true,
    };
  }

  get fields() {
    return this.#fields;
  }

  async *[Symbol.asyncIterator](): AsyncGenerator<EntryMetadata> {
    for await (const metadata of this.#storage) {
      yield {
        ...metadata,
        label: this.documentLabel?.(metadata.label) ?? metadata.label,
      };
    }
  }

  create(id: string): Document {
    const name = this.#storage.name(id);
    const label = this.documentLabel ? this.documentLabel(name) : name;
    return new Document({
      name,
      label,
      entry: this.#storage.get(name),
      fields: this.#fields,
      url: this.url,
    });
  }

  get(name: string): Document {
    const label = this.documentLabel ? this.documentLabel(name) : name;

    return new Document({
      name,
      label,
      entry: this.#storage.get(name),
      fields: this.#fields,
      url: this.url,
    });
  }

  async delete(name: string): Promise<void> {
    await this.#storage.delete(name);
  }

  async rename(name: string, newName: string): Promise<string> {
    const normalizedName = this.#storage.name(newName);
    await this.#storage.rename(name, normalizedName);
    return normalizedName;
  }
}
