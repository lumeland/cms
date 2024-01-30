import index from "./templates/index.ts";

import type { Context, Hono } from "hono/mod.ts";
import type { CMSContent } from "../types.ts";

export default function (app: Hono) {
  app.get("/", (c: Context) => {
    const { collections, documents, uploads, versioning } = c.get(
      "options",
    ) as CMSContent;

    return c.render(
      index({
        collections: Object.keys(collections),
        documents: Object.keys(documents),
        uploads: Object.keys(uploads),
        versioning,
      }),
    );
  });
}
