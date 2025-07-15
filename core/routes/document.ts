import { getLanguageCode, getPath } from "../utils/path.ts";
import { changesToData, getViews, prepareField } from "../utils/data.ts";
import { render } from "../../deps/vento.ts";

import type { Context, Hono } from "../../deps/hono.ts";
import type { CMSContent, Data } from "../../types.ts";

export default function (app: Hono) {
  app
    .get("/document/:document", async (c: Context) => {
      const { options, document, versioning } = get(c);

      if (!document) {
        return c.notFound();
      }

      let data: Data;

      try {
        data = await document.read(true);
      } catch (error) {
        return c.render(
          await render("document/edit-error.vto", {
            error: (error as Error).message,
            document,
          }),
        );
      }

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

  app
    .get("/document/code/:document", async (c: Context) => {
      const { document, versioning } = get(c);

      if (!document) {
        return c.notFound();
      }

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

      try {
        return c.render(
          await render("document/code.vto", {
            fields,
            data,
            document,
            version: versioning?.current(),
          }),
        );
      } catch (e) {
        console.error(e);
        return c.notFound();
      }
    })
    .post(async (c: Context) => {
      const { options, document } = get(c);

      const body = await c.req.parseBody();
      const code = body["changes.code"] as string | undefined;
      document.writeText(code ?? "");

      return c.redirect(
        getPath(options.basePath, "document", "code", document.name),
      );
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
