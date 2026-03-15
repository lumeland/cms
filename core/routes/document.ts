import { getPath } from "../utils/path.ts";
import { Router } from "../../deps/galo.ts";

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
          "Location": getPath(basePath, "document", document.name, ...paths),
        }),
      });
    }

    return next()
      /* GET /document/:name/edit */
      .get("/edit", async () => {
        // If there are no fields defined, redirect to the code editor
        if (document.fields === undefined) {
          return redirect("code");
        }

        try {
          const data = await getDocument(user, document, cms);

          return render("document/edit.vto", {
            user,
            document,
            ...data,
          });
        } catch (error) {
          return render("document/edit-error.vto", {
            user,
            document,
            error: (error as Error).message,
          });
        }
      })
      /* POST /document/:name/edit */
      .post("/edit", async ({ request }) => {
        const changes = Object.fromEntries(await request.formData());
        await saveDocument(user, document, cms, changes);
        return redirect("edit");
      })
      /* GET /document/:name/code */
      .get("/code", async () => {
        const data = await getDocumentCode(user, document, cms);
        return render("document/code.vto", { user, document, ...data });
      })
      /* POST /document/:name/code */
      .post("/code", async ({ request }) => {
        const changes = Object.fromEntries(await request.formData());
        await saveDocumentCode(user, document, cms, changes);
        return redirect("code");
      });
  },
);

export default app;
