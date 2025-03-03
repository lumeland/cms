import { initializeImageMagick } from "npm:@imagemagick/magick-wasm@0.0.34";
import {
  ImageMagick,
  type IMagickImage,
  MagickFormat,
  MagickGeometry,
} from "npm:@imagemagick/magick-wasm@0.0.34";

await initialize();

export { ImageMagick, MagickFormat, MagickGeometry };

export function transform(
  file: File,
  fn: (img: IMagickImage) => void,
): Promise<Uint8Array> {
  return file.arrayBuffer()
    .then((data) => {
      return new Promise((resolve) => {
        ImageMagick.read(new Uint8Array(data), (img) => {
          fn(img);
          img.write((data) => {
            resolve(data);
          });
        });
      });
    });
}

const supportedFormats: string[] = [
  MagickFormat.Avif,
  MagickFormat.Gif,
  MagickFormat.Heif,
  MagickFormat.Jpeg,
  MagickFormat.Jpg,
  MagickFormat.Jp2,
  MagickFormat.Jxl,
  MagickFormat.Png,
  MagickFormat.Tiff,
  MagickFormat.Tif,
  MagickFormat.WebP,
];

export function formatSupported(file: string): MagickFormat | undefined {
  const extension = file.split(".").pop();
  return extension && supportedFormats.includes(extension.toUpperCase())
    ? extension.toUpperCase() as MagickFormat
    : undefined;
}

async function initialize() {
  const wasmUrl = new URL(
    "https://cdn.jsdelivr.net/npm/@imagemagick/magick-wasm@0.0.34/dist/magick.wasm",
  );

  if (typeof caches === "undefined") {
    const response = await fetch(wasmUrl);
    await initializeImageMagick(new Int8Array(await response.arrayBuffer()));
    return;
  }

  const cache = await caches.open("magick_native");
  const cached = await cache.match(wasmUrl);

  if (cached) {
    await initializeImageMagick(new Int8Array(await cached.arrayBuffer()));
    return;
  }

  const response = await fetch(wasmUrl);
  await cache.put(wasmUrl, response.clone());
  await initializeImageMagick(new Int8Array(await response.arrayBuffer()));
}
