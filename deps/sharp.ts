import sharp from "npm:sharp@0.35.3";
import type { FormatEnum } from "npm:sharp@0.35.3";

export { sharp };

export async function fromFile(file: File) {
  return sharp(new Uint8Array(await file.arrayBuffer()));
}

export type Format = keyof FormatEnum | "avif";

export const inputFormats: Format[] = [
  "avif",
  "gif",
  "heif",
  "jpeg",
  "jp2",
  "jxl",
  "png",
  "tiff",
  "raw",
  "webp",
];

export const outputFormats: Format[] = [
  "avif",
  "gif",
  "jpeg",
  "png",
  "tiff",
  "raw",
  "webp",
];

const extensionAliases = new Map<string, Format>([
  ["tif", "tiff"],
  ["jpg", "jpeg"],
]);

export function getInputFormat(name: string): Format | undefined {
  const extension = name.split(".").pop()?.toLowerCase() as Format;
  if (extension) {
    return extensionAliases.get(extension) ??
        inputFormats.includes(extension)
      ? extension
      : undefined;
  }
}

export function getOutputFormat(name: string): Format | undefined {
  const extension = name.split(".").pop()?.toLowerCase() as Format;
  if (extension) {
    return extensionAliases.get(extension) ??
        outputFormats.includes(extension)
      ? extension
      : undefined;
  }
}
