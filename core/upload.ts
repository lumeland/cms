import type { Entry, EntryMetadata, Storage } from "../types.ts";

export interface UploadOptions {
  name: string;
  label?: string;
  description?: string;
  storage: Storage;
  publicPath: string;
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
  storage: Storage;
  publicPath: string;
  listed: boolean;
  permissions: Permissions;

  constructor(options: UploadOptions) {
    this.name = options.name;
    this.label = options.label || options.name;
    this.description = options.description;
    this.storage = options.storage;
    this.publicPath = options.publicPath;
    this.listed = options.listed ?? true;
    this.permissions = {
      edit: options.edit ?? true,
      create: options.create ?? true,
      delete: options.delete ?? true,
      rename: options.rename ?? true,
    };
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

  /** User permission to create a new document */
  canCreate(): boolean {
    return this.permissions.create;
  }
  /** User permission to delete a document */
  canDelete(): boolean {
    return this.permissions.delete;
  }
  /** User permission to rename a document in the edition */
  canRename(): boolean {
    return this.permissions.rename;
  }
  /** User permission to edit a document */
  canEdit(): boolean {
    return this.permissions.edit;
  }
}
