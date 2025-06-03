import vento from "https://deno.land/x/vento@v1.13.2/mod.ts";
import { posix as path } from "./std.ts";
import { getPath } from "../core/utils/path.ts";

import type {
  Loader,
  TemplateSource,
} from "https://deno.land/x/vento@v1.13.2/src/loader.ts";

class ModuleLoader implements Loader {
  #root: string;

  constructor(root: string = Deno.cwd()) {
    this.#root = root;
  }

  async load(file: string): Promise<TemplateSource> {
    const url = this.#root + file;
    const source = await (await fetch(url)).text();

    return { source };
  }

  resolve(from: string, file: string): string {
    if (file.startsWith(".")) {
      return path.join("/", path.dirname(from), file);
    }

    return path.join("/", file);
  }
}

const loader = new ModuleLoader(import.meta.resolve("../core/templates"));

const env = vento({
  includes: loader,
});

env.filters.path = (basePath: string, ...args: string[]) =>
  getPath(basePath, ...args);

export async function render(file: string, data: Record<string, unknown> = {}) {
  return (await env.run(file, data)).content;
}

export function filter(name: string, filter: (...args: any[]) => any) {
  env.filters[name] = filter;
}
