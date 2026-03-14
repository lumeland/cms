import { posix } from "../../deps/std.ts";
import { CMSContent, Data } from "../../types.ts";
import { changesToData, getViews, prepareField } from "../utils/data.ts";
import { normalizeName } from "../utils/path.ts";
import createTree from "./tree.ts";
import type Collection from "../collection.ts";
import type Document from "../document.ts";
import type User from "../user.ts";

export async function getCollection(collection: Collection) {
  const tree = createTree(await Array.fromAsync(collection));

  return { tree };
}

export async function getNewDocument(
  collection: Collection,
  cms: CMSContent,
  params: URLSearchParams,
) {
  if (collection.fields === undefined) {
    throw new Error(
      "Create document without fields is not supported yet",
    );
  }

  const initViews = typeof collection.views === "function"
    ? collection.views() || []
    : collection.views || [];

  const defaults = Object.fromEntries(params);
  const fields = await prepareField(collection.fields, cms);
  const views = Array.from(getViews(collection.fields));
  const folder = normalizeName(params.get("folder"));

  return { initViews, fields, views, folder, defaults };
}

export async function saveNewDocument(
  collection: Collection,
  cms: CMSContent,
  body: FormData,
) {
  const changes = Object.fromEntries(body);
  let data = changesToData(changes);

  // Calculate the document name
  let name = normalizeName(body.get("_id") as string) ||
    collection.storage.name();

  if (changes._prefix) {
    name = posix.join(
      normalizeName(changes._prefix as string) || "",
      name,
    );
  }

  // Write the document
  const document = collection.create(name);
  data = await document.write(data, cms, true);

  // Recalculate the document name if it wasn't manually defined
  if (!body.get("_id")) {
    name = getDocumentName(collection, data) || name;
  }

  if (document.name !== name) {
    name = await collection.rename(document.name, name);
  }

  return { name, document };
}

export async function getDocument(
  collection: Collection,
  document: Document,
  cms: CMSContent,
) {
  const data = await document.read();

  const initViews = typeof collection.views === "function"
    ? collection.views() || []
    : collection.views || [];

  const fields = await prepareField(collection.fields!, cms, data, document);
  const views = Array.from(getViews(collection.fields!));

  return { data, initViews, fields, views };
}

export async function saveDocument(
  user: User,
  collection: Collection,
  document: Document,
  cms: CMSContent,
  body: FormData,
) {
  let name = normalizeName(body.get("_id") as string);
  let finalDocument = document;

  if (!name) {
    throw new Error("Document name is required");
  }

  if (document.name === name && !user.canEdit(collection)) {
    throw new Error("Permission denied to edit document");
  }

  if (document.name !== name && !user.canRename(collection)) {
    throw new Error("Permission denied to rename document");
  }

  const changes = Object.fromEntries(body);

  // Save changes
  const data = await document.write(changesToData(changes), cms);

  // Recalculate the document name automatically
  if (collection.permissions.rename === "auto") {
    name = getDocumentName(collection, data) || name;
  }

  if (document.name !== name) {
    name = await collection.rename(document.name, name);
    finalDocument = collection.get(name);
  }

  return { finalDocument };
}

export async function saveDocumentCode(
  user: User,
  collection: Collection,
  document: Document,
  body: FormData,
) {
  let name = normalizeName(body.get("_id") as string);
  let finalDocument = document;

  if (!name) {
    throw new Error("Document name is required");
  }

  if (document.name === name && !user.canEdit(collection)) {
    throw new Error("Permission denied to edit document");
  }

  if (document.name !== name) {
    if (!user.canRename(collection)) {
      throw new Error("Permission denied to rename document");
    }
    name = await collection.rename(document.name, name);
    finalDocument = collection.get(name);
  }

  const code = body.get("root.code") as string | undefined;
  finalDocument.writeText(code ?? "");

  return { finalDocument };
}

export async function duplicateDocument(
  user: User,
  collection: Collection,
  document: Document,
  cms: CMSContent,
  body: FormData,
) {
  if (!user.canCreate(collection)) {
    throw new Error("Permission denied");
  }

  let name = normalizeName(body.get("_id") as string);

  if (!name) {
    throw new Error("Document name is required");
  }

  // If the name is already used, generate one
  if (document.name === name) {
    name = collection.storage.name();
  }

  const newDocument = collection.create(name);
  await newDocument.write(
    changesToData(Object.fromEntries(body)),
    cms,
    true,
  );

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
