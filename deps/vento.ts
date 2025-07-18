import vento from "https://deno.land/x/vento@v1.15.0/mod.ts";
import { posix as path } from "./std.ts";
import { normalizePath } from "../core/utils/path.ts";
import { formatSupported } from "./imagick.ts";
import { formatBytes } from "./std.ts";

import type {
  Loader,
  TemplateSource,
} from "https://deno.land/x/vento@v1.15.0/src/loader.ts";

class ModuleLoader implements Loader {
  #root: string;

  constructor(root: string) {
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

export async function render(file: string, data: Record<string, unknown> = {}) {
  try {
    return (await env.run(file, data)).content;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

// deno-lint-ignore no-explicit-any
export function filter(name: string, filter: (...args: any[]) => any) {
  env.filters[name] = filter;
}

filter("formatSupported", formatSupported);
filter("formatBytes", formatBytes);
filter("normalizePath", (args) => normalizePath(...args));
