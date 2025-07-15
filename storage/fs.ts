import { normalizePath } from "../core/utils/path.ts";
import { slugify } from "../core/utils/string.ts";
import { contentType, ensureDir, expandGlob, posix } from "../deps/std.ts";
import { fromFilename } from "./transformers/mod.ts";

import type { Data, Entry, EntryMetadata, Storage } from "../types.ts";

export interface Options {
  root?: string;
  path?: string;
}

export const defaults: Options = {
  path: "**",
};

export default class Fs implements Storage {
  root: string;
  path: string;
  extension?: string;

  static create(path: string) {
    return new Fs({ path });
  }

  constructor(userOptions?: Options) {
    const options = { ...defaults, ...userOptions } as Required<Options>;
    const pos = options.path.indexOf("*");
    options.root ??= Deno.cwd();

    if (pos === -1) {
      options.root = posix.join(options.root, options.path);
      options.path = "**";
    } else if (pos > 0) {
      options.root = posix.join(options.root, options.path.slice(0, pos));
      options.path = options.path.slice(pos);
    }

    this.root = normalizePath(options.root);
    this.path = options.path;

    // Avoid errors for paths like "src:articles/**/*{.jpg,.png,.gif,.svg}"
    const ext = this.path.match(/\.\w+$/);
    if (ext) {
      this.extension = ext[0];
    }
  }

  async *[Symbol.asyncIterator]() {
    const root = this.root;
    const iterable = expandGlob(this.path, {
      root,
      includeDirs: false,
      exclude: ["_*", ".*"],
    });

    for await (const entry of iterable) {
      const src = normalizePath(entry.path);
      const name = src.slice(root.length + 1);
      yield {
        label: name,
        name,
        src,
      };
    }
  }

  name(name: string): string {
    const newName = slugify(name);

    return (this.extension && !newName.endsWith(this.extension))
      ? newName + this.extension
      : newName;
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
      label: name,
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

  async readText(): Promise<string> {
    const { src } = this.metadata;
    return await Deno.readTextFile(src);
  }

  async writeText(content: string): Promise<void> {
    const { src } = this.metadata;
    await ensureDir(posix.dirname(src));
    await Deno.writeTextFile(src, content);
  }

  async readData(): Promise<Data> {
    const { src } = this.metadata;
    const content = await this.readText();
    const transformer = fromFilename(src);

    return transformer.toData(content);
  }

  async writeData(data: Data) {
    const { src } = this.metadata;
    const transformer = fromFilename(src);
    const content = (await transformer.fromData(data))
      .replaceAll(/\r\n/g, "\n"); // Unify line endings

    await this.writeText(content);
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
