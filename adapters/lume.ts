import { Hono, serveStatic } from "../deps/hono.ts";
import authRoutes from "../src/routes/auth.ts";
import { dispatch } from "../src/utils/event.ts";
import { asset, getPath } from "../src/utils/path.ts";

import type Cms from "../src/cms.ts";

export interface Options {
  // deno-lint-ignore no-explicit-any
  site: any;
  cms: Cms;
  basePath?: string;
}

export const defaults: Omit<Options, "site" | "cms"> = {
  basePath: "/admin",
};

export default async function lume(userOptions?: Options): Promise<Hono> {
  const options = {
    ...defaults,
    ...userOptions,
  } as Required<Options>;

  const { site, cms, basePath } = options;

  await site.build();
  cms.options.site!.url = site.url("/", true);
  cms.storage("src");
  cms.options.basePath = basePath;
  const cwd = cms.options.root = site.src();

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

  const app = cms.init();
  const previewer = new Hono({
    strict: false,
  });

  if (cms.options.auth) {
    authRoutes(previewer, cms.options.auth);
  }

  previewer.route(basePath, app);

  // Add the edit button
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
          <script type="module" src="${asset("components/u-edit.js")}"></script>
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

  previewer.notFound(() => {
    const notFoundUrl = site.options.server?.page404;
    // deno-lint-ignore no-explicit-any
    const page = site.pages.find((p: any) =>
      p.data.url === notFoundUrl || p.outputPath === notFoundUrl
    );

    return new Response(page?.content ?? "Not found", {
      status: 404,
      headers: {
        "Content-Type": "text/html",
      },
    });
  });

  return previewer;
}

function removePrefix(prefix: string, path: string): string {
  if (path.startsWith(prefix)) {
    return path.slice(prefix.length);
  }

  return path;
}
