import { statSync, mkdirSync } from "../services/fs.ts";
import type { FsError } from "../services/fs.ts";

/** Ensure a directory exists */
export function ensureDir(dir: string): void {
  try {
    const fileInfo = statSync(dir);
    if (!fileInfo.isDirectory) {
      throw new Error(
        `Failed to ensure directory exists: ${dir} already exists but it's not a directory`,
      );
    }
    return;
  } catch (error) {
    if ((error as FsError).code !== "not-found") {
      throw error;
    }

    mkdirSync(dir, true);
  }
}
