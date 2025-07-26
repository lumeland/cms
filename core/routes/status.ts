import { dispatch } from "../utils/event.ts";
import { getPath } from "../utils/path.ts";
import { Router } from "../../deps/galo.ts";

import type { RouterData } from "../cms.ts";

const app = new Router<RouterData>();

app.get("/", async ({ request, cms }) => {
  const { collections, documents, basePath, versioning } = cms;
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url") ?? "/";

  const result = dispatch<{ src?: string; url?: string }>(
    "editSource",
    { url },
  );

  if (!result || !result.src) {
    return {
      error: "No edit URL found",
    };
  }

  const response = {
    homeURL: getPath(basePath),
    version: versioning?.current(),
  };

  for (const document of Object.values(documents)) {
    if (document.src === result.src) {
      return {
        ...response,
        editURL: getPath(basePath, "document", document.name),
      };
    }
  }

  for (const collection of Object.values(collections)) {
    for await (const entry of collection) {
      if (entry.src === result.src) {
        return {
          ...response,
          editURL: getPath(
            basePath,
            "collection",
            collection.name,
            "edit",
            entry.name,
          ),
        };
      }
    }
  }

  return response;
});

export default app;
