import { changesToData, getViews, prepareField } from "../utils/data.ts";
import { getLanguageCode } from "../utils/path.ts";

import type { CMSContent } from "../../types.ts";
import type Document from "../document.ts";
import type User from "../user.ts";

export async function getDocument(
  user: User,
  document: Document,
  cms: CMSContent,
) {
  if (!user.canView(document)) {
    throw new Error("Permission denied to view this document");
  }

  const data = await document.read(true);
  const initViews = typeof document.views === "function"
    ? document.views() || []
    : document.views || [];

  const fields = await prepareField(document.fields!, cms, data, document);
  const views = Array.from(getViews(document.fields!));
  const url = await getPreviewUrl(document, cms);

  return { data, fields, views, initViews, url };
}

export async function getDocumentCode(
  user: User,
  document: Document,
  cms: CMSContent,
) {
  if (!user.canView(document)) {
    throw new Error("Permission denied to view this document");
  }

  const data = { root: { code: await document.readText(true) } };
  const url = await getPreviewUrl(document, cms);
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

export async function saveDocument(
  user: User,
  document: Document,
  cms: CMSContent,
  changes: Record<string, unknown>,
) {
  if (!user.canEdit(document)) {
    throw new Error("Permission denied to edit this document");
  }

  await document.write(
    changesToData(changes),
    cms,
    true,
  );

  // Wait for the preview URL to be ready
  await getPreviewUrl(document, cms, true);
}

export async function saveDocumentCode(
  user: User,
  document: Document,
  cms: CMSContent,
  changes: Record<string, unknown>,
) {
  if (!user.canEdit(document)) {
    throw new Error("Permission denied to edit this document");
  }

  const code = changes["root.code"] as string | undefined;
  await document.writeText(code ?? "");

  // Wait for the preview URL to be ready
  await getPreviewUrl(document, cms, true);
}

export function getPreviewUrl(
  document: Document,
  cms: CMSContent,
  changed = false,
) {
  if (document.previewUrl) {
    return document.previewUrl(
      document.source.path,
      cms,
      changed,
      document.storage,
    );
  }
}
