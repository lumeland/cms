import vento from "https://deno.land/x/vento@v2.3.0/web.ts";
import { normalizePath } from "../core/utils/path.ts";
import { formatSupported } from "./imagick.ts";
import { formatBytes } from "./std.ts";

const env = vento({
  includes: new URL(import.meta.resolve("../core/templates")),
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
