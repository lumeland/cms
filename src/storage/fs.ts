import { normalizePath } from "../utils/path.ts";
import { join } from "std/path/posix/join.ts";
import { dirname } from "std/path/posix/dirname.ts";
import { ensureDir } from "std/fs/ensure_dir.ts";
import { expandGlob } from "std/fs/expand_glob.ts";
import { fromFilename } from "./transformers/mod.ts";
import { contentType } from "std/media_types/content_type.ts";
import { extname } from "std/path/extname.ts";

import type { Data, Entry, Storage } from "../types.ts";

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
      yield entry.path.slice(root.length + 1);
    }
  }

  directory(id: string): Storage {
    return new FsStorage({
      root: this.root,
      path: id,
    });
  }

  get(path: string): Entry {
    return new FsEntry({ root: this.root, path });
  }

  async delete(path: string) {
    await Deno.remove(join(this.root, path));
  }

  async rename(path: string, newPath: string) {
    await Deno.rename(join(this.root, path), join(this.root, newPath));
  }
}

export class FsEntry implements Entry {
  root: string;
  path: string;

  constructor(options: Required<Options>) {
    this.root = options.root;
    this.path = options.path;
  }

  get src(): string {
    return join(this.root, this.path);
  }

  async readData(): Promise<Data> {
    const content = await Deno.readTextFile(this.src);
    const transformer = fromFilename(this.path);

    return transformer.toData(content);
  }

  async writeData(data: Data) {
    const transformer = fromFilename(this.path);
    const content = await transformer.fromData(data);

    await ensureDir(dirname(this.src));
    await Deno.writeTextFile(this.src, content);
  }

  async readFile(): Promise<File> {
    const content = await Deno.readFile(this.src);
    const type = contentType(extname(this.path));

    return new File([new Blob([content])], this.root, { type });
  }

  async writeFile(file: File) {
    const content = await file.arrayBuffer();

    await ensureDir(dirname(this.src));
    await Deno.writeFile(this.src, new Uint8Array(content));
  }
}
