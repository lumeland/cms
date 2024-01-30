import { getPath } from "../utils/path.ts";

import type { Context, Hono } from "hono/mod.ts";
import type { CMSContent } from "../types.ts";

export default function (app: Hono) {
  app.post("/versions/create", async (c: Context) => {
    const { versioning } = c.get(
      "options",
    ) as CMSContent;

    if (!versioning) {
      throw new Error("No versioning method available");
    }

    const body = await c.req.parseBody();
    const name = body.name as string;
    await versioning.create(name);
    await versioning.change(name);

    return c.redirect(getPath());
  });

  app.post("/versions/change", async (c: Context) => {
    const { versioning } = c.get(
      "options",
    ) as CMSContent;

    if (!versioning) {
      throw new Error("No versioning method available");
    }

    const body = await c.req.parseBody();
    const name = body.name as string;
    await versioning.change(name);

    return c.redirect(getPath());
  });

  app.post("/versions/publish", async (c: Context) => {
    const { versioning } = c.get(
      "options",
    ) as CMSContent;

    if (!versioning) {
      throw new Error("No versioning method available");
    }

    const body = await c.req.parseBody();
    const name = body.name as string;
    await versioning.publish(name);

    return c.redirect(getPath());
  });
}
