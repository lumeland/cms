import type {
  Entry,
  EntryMetadata,
  EntrySource,
  Labelizer,
  Storage,
} from "../types.ts";

export interface UploadOptions {
  name: string;
  label?: string;
  description?: string;
  storage: Storage;
  publicPath: string;
  documentLabel?: Labelizer;
  listed?: boolean;
  create?: boolean;
  delete?: boolean;
  edit?: boolean;
  rename?: boolean;
}

interface Permissions {
  create: boolean;
  delete: boolean;
  edit: boolean;
  rename: boolean;
}

export default class Upload {
  name: string;
  label: string;
  description?: string;
  #storage: Storage;
  publicPath: string;
  listed: boolean;
  documentLabel?: Labelizer;
  permissions: Permissions;

  constructor(options: UploadOptions) {
    this.name = options.name;
    this.label = options.label || options.name;
    this.description = options.description;
    this.#storage = options.storage;
    this.publicPath = options.publicPath;
    this.listed = options.listed ?? true;
    this.documentLabel = options.documentLabel;
    this.permissions = {
      edit: options.edit ?? true,
      create: options.create ?? true,
      delete: options.delete ?? true,
      rename: options.rename ?? true,
    };
  }

  async *[Symbol.asyncIterator](): AsyncGenerator<EntryMetadata> {
    for await (const source of this.#storage) {
      yield getMetadata(source, this.documentLabel);
    }
  }

  get(id: string): Entry {
    return this.#storage.get(id);
  }

  async delete(id: string): Promise<void> {
    await this.#storage.delete(id);
  }

  async rename(id: string, newId: string): Promise<void> {
    const newName = this.#storage.name(newId);
    await this.#storage.rename(id, newName);
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

  return {
    ...source,
    label: source.name,
  };
}
