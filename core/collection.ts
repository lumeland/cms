import Document from "./document.ts";
import { getExtension } from "./utils/path.ts";
import { labelify } from "./utils/string.ts";

import type {
  Data,
  EntryMetadata,
  EntrySource,
  Labelizer,
  PreviewUrl,
  Storage,
} from "../types.ts";

export interface CollectionOptions {
  name: string;
  label?: string;
  description?: string;
  storage: Storage;
  fields?: Lume.CMS.ResolvedField;
  previewUrl?: PreviewUrl;
  views?: string[] | ((data?: Data) => string[] | undefined);
  documentName?: string | ((changes: Data) => string | undefined);
  documentLabel?: Labelizer;
  create?: boolean;
  delete?: boolean;
  edit?: boolean;
  rename?: boolean | "auto";
}

interface Permissions {
  create: boolean;
  delete: boolean;
  edit: boolean;
  rename: boolean | "auto";
}

export default class Collection {
  name: string;
  label: string;
  description?: string;
  #storage: Storage;
  #fields?: Lume.CMS.ResolvedField;
  previewUrl?: PreviewUrl;
  views?: string[] | ((data?: Data) => string[] | undefined);
  documentName?: string | ((changes: Data) => string | undefined);
  documentLabel?: Labelizer;
  permissions: Permissions;

  constructor(options: CollectionOptions) {
    this.name = options.name;
    this.label = options.label || options.name;
    this.description = options.description;
    this.#storage = options.storage;
    this.#fields = options.fields;
    this.previewUrl = options.previewUrl;
    this.views = options.views;
    this.documentName = options.documentName;
    this.documentLabel = options.documentLabel;
    this.permissions = {
      edit: options.edit ?? true,
      create: options.create ?? true,
      delete: options.delete ?? true,
      rename: options.rename ?? true,
    };

    if (this.permissions.rename !== true && this.permissions.create && !this.documentName) {
      throw new Error(
        "The documentName option is required if the rename permission is false or auto.",
      );
    }
  }

  get fields() {
    return this.#fields;
  }

  async *[Symbol.asyncIterator](): AsyncGenerator<EntryMetadata> {
    for await (const source of this.#storage) {
      yield getMetadata(source, this.documentLabel);
    }
  }

  create(id: string): Document {
    const source = this.#storage.source(this.#storage.name(id));
    const { name, label } = getMetadata(source, this.documentLabel);

    return new Document({
      name,
      label,
      entry: this.#storage.get(name),
      fields: this.#fields,
    });
  }

  get(id: string): Document {
    const source = this.#storage.source(id);
    const { name, label } = getMetadata(source, this.documentLabel);

    return new Document({
      name,
      label,
      entry: this.#storage.get(name),
      fields: this.#fields,
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

function getMetadata(
  source: EntrySource,
  labelizer?: Labelizer,
): EntryMetadata {
  if (labelizer) {
    const label = labelizer(source.name);
    if (typeof label === "string") {
      return {
        ...source,
        label,
      };
    }

    return {
      ...source,
      ...label,
    };
  }

  const extension = getExtension(source.name);

  return {
    ...source,
    label: labelify(source.name),
    flags: { extension },
  };
}
