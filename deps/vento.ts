import vento from "https://deno.land/x/vento@v1.15.1/mod.ts";
import { UrlLoader } from "https://deno.land/x/vento@v1.15.1/src/url_loader.ts";
import { normalizePath } from "../core/utils/path.ts";
import { formatSupported } from "./imagick.ts";
import { formatBytes } from "./std.ts";

const loader = new UrlLoader(new URL(import.meta.resolve("../core/templates")));

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
