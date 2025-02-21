import { type Context, Hono, Next, serveStatic } from "../deps/hono.ts";
import authRoutes from "../core/routes/auth.ts";
import { dispatch } from "../core/utils/event.ts";
import { asset, getPath } from "../core/utils/path.ts";
import { Git, Options as GitOptions } from "../core/git.ts";
import { relative } from "../deps/std.ts";
import type Cms from "../core/cms.ts";

export interface Options {
  // deno-lint-ignore no-explicit-any
  site: any;
  cms: Cms;
  basePath?: string;
}

export const defaults: Omit<Options, "site" | "cms"> = {
  basePath: "/admin",
};

export default async function lume(
  userOptions?: Options,
): Promise<Hono> {
  const options = {
    ...defaults,
    ...userOptions,
  } as Required<Options>;

  const { site, cms, basePath } = options;

  // Enable drafts previews in the CMS
  Deno.env.set("LUME_DRAFTS", "true");

  const git = Deno.env.get("LUMECMS_GIT");

  if (git) {
    const gitOption = JSON.parse(git) as GitOptions;

    cms.versionManager = new Git({
      root: cms.options.root,
      ...gitOption,
    });
  }

  await site.build();

  // Start the watcher
  const watcher = site.getWatcher();

  // deno-lint-ignore no-explicit-any
  watcher.addEventListener("change", async (event: any) => {
    const files = event.files!;
    await site.update(files);
    dispatch("previewUpdated");
  });

  watcher.start();

  if (!cms.options.site?.url) {
    cms.options.site!.url = site.url("/", true);
  }
  cms.storage("src");
  cms.options.basePath = basePath;
  cms.options.root = site.src();
  const data = cms.options.data ?? {};
  data.site = site;
  cms.options.data = data;

  addEventListener("cms:previewUrl", (e) => {
    // @ts-ignore: Detail declared in the event.
    e.detail.url = getPreviewUrl(e.detail.src);
  });

  addEventListener("cms:editSource", (e) => {
    // @ts-ignore: Detail declared in the event.
    e.detail.src = getSourceFile(e.detail.url);
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
  previewer.get("*", async (c: Context, next: Next) => {
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
        asset(basePath, "components/u-bar.js")
      }"></script>
          <u-bar data-api="${getPath(basePath, "status")}"></u-bar>
        `;
      c.res = new Response(code, res);
      c.res.headers.delete("Content-Length");
    }
  });

  const root = relative(Deno.cwd(), site.dest());

  previewer.get(
    "*",
    serveStatic({ root }),
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
