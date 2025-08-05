import { getLanguageCode, getPath } from "../utils/path.ts";
import { changesToData, getViews, prepareField } from "../utils/data.ts";
import { Router } from "../../deps/galo.ts";

import type Document from "../document.ts";
import type { RouterData } from "../cms.ts";
import type { Data } from "../../types.ts";

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
  ({ request, cms, name, render, next, previewURL, user }) => {
    const { documents, basePath } = cms;

    // Check if the document exists
    const document = documents[name];

    if (!document) {
      return new Response("Not found", { status: 404 });
    }

    function redirect(...paths: string[]) {
      const path = getPath(basePath, "document", ...paths);
      return Response.redirect(new URL(path, request.url));
    }

    function getPreviewURL(document: Document, changed = false) {
      return (document.previewURL ?? previewURL)?.(
        document.source.path,
        cms,
        changed,
      );
    }

    return next()
      /* GET /document/:name/edit - Show the document editor */
      .get("/edit", async () => {
        let data: Data;
        try {
          data = await document.read(true);
        } catch (error) {
          return render("document/edit-error.vto", {
            error: (error as Error).message,
            document,
            user,
          });
        }

        const initViews = typeof document.views === "function"
          ? document.views() || []
          : document.views || [];

        return render("document/edit.vto", {
          document,
          fields: await prepareField(document.fields, cms, data),
          views: Array.from(getViews(document.fields)),
          initViews,
          url: getPreviewURL(document),
          data,
          user,
        });
      })
      /* POST /document/:name/edit - Save the document */
      .post("/edit", async ({ request }) => {
        if (!user.canEdit(document)) {
          throw new Error("Permission denied to edit this document");
        }
        const body = await request.formData();
        await document.write(
          changesToData(Object.fromEntries(body)),
          cms,
          true,
        );

        // Wait for the preview URL to be ready
        await getPreviewURL(document, true);

        return redirect(document.name, "edit");
      })
      /* GET /document/:name/code - Show the code editor */
      .get("/code", async () => {
        const data = { root: { code: await document.readText(true) } };
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

        return render("document/code.vto", {
          fields,
          data,
          url: getPreviewURL(document),
          document,
          user,
        });
      })
      /* POST /document/:name/code - Save the code */
      .post("/code", async ({ request }) => {
        if (!user.canEdit(document)) {
          throw new Error("Permission denied to edit this document");
        }
        const body = await request.formData();
        const code = body.get("root.code") as string | undefined;
        document.writeText(code ?? "");

        // Wait for the preview URL to be ready
        await getPreviewURL(document, true);

        return redirect(document.name, "code");
      });
  },
);

export default app;
