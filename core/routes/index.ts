import { Router } from "../../deps/galo.ts";
import { getPath } from "../utils/path.ts";

import type { RouterData } from "../cms.ts";
import { getCollections } from "../usecases/collections.ts";
import { getDocuments } from "../usecases/documents.ts";
import { getUploads } from "../usecases/uploads.ts";

const app = new Router<RouterData>();

app.get("/", async ({ request, cms, render, sourcePath, user }) => {
  const { site, basePath } = cms;
  const searchParams = new URL(request.url).searchParams;
  const edit = searchParams.get("edit");

  function redirect(...paths: string[]) {
    return new Response(null, {
      status: 302,
      headers: new Headers({
        "Location": getPath(basePath, ...paths),
      }),
    });
  }

  const collections = getCollections(user, Object.values(cms.collections));
  const documents = getDocuments(user, Object.values(cms.documents));
  const uploads = getUploads(user, Object.values(cms.uploads));

  // If the edit parameter is set, redirect to the edit page
  // for the specified document or collection
  if (edit) {
    const path = await sourcePath?.(edit, cms);

    if (path) {
      for (const document of documents) {
        if (document.source.path === path) {
          return redirect("document", document.name, "edit");
        }
      }

      for (const collection of collections) {
        for await (const entry of collection) {
          if (entry.path === path) {
            return redirect("collection", collection.name, entry.name, "edit");
          }
        }
      }
    }

    // If no document or collection matches, redirect to the home page
    return redirect();
  }

  return render("home.vto", {
    site,
    collections,
    documents,
    uploads,
    user,
  });
});

export default app;
