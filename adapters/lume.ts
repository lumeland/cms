import { Hono } from "hono/mod.ts";
import { serveStatic } from "hono/middleware.ts";
import cms from "../mod.ts";
import authRoutes from "../src/routes/auth.ts";
import { dispatch } from "../src/utils/event.ts";
import { asset, getPath } from "../src/utils/path.ts";

import type Site from "lume/core/site.ts";
import type Cms from "../src/cms.ts";
import type { AuthOptions, ServerOptions } from "../src/cms.ts";

export interface Options {
  site: Site;
  basePath?: string;
  server?: ServerOptions;
  auth?: AuthOptions;
}

export const defaults: Omit<Options, "site"> = {
  basePath: "/admin",
  server: {
    port: 8000,
  },
};

export default async function lume(userOptions?: Options): Promise<Cms> {
  const options = {
    ...defaults,
    ...userOptions,
    server: {
      ...defaults.server,
      ...userOptions?.server,
    },
  } as Required<Options>;

  const { site, basePath } = options;

  site.options.location = new URL(`http://localhost:${options.server.port}/`);
  await site.build();

  const cwd = site.src();

  addEventListener("cms:updatedDocument", async (e) => {
    // @ts-ignore: Detail declared in the event.
    const { document } = e.detail;
    const { src } = document;

    await site.update(new Set([removePrefix(cwd, src)]));

    dispatch("previewUpdated", {
      src,
      url: getPreviewUrl(src),
    });
  });

  addEventListener("cms:createdDocument", async (e) => {
    // @ts-ignore: Detail declared in the event.
    const { document } = e.detail;
    const { src } = document;

    await site.update(new Set([removePrefix(cwd, src)]));

    dispatch("previewUpdated", {
      src,
      url: getPreviewUrl(src),
    });
  });

  addEventListener("cms:previewUrl", (e) => {
    // @ts-ignore: Detail declared in the event.
    e.detail.url = getPreviewUrl(e.detail.src);
  });

  addEventListener("cms:editSource", (e) => {
    // @ts-ignore: Detail declared in the event.
    e.detail.src = getSourceFile(e.detail.url);
  });

  addEventListener("cms:changedVersion", () => {
    site.build();
  });

  addEventListener("cms:publishedVersion", () => {
    site.build();
  });

  function getPreviewUrl(src: string): string | undefined {
    for (const page of site.pages) {
      if (page.src.entry?.src === src) {
        return page.outputPath;
      }
    }
  }

  function getSourceFile(url: string): string | undefined {
    for (const page of site.pages) {
      if (page.data.url === url) {
        return page.src.entry?.src;
      }
    }
  }

  const app = cms({
    cwd,
    basePath,
    server: options.server,
    appWrapper(app) {
      const previewer = new Hono({
        strict: false,
      });

      if (options.auth) {
        authRoutes(previewer, options.auth);
      }

      previewer.route(basePath, app);

      // Add the edit bar
      previewer.get("*", async (c, next) => {
        await next();

        const { res } = c;
        if (
          res.status === 200 &&
          res.headers.get("content-type")?.includes("text/html")
        ) {
          const body = await res.text();
          const code = `
            ${body}
            <script type="module" src="${
            asset("components/u-edit.js")
          }"></script>
            <u-edit data-api="${getPath("edit")}"></u-edit>
          `;
          c.res = new Response(code, res);
          c.res.headers.delete("Content-Length");
        }
      });

      previewer.get(
        "*",
        serveStatic({
          root: removePrefix(cwd, site.dest()),
        }),
      );

      return previewer;
    },
  });

  app.storage("fs");

  return app;
}

function removePrefix(prefix: string, path: string): string {
  if (path.startsWith(prefix)) {
    return path.slice(prefix.length);
  }

  return path;
}
