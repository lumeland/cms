import { normalizePath } from "../utils/path.ts";
import { join } from "std/path/posix/join.ts";
import { expandGlob } from "std/fs/expand_glob.ts";
import { fromFilename } from "./transformers/mod.ts";
import { contentType } from "std/media_types/content_type.ts";
import { extname } from "std/path/extname.ts";

import type { Data, Entry, Storage } from "../types.ts";

export interface Options {
  src?: string;
  path?: string;
}

export const defaults: Required<Options> = {
  src: Deno.cwd(),
  path: "**",
};

abstract class BaseStorage {
  src: string;
  path: string;

  constructor(userOptions?: Options) {
    const options = { ...defaults, ...userOptions };
    const pos = options.path.indexOf("*");

    if (pos === -1) {
      options.src = join(options.src, options.path);
      options.path = "**";
    } else if (pos > 0) {
      options.src = join(options.src, options.path.slice(0, pos));
      options.path = options.path.slice(pos);
    }

    this.src = normalizePath(options.src);
    this.path = options.path;
  }

  async *[Symbol.asyncIterator]() {
    const root = this.src;
    const iterable = expandGlob(this.path, {
      root,
      includeDirs: false,
      exclude: ["_*", ".*"],
    });

    for await (const entry of iterable) {
      yield entry.path.slice(root.length + 1);
    }
  }

  async delete(path: string) {
    await Deno.remove(join(this.src, path));
  }

  async rename(path: string, newPath: string) {
    await Deno.rename(join(this.src, path), join(this.src, newPath));
  }
}

export class FsDataStorage extends BaseStorage implements Storage<Data> {
  directory(id: string): Storage<Data> {
    return new FsDataStorage({
      src: this.src,
      path: id,
    });
  }

  get(path: string): Entry<Data> {
    return new FsDataEntry({ src: this.src, path });
  }
}

export class FsDataEntry implements Entry<Data> {
  src: string;
  path: string;

  constructor(options: Required<Options>) {
    this.src = options.src;
    this.path = options.path;
  }

  async read(): Promise<Data> {
    const content = await Deno.readTextFile(join(this.src, this.path));
    const transformer = fromFilename(this.path);

    return transformer.toData(content);
  }

  async write(content: Data) {
    const transformer = fromFilename(this.path);
    const data = await transformer.fromData(content);

    await Deno.writeTextFile(join(this.src, this.path), data);
  }
}

export class FsFileStorage extends BaseStorage implements Storage<File> {
  directory(id: string): Storage<File> {
    return new FsFileStorage({
      src: this.src,
      path: id,
    });
  }

  get(path: string): Entry<File> {
    return new FsFileEntry({ src: this.src, path });
  }
}

export class FsFileEntry implements Entry<File> {
  src: string;
  path: string;

  constructor(options: Required<Options>) {
    this.src = options.src;
    this.path = options.path;
  }

  async read(): Promise<File> {
    const content = await Deno.readFile(join(this.src, this.path));
    const type = contentType(extname(this.path));

    return new File([new Blob([content])], this.src, { type });
  }

  async write(file: File) {
    const content = await file.arrayBuffer();
    await Deno.writeFile(join(this.src, this.path), new Uint8Array(content));
  }
}
