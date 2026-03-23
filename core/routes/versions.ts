import { getPath } from "../utils/path.ts";
import { Router } from "../../deps/galo.ts";

import type { RouterData } from "../cms.ts";
import {
  changeVersion,
  createVersion,
  deleteVersion,
  publishVersion,
  saveVersion,
  syncVersion,
  updateVersion,
} from "../usecases/versions.ts";

const app = new Router<RouterData>();

/**
 * Route for handling versioning actions.
 * It supports creating, changing, publishing, and deleting versions.
 */
app.post("/*", async ({ request, cms, user, next }) => {
  const { git, basePath } = cms;

  if (!git) {
    throw new Error("Git not enabled");
  }

  const body = await request.formData();
  const name = body.get("name") as string;

  function redirect(reload = true) {
    return new Response(null, {
      status: 302,
      headers: new Headers({
        "Location": getPath(basePath),
        "X-Lume-CMS": reload ? "reload" : "",
      }),
    });
  }

  return next()
    /* POST /versions/create */
    .post("/create", () => {
      createVersion(user, git, name);
      return redirect();
    })
    /* POST /versions/save */
    .post("/save", () => {
      saveVersion(user, git, name);
      return redirect(false);
    })
    /* POST /versions/change */
    .post("/change", () => {
      changeVersion(user, git, name);
      return redirect();
    })
    /* POST /versions/publish */
    .post("/publish", () => {
      publishVersion(user, git, name);
      return redirect();
    })
    /* POST /versions/delete */
    .post("/delete", () => {
      deleteVersion(user, git, name);
      return redirect();
    })
    /* POST /versions/update */
    .post("/update", () => {
      updateVersion(git, name);
      return redirect();
    })
    /* POST /versions/sync */
    .post("/sync", () => {
      syncVersion(user, git, name);
      return redirect();
    });
});

export default app;
