import { changesToData, getViews, prepareField } from "../utils/data.ts";
import {
  getExtension,
  getLanguageCode,
  getPath,
  normalizeName,
} from "../utils/path.ts";
import { posix } from "../../deps/std.ts";
import { Router } from "../../deps/galo.ts";
import createTree from "../templates/tree.ts";

import type Document from "../document.ts";
import type Collection from "../collection.ts";
import type { RouterData } from "../cms.ts";
import type { Data } from "../../types.ts";

/**
 * Route for managing collections in the CMS.
 * Handles viewing, editing, creating, and deleting documents within a collection.
 *
 * /collection/:name - View the collection
 * /collection/:name/create - Create a new document in the collection
 * /collection/:name/:file/edit - Edit a document in the collection
 * /collection/:name/:file/code - Edit the code of a document in the collection
 * /collection/:name/:file/duplicate - Duplicate a document in the collection
 * /collection/:name/:file/delete - Delete a document in the collection
 */

const app = new Router<RouterData>();

app.path(
  "/:name/*",
  ({ request, cms, render, name, next, previewUrl, user }) => {
    const { collections, basePath } = cms;
    const collection = collections[name];

    if (!collection) {
      return new Response("Not found", { status: 404 });
    }

    function redirect(...paths: string[]) {
      return new Response(null, {
        status: 302,
        headers: new Headers({
          "Location": getPath(basePath, "collection", ...paths),
        }),
      });
    }

    function getPreviewUrl(document: Document, changed = false) {
      return (collection.previewUrl ?? previewUrl)?.(
        document.source.path,
        cms,
        changed,
        document.storage,
      );
    }

    return next()
      /* /collection/:name - View the collection */
      .get("/", async () => {
        return render("collection/list.vto", {
          collection,
          tree: createTree(await Array.fromAsync(collection)),
          user,
        });
      })
      /* /collection/:name/create - Create a new document in the collection */
      .path("/create", ({ next }) => {
        if (!user.canCreate(collection)) {
          throw new Error("Permission denied");
        }

        return next()
          .get(async ({ request }) => {
            if (collection.fields === undefined) {
              throw new Error(
                "Create document without fields is not supported yet",
              );
            }

            const { searchParams } = new URL(request.url);
            const initViews = typeof collection.views === "function"
              ? collection.views() || []
              : collection.views || [];

            return render("collection/create.vto", {
              defaults: Object.fromEntries(searchParams),
              collection,
              fields: await prepareField(collection.fields, cms),
              initViews,
              views: Array.from(getViews(collection.fields)),
              folder: normalizeName(searchParams.get("folder")),
              user,
            });
          })
          .post(async ({ request }) => {
            const body = await request.formData();
            const changes = Object.fromEntries(body);
            const data = changesToData(changes);

            // Calculate the document name
            let name = normalizeName(body.get("_id") as string) ||
              getDocumentName(collection, data, changes) ||
              collection.storage.name();

            if (changes._prefix) {
              name = posix.join(
                normalizeName(changes._prefix as string) || "",
                name,
              );
            }

            // Write the document
            const document = collection.create(name);
            await document.write(data, cms, true);

            // Wait for the preview URL to be ready before redirecting
            await getPreviewUrl(document, true);

            return redirect(collection.name, document.name, "edit");
          });
      })
      /* /collection/:name/:file/* - Document actions */
      .path("/:file/*", ({ file, next }) => {
        file = normalizeName(file);
        const document = collection?.get(file);

        if (!document) {
          return new Response("Not found", { status: 404 });
        }

        return next()
          /* GET /collection/:name/:file/edit - Show edit form */
          .get("/edit", async () => {
            // If there are no fields defined, redirect to the code editor
            if (collection.fields === undefined) {
              return redirect(collection.name, document.name, "code");
            }

            let data: Data;
            try {
              data = await document.read();
            } catch (error) {
              return render("collection/edit-error.vto", {
                error: (error as Error).message,
                collection,
                document,
                user,
              });
            }

            const initViews = typeof collection.views === "function"
              ? collection.views() || []
              : collection.views || [];

            return render("collection/edit.vto", {
              collection,
              fields: await prepareField(collection.fields, cms, data),
              data,
              initViews,
              url: await getPreviewUrl(document),
              views: Array.from(getViews(collection.fields)),
              document,
              user,
            });
          })
          /* POST /collection/:name/:file/edit - Save edit data */
          .post("/edit", async () => {
            const body = await request.formData();
            let newName = normalizeName(body.get("_id") as string);
            let finalDocument = document;

            if (!newName) {
              throw new Error("Document name is required");
            }

            if (document.name === newName && !user.canEdit(collection)) {
              throw new Error("Permission denied to edit document");
            }

            if (
              document.name !== newName &&
              !user.canRename(collection)
            ) {
              throw new Error("Permission denied to rename document");
            }
            const changes = Object.fromEntries(body);
            const data = changesToData(changes);

            // Recalculate the document name automatically
            if (collection.permissions.rename === "auto") {
              newName = getDocumentName(collection, data, changes) ||
                newName;
            }

            if (document.name !== newName) {
              newName = await collection.rename(document.name, newName);
              finalDocument = collection.get(newName);
            }

            await finalDocument.write(data, cms);

            // Wait for the preview URL to be ready
            await getPreviewUrl(finalDocument, true);

            return redirect(collection.name, finalDocument.name, "edit");
          })
          /* GET /collection/:name/:file/code - Show the code editor */
          .get("/code", async () => {
            const data = { root: { code: await document.readText() } };
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
                    language: getLanguageCode(document.name),
                  },
                },
              }],
            };

            return render("collection/code.vto", {
              collection,
              fields,
              data,
              url: await getPreviewUrl(document),
              document,
              user,
            });
          })
          /* POST /collection/:name/:file/code - Save code changes */
          .post("/code", async ({ request }) => {
            const body = await request.formData();
            let newName = normalizeName(body.get("_id") as string);
            let finalDocument = document;

            if (!newName) {
              throw new Error("Document name is required");
            }

            if (document.name === newName && !user.canEdit(collection)) {
              throw new Error("Permission denied to edit document");
            }

            if (document.name !== newName) {
              if (!user.canRename(collection)) {
                throw new Error("Permission denied to rename document");
              }
              newName = await collection.rename(document.name, newName);
              finalDocument = collection.get(newName);
            }

            const code = body.get("root.code") as string | undefined;
            finalDocument.writeText(code ?? "");

            // Wait for the preview URL to be ready
            await getPreviewUrl(finalDocument, true);

            return redirect(collection.name, finalDocument.name, "code");
          })
          /* POST /collection/:name/:file/duplicate - Duplicate the document */
          .post("/duplicate", async ({ request }) => {
            if (!user.canCreate(collection)) {
              throw new Error("Permission denied");
            }

            const body = await request.formData();
            let name = normalizeName(body.get("_id") as string);

            if (!name) {
              throw new Error("Document name is required");
            }

            // If the name is already used, append "-copy" to it
            if (document.name === name) {
              const ext = getExtension(name);
              if (ext) {
                name = name.substring(0, name.length - ext.length - 1) +
                  "-copy." +
                  ext;
              } else {
                name = `${name}-copy`;
              }
            }

            const duplicate = collection.create(name);
            await duplicate.write(
              changesToData(Object.fromEntries(body)),
              cms,
              true,
            );

            // Wait for the preview URL to be ready
            await getPreviewUrl(duplicate, true);

            return redirect(collection.name, duplicate.name, "edit");
          })
          /* POST /collection/:name/:file/delete - Delete the document */
          .post("/delete", async () => {
            if (!user.canDelete(collection)) {
              throw new Error("Permission denied");
            }

            await collection.delete(document.name);
            return redirect(collection.name);
          });
      });
  },
);

export default app;

function getDocumentName(
  collection: Collection,
  data: Data,
  changes: Record<string, unknown>,
) {
  switch (typeof collection.documentName) {
    case "string":
      return collection.documentName.replaceAll(
        /\{([^}\s]+)\}/g,
        (_, key) => {
          const value = changes[`root.${key}`];
          if (typeof value === "string") {
            return value.replaceAll("/", "").trim();
          }
          return "";
        },
      ).trim();

    case "function":
      return collection.documentName((data.root ?? {}) as Data);
  }
}
