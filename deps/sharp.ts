import sharp from "npm:sharp@0.33.5";

export { sharp };

export async function fromFile(file: File) {
  return sharp(new Uint8Array(await file.arrayBuffer()));
}

const supportedFormats = [
  "avif",
  "gif",
  "heif",
  "jpeg",
  "jpg",
  "jp2",
  "jxl",
  "png",
  "tiff",
  "tif",
  "webp",
];

export function formatSupported(file: string) {
  const extension = file.split(".").pop();
  return extension && supportedFormats.includes(extension);
}
