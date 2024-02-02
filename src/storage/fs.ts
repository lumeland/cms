import { normalizePath } from "../utils/path.ts";
import { join } from "std/path/posix/join.ts";
import { dirname } from "std/path/posix/dirname.ts";
import { ensureDir } from "std/fs/ensure_dir.ts";
import { expandGlob } from "std/fs/expand_glob.ts";
import { fromFilename } from "./transformers/mod.ts";
import { contentType } from "std/media_types/content_type.ts";
import { extname } from "std/path/extname.ts";

import type { Data, Entry, EntryMetadata, Storage } from "../types.ts";

export interface Options {
  root?: string;
  path?: string;
}

export const defaults: Required<Options> = {
  root: Deno.cwd(),
  path: "**",
};

export class FsStorage implements Storage {
  root: string;
  path: string;

  constructor(userOptions?: Options) {
    const options = { ...defaults, ...userOptions };
    const pos = options.path.indexOf("*");

    if (pos === -1) {
      options.root = join(options.root, options.path);
      options.path = "**";
    } else if (pos > 0) {
      options.root = join(options.root, options.path.slice(0, pos));
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
    return new FsStorage({
      root: this.root,
      path,
    });
  }

  get(name: string): Entry {
    return new FsEntry({
      src: join(this.root, name),
      name,
    });
  }

  async delete(name: string) {
    await Deno.remove(join(this.root, name));
  }

  async rename(name: string, newName: string) {
    const dest = join(this.root, newName);
    await ensureDir(dirname(dest));
    await Deno.rename(join(this.root, name), dest);
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

    await ensureDir(dirname(src));
    await Deno.writeTextFile(src, content);
  }

  async readFile(): Promise<File> {
    const { src, name } = this.metadata;
    const content = await Deno.readFile(src);
    const type = contentType(extname(src));

    return new File([new Blob([content])], name, { type });
  }

  async writeFile(file: File) {
    const { src } = this.metadata;
    const content = await file.arrayBuffer();

    await ensureDir(dirname(src));
    await Deno.writeFile(src, new Uint8Array(content));
  }
}
