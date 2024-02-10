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
      return path;
    }
  }

  path = posix.join("/", path);

  return (path !== "/" && path.endsWith("/")) ? path.slice(0, -1) : path;
}

let basePath = "/";

export function setBasePath(path: string) {
  basePath = path;
}

export function getPath(...parts: string[]) {
  return posix.join(
    basePath,
    ...parts
      .filter((part) => typeof part === "string")
      .map((part) => encodeURIComponent(part)),
  );
}

const staticUrl = new URL(import.meta.resolve("../../static/"));

export function asset(url = "") {
  if (staticUrl.protocol === "file:") {
    return posix.join(basePath, url);
  }

  return new URL(
    posix.join(staticUrl.pathname, url),
    staticUrl,
  ).toString();
}
