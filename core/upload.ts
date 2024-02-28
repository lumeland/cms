import type { Storage } from "../types.ts";

export interface UploadOptions {
  name: string;
  description?: string;
  storage: Storage;
  publicPath: string;
}

export default class Upload {
  name: string;
  description?: string;
  storage: Storage;
  publicPath: string;

  constructor(options: UploadOptions) {
    this.name = options.name;
    this.description = options.description;
    this.storage = options.storage;
    this.publicPath = options.publicPath;
  }
}
