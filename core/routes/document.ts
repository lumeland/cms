import { getPath } from "../utils/path.ts";
import { changesToData } from "../utils/data.ts";
import documentEdit from "../templates/document/edit.ts";

import type { Context, Hono } from "../../deps/hono.ts";
import type { CMSContent } from "../../types.ts";

export default function (app: Hono) {
  app
    .get("/document/:document", async (c: Context) => {
      const { options, document, versioning } = get(c);

      if (!document) {
        return c.notFound();
      }

      return c.render(
        documentEdit({
          options,
          document,
          version: await versioning?.current(),
        }),
      );
    })
    .post(async (c: Context) => {
      const { options, document } = get(c);
      const body = await c.req.parseBody();

      await document.write(changesToData(body));
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
