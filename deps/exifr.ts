import exifr from "exifr";

const supportedFormats: string[] = [
  "jpeg",
  "jpg",
  "png",
  "tiff",
  "heic",
  "avif",
];

export function formatSupported(file: string): boolean {
  const extension = file.split(".").pop();
  return !!extension && supportedFormats.includes(extension.toLowerCase());
}

export async function parseExif(
  file: File,
): Promise<Record<string, unknown> | undefined> {
  if (formatSupported(file.name)) {
    return await exifr.parse(file);
  }
}
