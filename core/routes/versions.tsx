import { getPath } from "../utils/path.ts";

import type { Context, Hono } from "../../deps/hono.ts";
import type { CMSContent } from "../../types.ts";

export default function (app: Hono) {
  app.post("/versions/create", async (c: Context) => {
    const { options, versioning } = get(c);

    if (!versioning) {
      throw new Error("No versioning method available");
    }

    const body = await c.req.parseBody();
    const name = body.name as string;
    await versioning.create(name);
    await versioning.change(name);

    return c.redirect(getPath(options));
  });

  app.post("/versions/change", async (c: Context) => {
    const { options, versioning } = get(c);

    if (!versioning) {
      throw new Error("No versioning method available");
    }

    const body = await c.req.parseBody();
    const name = body.name as string;
    await versioning.change(name);

    return c.redirect(getPath(options));
  });

  app.post("/versions/publish", async (c: Context) => {
    const { options, versioning } = get(c);

    if (!versioning) {
      throw new Error("No versioning method available");
    }

    const body = await c.req.parseBody();
    const name = body.name as string;
    await versioning.publish(name);

    return c.redirect(getPath(options));
  });

  app.post("/versions/delete", async (c: Context) => {
    const { options, versioning } = get(c);

    if (!versioning) {
      throw new Error("No versioning method available");
    }

    const body = await c.req.parseBody();
    const name = body.name as string;
    await versioning.delete(name);

    return c.redirect(getPath(options));
  });
}

function get(c: Context) {
  const options = c.get("options") as CMSContent;
  const { versioning } = options;

  return {
    options,
    versioning,
  };
}
