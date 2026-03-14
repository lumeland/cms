import { getPath } from "../utils/path.ts";
import { Router } from "../../deps/galo.ts";

import type { RouterData } from "../cms.ts";
import {
  changeVersion,
  createVersion,
  deleteVersion,
  publishVersion,
} from "../usecases/versions.ts";

const app = new Router<RouterData>();

/**
 * Route for handling versioning actions.
 * It supports creating, changing, publishing, and deleting versions.
 *
 * /versions/create - Create a new version
 * /versions/change - Change the current version
 * /versions/publish - Publish the current version
 * /versions/delete - Delete a version
 */
app.post("/*", async ({ request, cms, next }) => {
  const { versioning, basePath } = cms;

  if (!versioning) {
    throw new Error("No versioning method available");
  }

  const body = await request.formData();
  const name = body.get("name") as string;

  const response = new Response(null, {
    status: 302,
    headers: new Headers({
      "Location": getPath(basePath),
      "X-Lume-CMS": "reload",
    }),
  });

  return next()
    /* POST /versions/create - Create a new version */
    .post("/create", () => {
      createVersion(versioning, name);
      return response;
    })
    /* POST /versions/change - Change the current version */
    .post("/change", () => {
      changeVersion(versioning, name);
      return response;
    })
    /* POST /versions/publish - Publish the current version */
    .post("/publish", () => {
      publishVersion(versioning, name);
      return response;
    })
    /* POST /versions/delete - Delete a version */
    .post("/delete", () => {
      deleteVersion(versioning, name);
      return response;
    });
});

export default app;
