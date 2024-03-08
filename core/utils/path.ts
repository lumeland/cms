import { Context } from "../../deps/hono.ts";
import { posix, SEPARATOR } from "../../deps/std.ts";

/**
 * Convert the Windows paths (that use the separator "\")
 * to Posix paths (with the separator "/")
 * and ensure it starts with "/".
 */
export function normalizePath(...paths: string[]) {
  let path = posix.join(...paths);

  if (SEPARATOR !== "/") {
    path = path.replaceAll(SEPARATOR, "/");

    // Is absolute Windows path (C:/...)
    if (path.includes(":/")) {
      return (path !== "/" && path.endsWith("/")) ? path.slice(0, -1) : path;
    }
  }

  path = posix.join("/", path);

  return (path !== "/" && path.endsWith("/")) ? path.slice(0, -1) : path;
}

export function getPath(ctx: Context, ...parts: string[]) {
  return posix.join(
    ctx.var.options.basePath,
    ...parts
      .filter((part) => typeof part === "string")
      .map((part) => encodeURIComponent(part)),
  );
}

const staticUrl = new URL(import.meta.resolve("../../static/"));

export function asset(ctx: Context, url = "") {
  if (staticUrl.protocol === "file:") {
    return posix.join(ctx.var.options.basePath, url);
  }

  return new URL(
    posix.join(staticUrl.pathname, url),
    staticUrl,
  ).toString();
}
