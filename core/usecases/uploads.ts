import createTree from "./tree.ts";
import { normalizeName } from "../utils/path.ts";
import { posix } from "../../deps/std.ts";
import { parseExif } from "../../deps/exifr.ts";
import { slugify } from "../utils/string.ts";
import type Upload from "../upload.ts";
import type User from "../user.ts";
import {
  formatSupported,
  MagickGeometry,
  transform,
} from "../../deps/imagick.ts";

export function getUploads(user: User, uploads: Upload[]): Upload[] {
  return uploads.filter((upload) => upload.listed && user.canView(upload));
}

export async function getUpload(upload: Upload) {
  const tree = createTree(await Array.fromAsync(upload));
  return { tree };
}

export function getNewDocument(
  user: User,
  upload: Upload,
  folder: string,
) {
  if (!user.canCreate(upload)) {
    throw new Error("Permission denied to create files in this upload");
  }

  folder = normalizeName(folder);

  return { folder };
}

export async function saveNewDocument(
  user: User,
  upload: Upload,
  files: File[],
  folder?: string,
) {
  if (!user.canCreate(upload)) {
    throw new Error("Permission denied to create files in this upload");
  }

  const names: string[] = [];

  for (const file of files) {
    let name = file.name as string | undefined;

    if (folder) {
      name = posix.join(folder, name!);
    }

    name = normalizeName(slugify(name!));

    if (!name) {
      throw new Error(`Invalid file name: ${file.name}`);
    }

    const entry = upload.get(name);
    await entry.writeFile(file);
    names.push(name);
  }

  return { names };
}

export async function getDocument(upload: Upload, name: string) {
  const entry = upload.get(name);
  const fileData = await entry.readFile();
  const type = fileData.type;
  const size = fileData.size;
  const exif = await parseExif(fileData);

  return { type, size, exif };
}

export async function moveDocument(
  user: User,
  upload: Upload,
  name: string,
  newName: string,
  copy = false,
) {
  if (!user.canEdit(upload)) {
    throw new Error("Permission denied to edit this file");
  }

  newName = normalizeName(newName);

  if (!newName) {
    throw new Error("Invalid file name");
  }

  if (name === newName) {
    return { newName };
  }

  if (copy) {
    const file = await upload.get(name).readFile();
    const newFile = upload.get(newName);
    await newFile.writeFile(file);
  } else {
    await upload.rename(name, newName);
  }

  // Transform images (i.e. renaming from jpg to png)
  const format = formatSupported(newName);
  if (format && formatSupported(name)) {
    const extFrom = name.split(".").pop()?.toLowerCase();
    const extTo = newName.split(".").pop()?.toLowerCase();

    if (extTo && extFrom !== extTo) {
      const entry = upload.get(newName);
      const img = await transform(await entry.readFile(), (img) => {
        img.format = format;
      });
      await entry.writeFile(new File([img], newName));
    }
  }

  return { newName };
}

export function canCropDocument(user: User, upload: Upload, name: string) {
  if (!user.canEdit(upload)) {
    throw new Error("Permission denied to edit this file");
  }

  return formatSupported(name);
}

interface Crop {
  x: number;
  y: number;
  width: number;
  height: number;
}

export async function saveCropDocument(
  user: User,
  upload: Upload,
  name: string,
  crop: Crop,
) {
  if (!user.canEdit(upload)) {
    throw new Error("Permission denied to edit this file");
  }

  const { x, y, width, height } = crop;

  if (
    Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(width) ||
    Number.isNaN(height)
  ) {
    throw new Error("Invalid crop values");
  }
  const entry = upload.get(name);
  const img = await transform(
    await entry.readFile(),
    (img) => {
      img.crop(new MagickGeometry(x, y, width, height));
    },
  );

  const file = new File([img], name);
  await entry.writeFile(file);
}

export async function deleteDocument(user: User, upload: Upload, name: string) {
  if (!user.canDelete(upload)) {
    throw new Error("Permission denied to delete this file");
  }
  await upload.delete(name);
}
