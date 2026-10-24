import { normalizePath } from "../core/utils/path.ts";
import { generateId, slugify } from "../core/utils/string.ts";
import { contentType, globToRegExp, posix } from "../deps/std.ts";
import { ensureDir } from "../core/utils/fs.ts";
import { fromFilename } from "./transformers/mod.ts";
import { cwd } from "../core/services/process.ts";
import {
  readDir,
  readFile,
  readTextFile,
  remove,
  rename,
  writeFile,
  writeTextFile,
} from "../core/services/fs.ts";

import type { Data, Entry, EntrySource, Storage } from "../types.ts";

export interface Options {
  root?: string;
  path?: string;
}

export const defaults: Options = {
  path: "**",
};

export class Fs implements Storage {
  root: string;
  path: string;
  pattern: string;
  extension?: string;

  static create(path: string): Fs {
    return new Fs({ path });
  }

  constructor(userOptions?: Options) {
    const options = { ...defaults, ...userOptions } as Required<Options>;
    this.root = normalizePath(options.root ?? cwd());
    const pos = options.path.indexOf("*");

    if (pos === -1) {
      this.path = options.path.endsWith("/") ? options.path : options.path + "/";
      this.pattern = "**";
    } else if (pos === 0) {
      this.path = "";
      this.pattern = options.path;
    } else {
      this.path = options.path.slice(0, pos);
      this.pattern = options.path.slice(pos);
    }

    // Avoid errors for paths like "src:articles/**/*{.jpg,.png,.gif,.svg}"
    const ext = this.pattern.match(/\.\w+$/);

    if (ext) {
      this.extension = ext[0];
    }
  }

  async *[Symbol.asyncIterator](): AsyncGenerator<EntrySource> {
    const { root, path, pattern } = this;
    const regexp = globToRegExp(pattern);

    for await (const name of readDir(posix.join(root, path))) {
      if (!regexp.exec(name)) {
        continue;
      }

      yield {
        name,
        path: posix.join("/", path, name),
        src: posix.join(root, path, name),
      };
    }
  }

  source(name: string): EntrySource {
    return {
      src: posix.join(this.root, this.path, name),
      name,
      path: posix.join("/", this.path, name),
    };
  }

  name(name?: string): string {
    const newName = name ? slugify(name) : generateId();

    return this.extension && !newName.endsWith(this.extension) ? newName + this.extension : newName;
  }

  directory(path: string): Storage {
    return new Fs({
      root: posix.join(this.root, this.path),
      path,
    });
  }

  get(name: string): Entry {
    return new FsEntry(this.source(name), this);
  }

  async delete(name: string) {
    await remove(posix.join(this.root, this.path, name));
  }

  async rename(name: string, newName: string) {
    const src = posix.join(this.root, this.path, name);
    const dest = posix.join(this.root, this.path, newName);
    ensureDir(posix.dirname(dest));
    await rename(src, dest);
  }
}

export default Fs;

export class FsEntry implements Entry {
  source: EntrySource;
  #storage: Fs;

  constructor(source: EntrySource, storage: Fs) {
    this.source = source;
    this.#storage = storage;
  }

  get storage() {
    return this.#storage;
  }

  async readText(): Promise<string> {
    const { src } = this.source;
    return await readTextFile(src);
  }

  async writeText(content: string): Promise<void> {
    const { src } = this.source;
    ensureDir(posix.dirname(src));
    await writeTextFile(src, content);
  }

  async readData(): Promise<Data> {
    const { src } = this.source;
    const content = await this.readText();
    const transformer = fromFilename(src);

    return transformer.toData(content);
  }

  async writeData(data: Data) {
    const { src } = this.source;
    const transformer = fromFilename(src);
    const content = (await transformer.fromData(data)).replaceAll(/\r\n/g, "\n"); // Unify line endings

    await this.writeText(content);
  }

  async readFile(): Promise<File> {
    const { src, name } = this.source;
    const content = await readFile(src);
    const type = contentType(posix.extname(src));

    return new File([new Blob([content])], name, { type });
  }

  async writeFile(file: File) {
    const { src } = this.source;
    const content = await file.arrayBuffer();

    ensureDir(posix.dirname(src));
    await writeFile(src, new Uint8Array(content));
  }
}
