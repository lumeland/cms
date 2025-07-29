import { getLanguageCode, getPath } from "../utils/path.ts";
import { changesToData, getViews, prepareField } from "../utils/data.ts";
import { Router } from "../../deps/galo.ts";

import type { RouterData } from "../cms.ts";
import type { Data } from "../../types.ts";

/**
 * Route for managing document editing in the CMS.
 * Handles viewing, editing, and saving documents.
 *
 * /document/:name - View and edit a document
 * /document/:name/code - Edit the document's code
 */

const app = new Router<RouterData>();

app.path("/:name/*", ({ request, cms, name, render, next, previewURL }) => {
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

  return next()
    .get("/", async () => {
      let data: Data;
      try {
        data = await document.read(true);
      } catch (error) {
        return render("document/edit-error.vto", {
          error: (error as Error).message,
          document,
        });
      }

      const fields = await Promise.all(
        document.fields.map((field) => prepareField(field, cms, data)),
      );

      const documentViews = document.views;
      const initViews = typeof documentViews === "function"
        ? documentViews() || []
        : documentViews || [];

      const views = new Set();
      document.fields.forEach((field) => getViews(field, views));
      const url = document.url ?? await previewURL?.(document.src);

      return render("document/edit.vto", {
        document,
        fields,
        views: Array.from(views),
        initViews,
        url,
        data,
      });
    })
    .post("/", async ({ request }) => {
      const body = await request.formData();
      await document.write(
        changesToData(Object.fromEntries(body)),
        cms,
        true,
      );
      // Wait for the site to be ready
      document.url ?? await previewURL?.(document.src);
      return redirect(document.name);
    })
    .get("/code", async () => {
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
      return render("document/code.vto", {
        fields,
        data,
        url,
        document,
      });
    })
    .post("/code", async ({ request }) => {
      const body = await request.formData();
      const code = body.get("changes.code") as string | undefined;
      document.writeText(code ?? "");
      // Wait for the site to be ready
      document.url ?? await previewURL?.(document.src);
      return redirect("code", document.name);
    });
});

export default app;
