import { S3Client } from "jsr:@bradenmacdonald/s3-lite-client@^0.9.4";

import { normalizeName, normalizePath } from "../core/utils/path.ts";
import { slugify } from "../core/utils/string.ts";
import { contentType, posix } from "../deps/std.ts";
import { fromFilename } from "./transformers/mod.ts";

import type { Data, Entry, EntrySource, Storage } from "../types.ts";

export interface Options {
  client: S3Client;
  prefix?: string;
  path?: string;
}

export class S3 implements Storage {
  client: S3Client;
  prefix: string;
  path: string;
  pattern: string;
  extension?: string;

  static create(options: {
    endPoint: string;
    region: string;
    bucket: string;
    accessKey?: string;
    secretKey?: string;
    prefix?: string;
    path?: string;
  }): S3 {
    const client = new S3Client({
      endPoint: options.endPoint,
      region: options.region,
      bucket: options.bucket,
      accessKey: options.accessKey,
      secretKey: options.secretKey,
    });
    return new S3({
      client,
      prefix: options.prefix,
      path: options.path,
    });
  }

  constructor(options: Options) {
    this.client = options.client;
    this.prefix = normalizePath(options.prefix ?? "/").slice(1); // Remove leading slash for S3 keys
    const pathOption = options.path ?? "**";
    const pos = pathOption.indexOf("*");

    if (pos === -1) {
      this.path = pathOption.endsWith("/") ? pathOption : pathOption + "/";
      this.pattern = "**";
    } else if (pos === 0) {
      this.path = "";
      this.pattern = pathOption;
    } else {
      this.path = pathOption.slice(0, pos);
      this.pattern = pathOption.slice(pos);
    }

    // Avoid errors for paths like "src:articles/**/*{.jpg,.png,.gif,.svg}"
    const ext = this.pattern.match(/\.\w+$/);
    if (ext) {
      this.extension = ext[0];
    }
  }

  #key(name: string): string {
    const parts = [this.prefix, this.path, name].filter(Boolean);
    return posix.join(...parts);
  }

  async *[Symbol.asyncIterator](): AsyncGenerator<EntrySource> {
    const prefix = posix.join(this.prefix, this.path);
    
    for await (const obj of this.client.listObjects({ prefix })) {
      if (obj.type !== "Object") continue;
      
      const key = obj.key;
      // Skip hidden files and directories
      if (key.includes("/_") || key.includes("/.")) {
        continue;
      }

      const fullPrefix = prefix.endsWith("/") ? prefix : prefix + "/";
      const name = normalizeName(key.slice(fullPrefix.length));
      if (!name) continue;

      yield {
        name,
        path: posix.join("/", this.path, name),
        src: key,
      };
    }
  }

  source(name: string): EntrySource {
    return {
      src: this.#key(name),
      name,
      path: posix.join("/", this.path, name),
    };
  }

  name(name: string): string {
    const newName = slugify(name);

    return (this.extension && !newName.endsWith(this.extension))
      ? newName + this.extension
      : newName;
  }

  directory(path: string): Storage {
    return new S3({
      client: this.client,
      prefix: posix.join(this.prefix, this.path),
      path,
    });
  }

  get(name: string): Entry {
    return new S3Entry(this.source(name), this.client);
  }

  async delete(name: string): Promise<void> {
    await this.client.deleteObject(this.#key(name));
  }

  async rename(name: string, newName: string): Promise<void> {
    const srcKey = this.#key(name);
    const destKey = this.#key(newName);

    // S3 doesn't have native rename, so copy then delete
    await this.client.copyObject({ sourceKey: srcKey }, destKey);
    await this.client.deleteObject(srcKey);
  }
}

export default S3;

export class S3Entry implements Entry {
  source: EntrySource;
  #client: S3Client;

  constructor(source: EntrySource, client: S3Client) {
    this.source = source;
    this.#client = client;
  }

  async readText(): Promise<string> {
    const { src } = this.source;
    const response = await this.#client.getObject(src);
    if (!response.ok) {
      throw new Error(`File not found: ${src}`);
    }
    return await response.text();
  }

  async writeText(content: string): Promise<void> {
    const { src } = this.source;
    await this.#client.putObject(src, content);
  }

  async readData(): Promise<Data> {
    const { src } = this.source;
    const content = await this.readText();
    const transformer = fromFilename(src);

    return transformer.toData(content);
  }

  async writeData(data: Data): Promise<void> {
    const { src } = this.source;
    const transformer = fromFilename(src);
    const content = (await transformer.fromData(data))
      .replaceAll(/\r\n/g, "\n"); // Unify line endings

    await this.writeText(content);
  }

  async readFile(): Promise<File> {
    const { src, name } = this.source;
    const response = await this.#client.getObject(src);
    if (!response.ok) {
      throw new Error(`File not found: ${src}`);
    }
    const content = await response.arrayBuffer();
    const type = contentType(posix.extname(src));

    return new File([new Blob([content])], name, { type });
  }

  async writeFile(file: File): Promise<void> {
    const { src } = this.source;
    const content = await file.arrayBuffer();
    await this.#client.putObject(src, new Uint8Array(content));
  }
}
