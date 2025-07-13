import type { Entry, EntryMetadata, Storage } from "../types.ts";

export interface UploadOptions {
  name: string;
  label?: string;
  description?: string;
  storage: Storage;
  publicPath: string;
  listed?: boolean;
}

export default class Upload {
  name: string;
  label: string;
  description?: string;
  storage: Storage;
  publicPath: string;
  listed: boolean;

  constructor(options: UploadOptions) {
    this.name = options.name;
    this.label = options.label || options.name;
    this.description = options.description;
    this.storage = options.storage;
    this.publicPath = options.publicPath;
    this.listed = options.listed ?? true;
  }

  async *[Symbol.asyncIterator](): AsyncGenerator<EntryMetadata> {
    for await (const metadata of this.storage) {
      yield metadata;
    }
  }

  get(id: string): Entry {
    return this.storage.get(id);
  }

  async delete(id: string): Promise<void> {
    await this.storage.delete(id);
  }

  async rename(id: string, newId: string): Promise<void> {
    const newName = this.storage.name(newId);
    await this.storage.rename(id, newName);
  }
}
