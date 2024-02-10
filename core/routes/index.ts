import index from "../templates/index.ts";
import notFound from "../templates/notfound.ts";
import { dispatch } from "../utils/event.ts";
import { getPath } from "../utils/path.ts";

import type { Context, Hono } from "../../deps/hono.ts";
import type { CMSContent } from "../../types.ts";

export default function (app: Hono) {
  app.get("/", (c: Context) => {
    const { collections, documents, uploads, versioning, site } = c.get(
      "options",
    ) as CMSContent;

    return c.render(
      index({
        site,
        collections: Object.keys(collections),
        documents: Object.keys(documents),
        uploads: Object.keys(uploads),
        versioning,
      }),
    );
  });

  app.get("/edit", async (c: Context) => {
    const url = c.req.query("url") ?? "/";
    const result = dispatch<{ src?: string; url?: string }>(
      "editSource",
      { url },
    );

    if (!result || !result.src) {
      return c.json({
        error: "No edit URL found",
      });
    }

    const { documents, collections } = c.get("options") as CMSContent;

    for (const document of Object.values(documents)) {
      if (document.src === result.src) {
        return c.json({
          edit: getPath("document", document.name),
        });
      }
    }

    for (const collection of Object.values(collections)) {
      for await (const entry of collection) {
        if (entry.src === result.src) {
          return c.json({
            edit: getPath("collection", collection.name, "edit", entry.name),
          });
        }
      }
    }

    return c.json({
      error: "No edit URL found",
    });
  });

  app.notFound((c: Context) => {
    return c.render(notFound());
  });
}
