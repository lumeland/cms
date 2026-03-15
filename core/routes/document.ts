import { getPath } from "../utils/path.ts";
import { Router } from "../../deps/galo.ts";

import type Document from "../document.ts";
import type { RouterData } from "../cms.ts";
import {
  getDocument,
  getDocumentCode,
  saveDocument,
  saveDocumentCode,
} from "../usecases/documents.ts";

/**
 * Route for managing document editing in the CMS.
 * Handles viewing, editing, and saving documents.
 *
 * /document/:name/edit - Edit a document
 * /document/:name/code - Edit the document's code
 */

const app = new Router<RouterData>();

app.path(
  "/:name/*",
  ({ cms, name, render, next, user }) => {
    const { documents, basePath } = cms;

    // Check if the document exists
    const document = documents[name];

    if (!document) {
      return new Response("Not found", { status: 404 });
    }

    function redirect(...paths: string[]) {
      return new Response(null, {
        status: 302,
        headers: new Headers({
          "Location": getPath(basePath, "document", ...paths),
        }),
      });
    }

    function getPreviewUrl(document: Document, changed = false) {
      return document.previewUrl?.(
        document.source.path,
        cms,
        changed,
        document.storage,
      );
    }

    return next()
      /* GET /document/:name/edit - Show the document editor */
      .get("/edit", async () => {
        // If there are no fields defined, redirect to the code editor
        if (document.fields === undefined) {
          return redirect(document.name, "code");
        }

        try {
          const { fields, views, initViews, data } = await getDocument(
            document,
            cms,
          );

          return render("document/edit.vto", {
            document,
            fields,
            views,
            initViews,
            url: getPreviewUrl(document),
            data,
            user,
          });
        } catch (error) {
          return render("document/edit-error.vto", {
            error: (error as Error).message,
            document,
            user,
          });
        }
      })
      /* POST /document/:name/edit - Save the document */
      .post("/edit", async ({ request }) => {
        const data = await request.formData();
        const changes = Object.fromEntries(data);
        await saveDocument(user, document, cms, changes);

        // Wait for the preview URL to be ready
        await getPreviewUrl(document, true);

        return redirect(document.name, "edit");
      })
      /* GET /document/:name/code - Show the code editor */
      .get("/code", async () => {
        const { data, fields } = await getDocumentCode(document);

        return render("document/code.vto", {
          fields,
          data,
          url: getPreviewUrl(document),
          document,
          user,
        });
      })
      /* POST /document/:name/code - Save the code */
      .post("/code", async ({ request }) => {
        const data = await request.formData();
        const changes = Object.fromEntries(data);
        await saveDocumentCode(user, document, changes);

        // Wait for the preview URL to be ready
        await getPreviewUrl(document, true);

        return redirect(document.name, "code");
      });
  },
);

export default app;
