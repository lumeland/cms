import { changesToData, getViews, prepareField } from "../utils/data.ts";
import { getLanguageCode, getPath, normalizeName } from "../utils/path.ts";
import { posix } from "../../deps/std.ts";
import { Router } from "../../deps/galo.ts";
import createTree from "../templates/tree.ts";

import type Collection from "../collection.ts";
import type { RouterData } from "../cms.ts";
import type { Data } from "../../types.ts";

/**
 * Route for managing collections in the CMS.
 * Handles viewing, editing, creating, and deleting documents within a collection.
 *
 * /collection/:name - View the collection
 * /collection/create - Create a new document in the collection
 * /collection/:name/edit/:file - Edit a document in the collection
 * /collection/:name/code/:file - Edit the code of a document in the collection
 * /collection/:name/duplicate/:file - Duplicate a document in the collection
 * /collection/:name/delete/:file - Delete a document in the collection
 */

const app = new Router<RouterData>();

app.path("/:name/*", ({ request, cms, render, name, next, previewURL }) => {
  const { collections, basePath } = cms;
  const collection = collections[name];

  if (!collection) {
    return new Response("Not found", { status: 404 });
  }

  function redirect(...paths: string[]) {
    const path = getPath(basePath, "collection", ...paths);
    return Response.redirect(new URL(path, request.url));
  }

  return next()
    .get("/", async () => {
      const documents = await Array.fromAsync(collection);

      return render("collection/list.vto", {
        collection,
        tree: createTree(documents),
      });
    })
    .path("/create", ({ next }) => {
      if (!collection.canCreate()) {
        throw new Error("Permission denied");
      }

      return next()
        .get(async ({ request }) => {
          const { searchParams } = new URL(request.url);
          const defaults = Object.fromEntries(searchParams);

          const fields = await Promise.all(
            collection.fields.map((field) => prepareField(field, cms)),
          );

          const collectionViews = collection.views;
          const initViews = typeof collectionViews === "function"
            ? collectionViews() || []
            : collectionViews || [];

          const views = new Set();
          collection.fields.forEach((field) => getViews(field, views));

          return render("collection/create.vto", {
            defaults,
            collection,
            fields,
            initViews,
            views: Array.from(views),
            folder: normalizeName(searchParams.get("folder")),
          });
        })
        .post(async ({ request }) => {
          const body = await request.formData();
          const changes = Object.fromEntries(body);
          const data = changesToData(changes);
          let name = normalizeName(body.get("_id") as string) ||
            getDocumentName(collection, data, changes);

          if (!name) {
            throw new Error("Document name is required");
          }

          if (changes._prefix) {
            name = posix.join(
              normalizeName(changes._prefix as string) || "",
              name,
            );
          }

          const document = collection.create(name);
          await document.write(data, cms, true);
          // Wait for the site to be ready
          document.url ?? await previewURL?.(document.src, true);
          return redirect(collection.name, "edit", document.name);
        });
    })
    .path("/:action/:file", ({ action, file, next }) => {
      const name = normalizeName(file);

      if (!name) {
        return new Response("Not found", { status: 400 });
      }

      const document = collection?.get(name);

      if (!document) {
        return new Response("Not found", { status: 404 });
      }

      return next()
        .get(action === "edit", async () => {
          let data: Data;

          try {
            data = await document.read();
          } catch (error) {
            return render("collection/edit-error.vto", {
              error: (error as Error).message,
              collection,
              document,
            });
          }

          const fields = await Promise.all(
            collection.fields.map((field) => prepareField(field, cms, data)),
          );

          const collectionViews = collection.views;
          const initViews = typeof collectionViews === "function"
            ? collectionViews() || []
            : collectionViews || [];

          const views = new Set();
          collection.fields.forEach((field) => getViews(field, views));
          const url = document.url ?? await previewURL?.(document.src);

          return render("collection/edit.vto", {
            collection,
            fields,
            data,
            initViews,
            url,
            views: Array.from(views),
            document,
          });
        })
        .post(action === "edit", async () => {
          const body = await request.formData();
          let newName = normalizeName(body.get("_id") as string);
          let finalDocument = document;

          if (!newName) {
            throw new Error("Document name is required");
          }

          if (
            document.name !== newName &&
            collection.permissions.rename !== true
          ) {
            throw new Error("Permission denied");
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
          // Wait for the site to be ready
          finalDocument.url ?? await previewURL?.(finalDocument.src, true);
          return redirect(collection.name, "edit", finalDocument.name);
        })
        .get(action === "code", async () => {
          const code = await document.readText();
          const fields = [{
            tag: "f-code",
            name: "code",
            label: "Code",
            type: "code",
            attributes: {
              data: {
                language: getLanguageCode(document.name),
              },
            },
          }];
          const data = { code };
          const url = document.url ?? await previewURL?.(document.src);

          return render("collection/code.vto", {
            collection,
            fields,
            data,
            url,
            document,
          });
        })
        .post(action === "code", async ({ request }) => {
          const body = await request.formData();
          let newName = normalizeName(body.get("_id") as string);
          let finalDocument = document;

          if (!newName) {
            throw new Error("Document name is required");
          }

          if (document.name !== newName) {
            if (!collection.canRename()) {
              throw new Error("Permission denied to rename document");
            }
            newName = await collection.rename(document.name, newName);
            finalDocument = collection.get(newName);
          }

          const code = body.get("changes.code") as string | undefined;
          finalDocument.writeText(code ?? "");
          // Wait for the site to be ready
          finalDocument.url ?? await previewURL?.(finalDocument.src, true);
          return redirect(collection.name, "code", finalDocument.name);
        })
        .post(action === "duplicate", async ({ request }) => {
          if (!collection.canCreate()) {
            throw new Error("Permission denied");
          }

          const body = await request.formData();
          let name = normalizeName(body.get("_id") as string);

          if (!name) {
            throw new Error("Document name is required");
          }

          if (document.name === name) {
            const ext = name.split(".").pop();
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
          // Wait for the site to be ready
          document.url ?? await previewURL?.(document.src, true);
          return redirect(collection.name, "edit", duplicate.name);
        })
        .post(action === "delete", async () => {
          if (!collection.canDelete()) {
            throw new Error("Permission denied");
          }

          await collection.delete(document.name);
          return redirect(collection.name);
        });
    });
});

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
          const value = changes[`changes.${key}`];
          if (typeof value === "string") {
            return value.replaceAll("/", "").trim();
          }
          return "";
        },
      ).trim();

    case "function":
      return collection.documentName(data);
  }
}
