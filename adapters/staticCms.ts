import { Hono } from "../deps/hono.ts";
import authRoutes from "../core/routes/auth.ts";
import { asset, getPath } from "../core/utils/path.ts";

import type Cms from "../core/cms.ts";

export interface Options {
  cms: Cms;
  basePath?: string;
}

export const defaults: Omit<Options, "site" | "cms"> = {
  basePath: "/admin",
};

export default function lume(userOptions?: Options): Promise<Hono> {
  const options = {
    ...defaults,
    ...userOptions,
  } as Required<Options>;

  const { cms, basePath } = options;

  cms.options.basePath = basePath;

  // Unsure if this is necessary
  const data = {};
  cms.options.data = data;

  const app = cms.init();
  const server = new Hono({
    strict: false,
  });

  if (cms.options.auth) {
    authRoutes(server, cms.options.auth);
  }

  server.route(basePath, app);

  server.get("*", async (c, next) => {
    await next();

    const { res } = c;
    if (
      res.status === 200 &&
      res.headers.get("content-type")?.includes("text/html")
    ) {
      const body = await res.text();
      const code = `
          ${body}
          <script type="module" src="${asset("components/u-bar.js")}"></script>
          <u-bar data-api="${getPath("status")}"></u-bar>
        `;
      c.res = new Response(code, res);
      c.res.headers.delete("Content-Length");
    }
  });

  return server;
}
