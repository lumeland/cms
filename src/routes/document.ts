import { getPath } from "../utils/path.ts";
import { changesToData } from "../utils/data.ts";
import { dispatch } from "../utils/event.ts";
import documentEdit from "./templates/document/edit.ts";

import type { Context, Hono } from "hono/mod.ts";
import type { CMSContent } from "../types.ts";

export default function (app: Hono) {
  app
    .get("/document/:document", async (c: Context) => {
      const { document, versioning } = get(c);

      if (!document) {
        return c.notFound();
      }

      return c.render(
        documentEdit({
          document,
          version: await versioning?.current(),
        }),
      );
    })
    .post(async (c: Context) => {
      const { document } = get(c);
      const body = await c.req.parseBody();

      await document.write(changesToData(body));
      dispatch("updatedDocument", { document });
      return c.redirect(getPath("document", document.name));
    });
}

function get(c: Context) {
  const { documents, versioning } = c.get("options") as CMSContent;
  const documentName = c.req.param("document");
  const document = documents[documentName];

  return {
    document,
    versioning,
  };
}
