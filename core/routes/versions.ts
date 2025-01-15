import type { Context, Hono } from "../../deps/hono.ts";
import type { CMSContent } from "../../types.ts";
import { getPath } from "../utils/path.ts";

interface Data {
  name: string;
  action: string;
}

export default function (app: Hono) {
  app.post("/versions", async (c: Context) => {
    const options = c.get("options") as CMSContent;
    const { versioning, basePath } = options;

    if (!versioning) {
      throw new Error("No versioning method available");
    }

    const body = await c.req.parseBody() as unknown as Data;
    const { name, action } = body;

    const response = c.redirect(getPath(basePath));
    // Add a header to trigger a reload in the proxy
    response.headers.set("X-Lume-CMS", "reload");

    if (action === "create") {
      await versioning.create(name);
      await versioning.change(name);
      return response;
    }

    if (action === "change") {
      await versioning.change(name);
      return response;
    }

    if (action === "publish") {
      await versioning.publish(name);
      return response;
    }

    if (action === "delete") {
      await versioning.delete(name);
      return response;
    }
  });
}
