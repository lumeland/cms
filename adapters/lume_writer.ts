import type { Page, StaticFile } from "lume/core/file.ts";
import type { Entry } from "lume/core/fs.ts";
import type { Writer } from "lume/core/writer.ts";

export class PreviewWriter implements Writer {
  files = new Map<string, [string, string | Uint8Array | Entry]>();

  savePages(pages: Page[]) {
    const saved: Page[] = [];
    this.files.clear();
    for (const page of pages) {
      const { sourcePath, outputPath, content } = page;
      // Ignore empty pages
      if (!content) {
        continue;
      }

      this.files.set(outputPath, [sourcePath, content]);
      saved.push(page);
    }

    return Promise.resolve(pages);
  }

  copyFiles(files: StaticFile[]) {
    const copied: StaticFile[] = [];

    for (const file of files) {
      const { entry, outputPath } = file;
      this.files.set(outputPath, [entry.path, entry]);
      copied.push(file);
    }

    return Promise.resolve(copied);
  }

  clear() {
    return Promise.resolve();
  }

  removeFiles(files: string[]) {
    for (const file of files) {
      this.files.delete(file);
    }
    return Promise.resolve();
  }
}
