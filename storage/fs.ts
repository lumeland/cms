import { normalizePath } from "../core/utils/path.ts";
import { contentType, ensureDir, expandGlob, posix } from "../deps/std.ts";
import { fromFilename } from "./transformers/mod.ts";

import type { Data, Entry, EntryMetadata, Storage } from "../types.ts";

export interface Options {
  root?: string;
  path?: string;
}

export const defaults: Required<Options> = {
  root: Deno.cwd(),
  path: "**",
};

export default class Fs implements Storage {
  root: string;
  path: string;

  constructor(userOptions?: Options) {
    const options = { ...defaults, ...userOptions };
    const pos = options.path.indexOf("*");

    if (pos === -1) {
      options.root = posix.join(options.root, options.path);
      options.path = "**";
    } else if (pos > 0) {
      options.root = posix.join(options.root, options.path.slice(0, pos));
      options.path = options.path.slice(pos);
    }

    this.root = normalizePath(options.root);
    this.path = options.path;
  }

  async *[Symbol.asyncIterator]() {
    const root = this.root;
    const iterable = expandGlob(this.path, {
      root,
      includeDirs: false,
      exclude: ["_*", ".*"],
    });

    for await (const entry of iterable) {
      yield {
        name: entry.path.slice(root.length + 1),
        src: entry.path,
      };
    }
  }

  directory(path: string): Storage {
    return new Fs({
      root: this.root,
      path,
    });
  }

  get(name: string): Entry {
    return new FsEntry({
      src: posix.join(this.root, name),
      name,
    });
  }

  async delete(name: string) {
    await Deno.remove(posix.join(this.root, name));
  }

  async rename(name: string, newName: string) {
    const dest = posix.join(this.root, newName);
    await ensureDir(posix.dirname(dest));
    await Deno.rename(posix.join(this.root, name), dest);
  }
}

export class FsEntry implements Entry {
  metadata: EntryMetadata;

  constructor(metadata: EntryMetadata) {
    this.metadata = metadata;
  }

  get src(): string {
    return this.metadata.src;
  }

  async readData(): Promise<Data> {
    const { src } = this.metadata;
    const content = await Deno.readTextFile(src);
    const transformer = fromFilename(src);

    return transformer.toData(content);
  }

  async writeData(data: Data) {
    const { src } = this.metadata;
    const transformer = fromFilename(src);
    const content = await transformer.fromData(data);

    await ensureDir(posix.dirname(src));
    await Deno.writeTextFile(src, content);
  }

  async readFile(): Promise<File> {
    const { src, name } = this.metadata;
    const content = await Deno.readFile(src);
    const type = contentType(posix.extname(src));

    return new File([new Blob([content])], name, { type });
  }

  async writeFile(file: File) {
    const { src } = this.metadata;
    const content = await file.arrayBuffer();

    await ensureDir(posix.dirname(src));
    await Deno.writeFile(src, new Uint8Array(content));
  }
}
