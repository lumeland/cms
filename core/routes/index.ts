import index from "../templates/index.ts";
import notFound from "../templates/notfound.ts";
import { dispatch } from "../utils/event.ts";
import { getPath } from "../utils/path.ts";

import type { Context, Hono } from "../../deps/hono.ts";
import type { CMSContent } from "../../types.ts";

export default function (app: Hono) {
  app.get("/", (c: Context) => {
    const { options, collections, documents, uploads, versioning, site } = get(
      c,
    );

    return c.render(
      index({
        options,
        site,
        collections: collections,
        documents: documents,
        uploads: uploads,
        versioning,
      }),
    );
  });

  app.get("/status", async (c: Context) => {
    const { options, documents, collections, url, versioning } = get(c);
    const result = dispatch<{ src?: string; url?: string }>(
      "editSource",
      { url },
    );

    if (!result || !result.src) {
      return c.json({
        error: "No edit URL found",
      });
    }

    const response = {
      homeURL: getPath(options),
      version: await versioning?.current(),
    };

    for (const document of Object.values(documents)) {
      if (document.src === result.src) {
        return c.json({
          ...response,
          editURL: getPath(options, "document", document.name),
        });
      }
    }

    for (const collection of Object.values(collections)) {
      for await (const entry of collection) {
        if (entry.src === result.src) {
          return c.json({
            ...response,
            editURL: getPath(
              options,
              "collection",
              collection.name,
              "edit",
              entry.name,
            ),
          });
        }
      }
    }

    return c.json(response);
  });

  app.notFound((c: Context) => {
    const { options } = get(c);
    return c.render(notFound({ options }));
  });
}

function get(c: Context) {
  const options = c.get("options") as CMSContent;
  const { collections, documents, uploads, versioning, site } = options;
  const url = c.req.query("url") ?? "/";

  return {
    collections,
    documents,
    uploads,
    site,
    options,
    versioning,
    url,
  };
}
