import { getPath, normalizeName } from "../utils/path.ts";
import { Router } from "../../deps/galo.ts";

import type { RouterData } from "../cms.ts";
import {
  deleteDocument,
  duplicateDocument,
  getCollection,
  getDocument,
  getDocumentCode,
  getNewDocument,
  moveDocument,
  saveDocument,
  saveDocumentCode,
  saveNewDocument,
} from "../usecases/collections.ts";

/**
 * Route for managing collections in the CMS.
 */
const app = new Router<RouterData>();

app.path(
  "/:name/*",
  ({ request, cms, render, name, next, user }) => {
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

    return next()
      /* GET /collection/:name */
      .get("/", async () => {
        const { tree } = await getCollection(user, collection);

        return render("collection/list.vto", {
          collection,
          tree,
          user,
        });
      })
      /* GET /collection/:name/create */
      .get("/create", async ({ request }) => {
        const { searchParams } = new URL(request.url);
        const defaults = Object.fromEntries(searchParams);
        const data = await getNewDocument(user, collection, cms, defaults);

        return render("collection/create.vto", {
          user,
          collection,
          defaults,
          ...data,
        });
      })
      /* POST /collection/:name/create */
      .post("/create", async ({ request }) => {
        const changes = Object.fromEntries(await request.formData());
        const { document } = await saveNewDocument(
          user,
          collection,
          cms,
          changes,
        );

        return redirect(collection.name, document.name, "edit");
      })
      .path("/:file/*", ({ file, next }) => {
        file = normalizeName(file);
        const document = collection?.get(file);

        if (!document) {
          return new Response("Not found", { status: 404 });
        }

        return next()
          /* GET /collection/:name/:file/edit */
          .get("/edit", async () => {
            // If there are no fields defined, redirect to the code editor
            if (collection.fields === undefined) {
              return redirect(collection.name, document.name, "code");
            }

            try {
              const data = await getDocument(user, collection, document, cms);

              return render("collection/edit.vto", {
                user,
                collection,
                document,
                ...data,
              });
            } catch (error) {
              return render("collection/edit-error.vto", {
                user,
                collection,
                document,
                error: (error as Error).message,
              });
            }
          })
          /* POST /collection/:name/:file/edit */
          .post("/edit", async () => {
            const changes = Object.fromEntries(await request.formData());
            const { finalDocument } = await saveDocument(
              user,
              collection,
              document,
              cms,
              changes,
            );

            return redirect(collection.name, finalDocument.name, "edit");
          })
          /* GET /collection/:name/:file/code */
          .get("/code", async () => {
            const data = await getDocumentCode(user, collection, document, cms);

            return render("collection/code.vto", {
              user,
              collection,
              document,
              ...data,
            });
          })
          /* POST /collection/:name/:file/code */
          .post("/code", async ({ request }) => {
            const changes = Object.fromEntries(await request.formData());
            const { finalDocument } = await saveDocumentCode(
              user,
              collection,
              document,
              cms,
              changes,
            );

            return redirect(collection.name, finalDocument.name, "code");
          })
          /* POST /collection/:name/:file/duplicate */
          .post("/duplicate", async ({ request }) => {
            const changes = Object.fromEntries(await request.formData());
            const newName = changes.name as string;

            const { newDocument } = await duplicateDocument(
              user,
              collection,
              document,
              cms,
              newName,
              changes,
            );

            return redirect(collection.name, newDocument.name, "edit");
          })
          /* POST /collection/:name/:file/move */
          .post("/move", async ({ request }) => {
            const data = await request.formData();
            const newName = data.get("name") as string;

            const { newDocument } = await moveDocument(
              user,
              collection,
              document,
              cms,
              newName,
            );

            return redirect(collection.name, newDocument.name, "edit");
          })
          /* POST /collection/:name/:file/delete */
          .post("/delete", async () => {
            await deleteDocument(user, collection, document);
            return redirect(collection.name);
          });
      });
  },
);

export default app;
