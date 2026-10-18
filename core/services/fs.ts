import { posix } from "node:path";
import fsPromises from "node:fs/promises";
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

/** Synchronously returns an iterable of a directory content */
export async function* readDir(path: string): AsyncGenerator<string> {
  const pathLength = path.length;

  try {
    const entries = fsPromises.readdir(path, {
      withFileTypes: true,
      recursive: true,
    });

    for (const entry of await entries) {
      if (!entry.isFile()) {
        continue;
      }

      yield posix.join(entry.parentPath.slice(pathLength), entry.name);
    }
  } catch (error) {
    throw new FsError(error as Error);
  }
}

/** Remove a file or folder */
export async function remove(file: string, recursive?: boolean): Promise<void> {
  await fsPromises.rm(file, { recursive });
}

/** Rename a file */
export async function rename(from: string, to: string): Promise<void> {
  await fsPromises.rename(from, to);
}

/** Read a binary file */
export async function readFile(file: string): Promise<Uint8Array<ArrayBuffer>> {
  const buf = await fsPromises.readFile(file);
  return new Uint8Array(
    buf.buffer as ArrayBuffer,
    buf.byteOffset,
    buf.length / Uint8Array.BYTES_PER_ELEMENT,
  );
}

/** Read a text file */
export async function readTextFile(file: string): Promise<string> {
  try {
    return await fsPromises.readFile(file, "utf-8");
  } catch (error) {
    throw new FsError(error as Error);
  }
}

/** Write a binary file */
export async function writeFile(
  file: string,
  content: Uint8Array,
): Promise<void> {
  try {
    await fsPromises.writeFile(file, content);
  } catch (error) {
    throw new FsError(error as Error);
  }
}

/** Write a text file */
export async function writeTextFile(
  file: string,
  content: string,
): Promise<void> {
  try {
    await fsPromises.writeFile(file, content);
  } catch (error) {
    throw new FsError(error as Error);
  }
}