import { posix } from "../../deps/std.ts";
import { CMSContent, Data } from "../../types.ts";
import { changesToData, getViews, prepareField } from "../utils/data.ts";
import { getLanguageCode, normalizeName } from "../utils/path.ts";
import createTree from "./tree.ts";
import type Collection from "../collection.ts";
import type Document from "../document.ts";
import type User from "../user.ts";

export function getCollections(
  user: User,
  collections: Collection[],
): Collection[] {
  return collections.filter((collection) => user.canView(collection));
}

export async function getCollection(user: User, collection: Collection) {
  if (!user.canView(collection)) {
    throw new Error("Permission denied");
  }

  const tree = createTree(await Array.fromAsync(collection));
  return { tree };
}

export async function getNewDocument(
  user: User,
  collection: Collection,
  cms: CMSContent,
  defaults: Record<string, string>,
) {
  if (!user.canCreate(collection)) {
    throw new Error("Permission denied");
  }

  if (collection.fields === undefined) {
    throw new Error(
      "Create document without fields is not supported yet",
    );
  }

  const initViews = typeof collection.views === "function"
    ? collection.views() || []
    : collection.views || [];

  const fields = await prepareField(collection.fields, cms);
  const views = Array.from(getViews(collection.fields));
  const folder = normalizeName(defaults.folder);

  return { initViews, fields, views, folder };
}

export async function saveNewDocument(
  user: User,
  collection: Collection,
  cms: CMSContent,
  changes: Record<string, unknown>,
) {
  if (!user.canCreate(collection)) {
    throw new Error("Permission denied");
  }

  let data = changesToData(changes);

  // Calculate the document name
  let name = normalizeName(changes._id as string) ||
    collection.storage.name();

  if (changes._prefix) {
    name = posix.join(
      normalizeName(changes._prefix as string) || "",
      name,
    );
  }

  // Write the document
  let document = collection.create(name);
  data = await document.write(data, cms, true);

  // Recalculate the document name if it wasn't manually defined
  if (!changes._id) {
    name = getDocumentName(collection, data) || name;
  }

  if (document.name !== name) {
    name = await collection.rename(document.name, name);
    document = collection.get(name);
  }

  // Wait for the preview URL to be ready before redirecting
  await getPreviewUrl(collection, document, cms, true);

  return { document };
}

export async function getDocument(
  user: User,
  collection: Collection,
  document: Document,
  cms: CMSContent,
) {
  if (!user.canView(collection)) {
    throw new Error("Permission denied");
  }

  const data = await document.read();

  const initViews = typeof collection.views === "function"
    ? collection.views() || []
    : collection.views || [];

  const fields = await prepareField(collection.fields!, cms, data, document);
  const views = Array.from(getViews(collection.fields!));
  const url = await getPreviewUrl(collection, document, cms);

  return { data, initViews, fields, views, url };
}

export async function saveDocument(
  user: User,
  collection: Collection,
  document: Document,
  cms: CMSContent,
  changes: Record<string, unknown>,
) {
  if (!user.canEdit(collection)) {
    throw new Error("Permission denied to edit document");
  }

  // Save changes
  const data = await document.write(changesToData(changes), cms);

  let name = document.name;
  let finalDocument = document;

  // Recalculate the document name automatically
  if (collection.permissions.rename === "auto") {
    name = getDocumentName(collection, data) || name;
  }

  if (document.name !== name) {
    name = await collection.rename(document.name, name);
    finalDocument = collection.get(name);
  }

  // Wait for the preview URL to be ready
  await getPreviewUrl(collection, finalDocument, cms, true);

  return { finalDocument };
}

export async function getDocumentCode(
  user: User,
  collection: Collection,
  document: Document,
  cms: CMSContent,
) {
  if (!user.canView(collection)) {
    throw new Error("Permission denied to view this document");
  }

  const data = { root: { code: await document.readText(true) } };
  const url = await getPreviewUrl(collection, document, cms);
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
          language: getLanguageCode(document.source.name),
        },
      },
    }],
  };

  return { data, fields, url };
}

export async function saveDocumentCode(
  user: User,
  collection: Collection,
  document: Document,
  cms: CMSContent,
  changes: Record<string, unknown>,
) {
  if (!user.canEdit(collection)) {
    throw new Error("Permission denied to edit document");
  }

  // Save changes
  const code = changes["root.code"] as string | undefined;
  document.writeText(code ?? "");

  let name = document.name;
  let finalDocument = document;

  // Recalculate the document name automatically
  if (collection.permissions.rename === "auto") {
    const data = await document.read();
    name = getDocumentName(collection, data.root) || name;
  }

  if (document.name !== name) {
    name = await collection.rename(document.name, name);
    finalDocument = collection.get(name);
  }

  // Wait for the preview URL to be ready
  await getPreviewUrl(collection, finalDocument, cms, true);

  return { finalDocument };
}

export async function duplicateDocument(
  user: User,
  collection: Collection,
  document: Document,
  cms: CMSContent,
  newName: string,
  changes: Record<string, unknown>,
) {
  if (!user.canCreate(collection)) {
    throw new Error("Permission denied");
  }

  newName = normalizeName(newName);
  const newDocument = collection.create(newName);

  if (document.name === newDocument.name) {
    return { newDocument: document };
  }

  await newDocument.write(
    changesToData(changes),
    cms,
    true,
  );

  // Wait for the preview URL to be ready
  await getPreviewUrl(collection, newDocument, cms, true);

  return { newDocument };
}

export async function moveDocument(
  user: User,
  collection: Collection,
  document: Document,
  cms: CMSContent,
  newName: string,
) {
  if (!user.canRename(collection)) {
    throw new Error("Permission denied to rename document");
  }

  newName = normalizeName(newName);

  if (!newName) {
    throw new Error("Invalid file name");
  }

  if (document.name === newName) {
    return { newDocument: document };
  }

  newName = await collection.rename(document.name, newName);
  const newDocument = collection.get(newName);

  // Wait for the preview URL to be ready
  await getPreviewUrl(collection, newDocument, cms, true);

  return { newDocument };
}

export async function deleteDocument(
  user: User,
  collection: Collection,
  document: Document,
) {
  if (!user.canDelete(collection)) {
    throw new Error("Permission denied");
  }

  await collection.delete(document.name);
}

function getDocumentName(
  collection: Collection,
  data: Data,
) {
  switch (typeof collection.documentName) {
    case "string":
      return collection.documentName.replaceAll(
        /\{([^}\s]+)\}/g,
        (_, key) => {
          const value = getValue(key, data);
          if (typeof value === "string") {
            return value.replaceAll("/", "").trim();
          }
          return typeof value === "number" ? value.toString() : "";
        },
      ).trim();

    case "function":
      return collection.documentName(data as Data);
  }
}

function getValue(key: string, data: Data) {
  if (!key.includes(".")) {
    return data[key];
  }

  const [, firstPart, rest] = key.match(/^([^.])\.(.*)$/)!;
  const value = data[firstPart];

  if (!value) {
    return value;
  }

  if (typeof value === "object" && rest) {
    return getValue(rest, value);
  }
}

export function getPreviewUrl(
  collection: Collection,
  document: Document,
  cms: CMSContent,
  changed = false,
) {
  if (collection.previewUrl) {
    return collection.previewUrl(
      document.source.path,
      cms,
      changed,
      document.storage,
    );
  }
}
