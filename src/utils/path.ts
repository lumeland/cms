import { join } from "std/path/posix/join.ts";
import { SEP } from "std/path/separator.ts";

/**
 * Convert the Windows paths (that use the separator "\")
 * to Posix paths (with the separator "/")
 * and ensure it starts with "/".
 */
export function normalizePath(...paths: string[]) {
  let path = join(...paths);

  if (SEP !== "/") {
    path = path.replaceAll(SEP, "/");

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
  basePath = normalizePath(path);
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
