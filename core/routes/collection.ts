import { getPath, normalizeName } from "../utils/path.ts";
import { Router } from "../../deps/galo.ts";

import type Document from "../document.ts";
import type { RouterData } from "../cms.ts";
import {
  deleteDocument,
  duplicateDocument,
  getCollection,
  getDocument,
  getNewDocument,
  saveDocument,
  saveDocumentCode,
  saveNewDocument,
} from "../usecases/collections.ts";
import { getDocumentCode } from "../usecases/documents.ts";

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
        const { tree } = await getCollection(collection);

        return render("collection/list.vto", {
          collection,
          tree,
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
            const { searchParams } = new URL(request.url);
            const { defaults, initViews, views, fields, folder } =
              await getNewDocument(collection, cms, searchParams);

            return render("collection/create.vto", {
              defaults,
              collection,
              fields,
              initViews,
              views,
              folder,
              user,
            });
          })
          .post(async ({ request }) => {
            const { name, document } = await saveNewDocument(
              collection,
              cms,
              await request.formData(),
            );

            // Wait for the preview URL to be ready before redirecting
            await getPreviewUrl(document, true);

            return redirect(collection.name, name, "edit");
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

            try {
              const { data, initViews, views, fields } = await getDocument(
                collection,
                document,
                cms,
              );

              return render("collection/edit.vto", {
                collection,
                fields,
                data,
                initViews,
                url: await getPreviewUrl(document),
                views,
                document,
                user,
              });
            } catch (error) {
              return render("collection/edit-error.vto", {
                error: (error as Error).message,
                collection,
                document,
                user,
              });
            }
          })
          /* POST /collection/:name/:file/edit - Save edit data */
          .post("/edit", async () => {
            const { finalDocument } = await saveDocument(
              user,
              collection,
              document,
              cms,
              await request.formData(),
            );

            // Wait for the preview URL to be ready
            await getPreviewUrl(finalDocument, true);

            return redirect(collection.name, finalDocument.name, "edit");
          })
          /* GET /collection/:name/:file/code - Show the code editor */
          .get("/code", async () => {
            const { data, fields } = await getDocumentCode(document);

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
            const { finalDocument } = await saveDocumentCode(
              user,
              collection,
              document,
              await request.formData(),
            );

            // Wait for the preview URL to be ready
            await getPreviewUrl(finalDocument, true);

            return redirect(collection.name, finalDocument.name, "code");
          })
          /* POST /collection/:name/:file/duplicate - Duplicate the document */
          .post("/duplicate", async ({ request }) => {
            const { newDocument } = await duplicateDocument(
              user,
              collection,
              document,
              cms,
              await request.formData(),
            );

            // Wait for the preview URL to be ready
            await getPreviewUrl(newDocument, true);

            return redirect(collection.name, newDocument.name, "edit");
          })
          /* POST /collection/:name/:file/delete - Delete the document */
          .post("/delete", async () => {
            await deleteDocument(user, collection, document);
            return redirect(collection.name);
          });
      });
  },
);

export default app;
