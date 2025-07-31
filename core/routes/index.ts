import { Router } from "../../deps/galo.ts";
import { getPath } from "../utils/path.ts";

import type { RouterData } from "../cms.ts";

const app = new Router<RouterData>();

app.get("/", async ({ request, cms, render, sourcePath, user }) => {
  const { collections, documents, uploads, site, basePath, versioning } = cms;
  const searchParams = new URL(request.url).searchParams;
  const edit = searchParams.get("edit");

  function redirect(...paths: string[]) {
    const path = getPath(basePath, ...paths);
    return Response.redirect(new URL(path, request.url));
  }

  // If the edit parameter is set, redirect to the edit page
  // for the specified document or collection
  if (edit) {
    const path = await sourcePath?.(edit);
    if (!path) {
      return new Response("Not found", { status: 404 });
    }

    for (const document of Object.values(cms.documents)) {
      if (document.src === path) {
        return redirect("document", document.name, "edit");
      }
    }

    for (const collection of Object.values(cms.collections)) {
      for await (const entry of collection) {
        if (entry.src === path) {
          return redirect("collection", collection.name, entry.name, "edit");
        }
      }
    }

    // If no document or collection matches, redirect to the home page
    return Response.redirect(new URL(basePath, request.url));
  }

  return render("home.vto", {
    site,
    collections,
    documents,
    uploads,
    user,
    versioning,
  });
});

export default app;
