import { initializeImageMagick } from "https://cdn.jsdelivr.net/npm/@imagemagick/magick-wasm@0.0.35/dist/index.js";
import {
  ImageMagick,
  MagickFormat,
  MagickGeometry,
} from "https://cdn.jsdelivr.net/npm/@imagemagick/magick-wasm@0.0.35/dist/index.js";
import type {
  IMagickImage,
  MagickFormat as IMagickFormat,
} from "https://cdn.jsdelivr.net/npm/@imagemagick/magick-wasm@0.0.35/dist/index.d.ts";

await initialize();

export { ImageMagick, IMagickFormat as MagickFormat, MagickGeometry };

export function transform(
  file: File,
  fn: (img: IMagickImage) => void,
): Promise<Uint8Array> {
  return file.arrayBuffer()
    .then((data) => {
      return new Promise((resolve) => {
        ImageMagick.read(new Uint8Array(data), (img: IMagickImage) => {
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

export function formatSupported(file: string): IMagickFormat | undefined {
  const extension = file.split(".").pop();
  return extension && supportedFormats.includes(extension.toUpperCase())
    ? extension.toUpperCase() as IMagickFormat
    : undefined;
}

async function initialize() {
  const wasmUrl = new URL(
    "https://cdn.jsdelivr.net/npm/@imagemagick/magick-wasm@0.0.35/dist/magick.wasm",
  );

  if (typeof caches === "undefined" || globalThis?.Netlify) {
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
