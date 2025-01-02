import {
  ImageMagick,
  type IMagickImage,
  initialize,
  MagickFormat,
  MagickGeometry,
} from "https://deno.land/x/imagemagick_deno@0.0.31/mod.ts";

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
