import { posix, SEPARATOR } from "../../deps/std.ts";

/**
 * Normalize the name of a file or directory
 */
export function normalizeName(name?: string): string | undefined {
  if (!name) {
    return;
  }

  if (SEPARATOR !== "/") {
    name = name.replaceAll(SEPARATOR, "/");
  }

  name = posix.join("/", name).substring(1);
  return name || undefined;
}

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

export function getPath(basePath: string, ...parts: string[]) {
  return posix.join(
    basePath,
    ...parts
      .filter((part) => typeof part === "string")
      .map((part) => encodeURIComponent(part)),
  );
}

const staticUrl = new URL(import.meta.resolve("../../static/"));

export function asset(basePath: string, url = "") {
  if (staticUrl.protocol === "file:") {
    return posix.join(basePath, url);
  }

  return new URL(
    posix.join(staticUrl.pathname, url),
    staticUrl,
  ).toString();
}

export function getLanguageCode(path: string): string {
  const ext = posix.extname(path).toLowerCase();
  switch (ext) {
    case ".md":
      return "Markdown";
    case ".yml":
      return "YAML";
    case ".json":
      return "JSON";
    case ".css":
      return "CSS";
    case ".js":
      return "JavaScript";
    case ".ts":
      return "TypeScript";
    default:
      return "HTML";
  }
}
