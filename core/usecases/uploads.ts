import createTree from "./tree.ts";
import { getLanguageCode, normalizeName } from "../utils/path.ts";
import { posix } from "../../deps/std.ts";
import { parseExif } from "../../deps/exifr.ts";
import { slugify } from "../utils/string.ts";
import type Upload from "../upload.ts";
import type User from "../user.ts";
import {
  MagickFormat,
  MagickGeometry,
  supportedFormats,
  transform,
} from "../../deps/imagick.ts";

export function getUploads(user: User, uploads: Upload[]): Upload[] {
  return uploads.filter((upload) => upload.listed && user.canView(upload));
}

export async function getUpload(upload: Upload, folder?: string) {
  let tree = createTree(await Array.fromAsync(upload));
  const parts = folder?.split("/").filter(Boolean) ?? [];

  for (const part of parts) {
    const treePart = tree.folders?.get(part);

    if (!treePart) {
      tree = { path: parts.join("/") + "/" };
      break;
    }
    tree = treePart;
  }

  return { tree, parts };
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

export async function getDocumentCode(
  user: User,
  upload: Upload,
  name: string,
) {
  if (!user.canEdit(upload)) {
    throw new Error("Permission denied to edit this document");
  }

  const file = upload.get(name);
  const code = await file.readText();

  const data = { root: { code } };

  const fields = {
    tag: "f-object-root",
    name: "root",
    fields: [{
      tag: "f-code",
      name: "code",
      label: "Code",
      type: "code",
      attributes: {
        data: {
          language: getLanguageCode(name, ""),
        },
      },
    }],
  };

  return { data, fields };
}

export async function saveDocumentCode(
  user: User,
  upload: Upload,
  name: string,
  changes: Record<string, unknown>,
) {
  if (!user.canEdit(upload)) {
    throw new Error("Permission denied to edit this file");
  }

  const code = changes["root.code"] as string | undefined;
  const file = upload.get(name);
  await file.writeText(code ?? "");
}

export async function saveDocument(
  user: User,
  upload: Upload,
  name: string,
  file: File,
) {
  if (!user.canEdit(upload)) {
    throw new Error("Permission denied to update files in this upload");
  }

  const entry = upload.get(name);
  await entry.writeFile(file);
}

export async function getDocument(upload: Upload, name: string) {
  const entry = upload.get(name);
  const fileData = await entry.readFile();
  const type = fileData.type;
  const size = fileData.size;
  const exif = await parseExif(fileData);
  const isCroppeable = !!getFormat(name);
  const isCodeEditable = !!getLanguageCode(name, "") || type.includes("text/");

  return { type, size, exif, isCroppeable, isCodeEditable };
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
  const format = getFormat(newName);
  if (format && getFormat(name)) {
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

  return getFormat(name);
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

export function getFormat(file: string): MagickFormat | undefined {
  const extension = file.split(".").pop();
  return extension && supportedFormats.includes(extension.toUpperCase())
    ? extension.toUpperCase() as MagickFormat
    : undefined;
}
