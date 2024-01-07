import type { Context, Next } from "hono/mod.ts";
import { contentType } from "std/media_types/content_type.ts";
import { extname } from "std/path/extname.ts";

export type ServeStaticOptions = {
  root: URL | string;
};

export default function serveStatic(options: ServeStaticOptions) {
  return async (c: Context, next: Next) => {
    // Do nothing if Response is already set
    if (c.finalized) {
      await next();
      return;
    }

    const pathname = decodeURI(new URL(c.req.url).pathname);
    const url = new URL(pathname.slice(1), options.root);

    // Do nothing if pathname is not a real file (with extension)
    if (extname(pathname) === "") {
      await next();
      return;
    }

    try {
      const response = await fetch(url);

      if (response.ok) {
        c.header("Content-Type", contentType(extname(pathname)));
        return c.body(response.body);
      }
    } catch (e) {
      console.warn(`Static file: ${pathname} is not found`);
      console.warn({ url: url.href, e });
    }

    await next();
  };
}
