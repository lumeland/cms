import { getPath } from "../utils/path.ts";
import { changesToData, getViews, prepareField } from "../utils/data.ts";
import { render } from "../../deps/vento.ts";

import type { Context, Hono } from "../../deps/hono.ts";
import type { CMSContent } from "../../types.ts";

export default function (app: Hono) {
  app
    .get("/document/:document", async (c: Context) => {
      const { options, document, versioning } = get(c);

      if (!document) {
        return c.notFound();
      }

      const data = await document.read(true);
      const fields = await Promise.all(
        document.fields.map((field) => prepareField(field, options, data)),
      );

      const documentViews = document.views;
      const initViews = typeof documentViews === "function"
        ? documentViews() || []
        : documentViews || [];

      const views = new Set();
      document.fields.forEach((field) => getViews(field, views));

      return c.render(
        render("document/edit.vto", {
          options,
          document,
          fields,
          views: Array.from(views),
          initViews,
          data,
          version: versioning?.current(),
        }),
      );
    })
    .post(async (c: Context) => {
      const { options, document } = get(c);
      const body = await c.req.parseBody();

      await document.write(changesToData(body), options, true);
      return c.redirect(getPath(options.basePath, "document", document.name));
    });
}

function get(c: Context) {
  const options = c.get("options") as CMSContent;
  const { documents, versioning } = options;
  const documentName = c.req.param("document");
  const document = documents[documentName];

  return {
    document,
    options,
    versioning,
  };
}
