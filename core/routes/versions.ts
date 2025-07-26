import { dispatch } from "../utils/event.ts";
import { getPath } from "../utils/path.ts";
import { Router } from "../../deps/galo.ts";

import type { RouterData } from "../cms.ts";

const app = new Router<RouterData>();

app.post("/", async ({ request, cms }) => {
  const { versioning, basePath } = cms;

  if (!versioning) {
    throw new Error("No versioning method available");
  }

  const body = await request.formData();
  const name = body.get("name") as string;
  const action = body.get("action") as string;

  const response = Response.redirect(
    new URL(getPath(basePath), request.url),
  );

  // Add a header to trigger a reload in the proxy
  response.headers.set("X-Lume-CMS", "reload");

  if (action === "create") {
    versioning.create(name);
    versioning.change(name);
    dispatch("versionCreated", { name });
    return response;
  }

  if (action === "change") {
    versioning.change(name);
    dispatch("versionChanged", { name });
    return response;
  }

  if (action === "publish") {
    versioning.publish(name);
    dispatch("versionPublished", { name });
    return response;
  }

  if (action === "delete") {
    versioning.delete(name);
    dispatch("versionDeleted", { name });
    return response;
  }

  return new Response("Invalid action", { status: 400 });
});

export default app;
