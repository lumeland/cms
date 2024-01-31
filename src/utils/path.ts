import { join } from "std/path/posix/join.ts";
import { SEPARATOR } from "std/path/constants.ts";

/**
 * Convert the Windows paths (that use the separator "\")
 * to Posix paths (with the separator "/")
 * and ensure it starts with "/".
 */
export function normalizePath(...paths: string[]) {
  let path = join(...paths);

  if (SEPARATOR !== "/") {
    path = path.replaceAll(SEPARATOR, "/");

    // Is absolute Windows path (C:/...)
    if (path.includes(":/")) {
      return path;
    }
  }

  path = join("/", path);

  return (path !== "/" && path.endsWith("/")) ? path.slice(0, -1) : path;
}

let basePath = "/";

export function setBasePath(path: string) {
  basePath = path;
}

export function src(...parts: string[]) {
  return join(basePath, ...parts);
}

export function getPath(...parts: string[]) {
  return src(
    ...parts
      .filter((part) => typeof part === "string")
      .map((part) => encodeURIComponent(part)),
  );
}

const staticUrl = new URL(import.meta.resolve("../../static/"));

export function getStaticPath(...parts: string[]) {
  if (staticUrl.protocol === "file:") {
    return src(...parts);
  }

  return new URL(
    join(staticUrl.pathname, ...parts),
    staticUrl,
  ).toString();
}
