import fs from "node:fs";

export class FsError extends Error {
  constructor(cause: Error) {
    super(cause.message);
    this.cause = cause;
  }

  get code(): "not-found" | "other" {
    if ((this.cause as { code: string }).code === "ENOENT") return "not-found";
    return "other";
  }
}

export interface FileInfo {
  isFile: boolean;
  isDirectory: boolean;
  isSymlink: boolean;
  size: number;
  mtime: Date | null;
  atime: Date | null;
  ctime: Date | null;
  birthtime: Date | null;
}

/** Synchronously returns a FileInfo for a specific path */
export function statSync(path: string): FileInfo {
  try {
    const info = fs.statSync(path);
    return {
      get isFile() {
        return info.isFile();
      },
      get isDirectory() {
        return info.isDirectory();
      },
      get isSymlink() {
        return info.isSymbolicLink();
      },
      size: info.size,
      mtime: info.mtime,
      atime: info.atime,
      ctime: info.ctime,
      birthtime: info.birthtime,
    };
  } catch (error) {
    throw new FsError(error as Error);
  }
}

/** Synchronously creates a new directory with the specified path. */
export function mkdirSync(path: string, recursive?: boolean) {
  try {
    return fs.mkdirSync(path, { recursive });
  } catch (error) {
    throw new FsError(error as Error);
  }
}
