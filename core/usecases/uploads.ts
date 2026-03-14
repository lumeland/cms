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

export async function getUpload(upload: Upload) {
  const tree = createTree(await Array.fromAsync(upload));
  return { tree };
}

export function getNewDocument(
  user: User,
  upload: Upload,
  params: URLSearchParams,
) {
  if (!user.canCreate(upload)) {
    throw new Error("Permission denied to create files in this upload");
  }

  const folder = normalizeName(params.get("folder"));

  return { folder };
}

export async function saveNewDocument(
  user: User,
  upload: Upload,
  body: FormData,
) {
  if (!user.canCreate(upload)) {
    throw new Error("Permission denied to create files in this upload");
  }

  const files = body.getAll("files") as File[];
  const names: string[] = [];

  for (const file of files) {
    let name = file.name as string | undefined;
    const folder = body.get("_id") as string | undefined;

    if (folder) {
      name = folder.endsWith("/") ? posix.join(folder, name!) : folder;
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

export async function saveDocument(
  user: User,
  upload: Upload,
  name: string,
  body: FormData,
) {
  if (!user.canEdit(upload)) {
    throw new Error("Permission denied to edit this file");
  }

  const newName = normalizeName(body.get("_id") as string);

  if (!newName) {
    throw new Error("Invalid file name");
  }

  // Rename the file if the name has changed
  if (name !== newName) {
    await upload.rename(name, newName);
  }

  const file = body.get("file") as File | undefined;
  const entry = upload.get(newName);

  if (file) {
    await entry.writeFile(file);
  }

  // Convert format if the extension has changed (e.g., from .jpg to .png)
  const format = formatSupported(newName);
  if (name !== newName && formatSupported(name) && format) {
    const extFrom = name.split(".").pop();
    const extTo = newName.split(".").pop();

    if (extTo && extFrom !== extTo) {
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

export async function saveCropDocument(
  user: User,
  upload: Upload,
  name: string,
  body: FormData,
) {
  if (!user.canEdit(upload)) {
    throw new Error("Permission denied to edit this file");
  }

  const x = parseInt(body.get("x") as string);
  const y = parseInt(body.get("y") as string);
  const width = parseInt(body.get("width") as string);
  const height = parseInt(body.get("height") as string);

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
