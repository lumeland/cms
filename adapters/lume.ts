import { PreviewWriter } from "./lume_writer.ts";
import binaryLoader from "lume/core/loaders/binary.ts";
import { getConfigFile } from "lume/core/utils/lume_config.ts";
import { getExtension } from "lume/core/utils/path.ts";
import { contentType } from "std/media_types/content_type.ts";
import { Hono } from "hono/mod.ts";
import cms from "../mod.ts";
import { dispatch } from "../src/utils/event.ts";

import type Site from "lume/core/site.ts";
import type { Context } from "hono/mod.ts";
import type Cms from "../src/cms.ts";

export interface Options {
  configFile?: string;
  basePath?: string;
  port?: number;
}

export const defaults: Options = {
  basePath: "/admin",
  port: 8000,
};

export default async function lume(userOptions: Options): Promise<Cms> {
  const options = {
    ...defaults,
    ...userOptions,
  };
  const { configFile, basePath } = options;
  const config = await getConfigFile(configFile);

  if (!config) {
    throw new Error(`Config file not found: ${configFile}`);
  }

  const mod = await import(config);
  const site = mod.default as Site;
  const preview = new PreviewWriter();

  site.writer = preview;
  site.options.location = new URL(`http://localhost:${options.port}/`);
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

  function getPreviewUrl(src: string): string | undefined {
    src = removePrefix(cwd, src);

    for (const [url, [source]] of preview.files) {
      if (source === src) {
        return url;
      }
    }
  }

  return cms({
    cwd,
    basePath,
    appWrapper(app) {
      const previewer = new Hono();
      previewer.route(basePath, app);
      previewer.get("*", serveSite(preview.files, basePath));
      return previewer;
    },
  });
}

function serveSite(files: PreviewWriter["files"], basePath: string) {
  return async (c: Context) => {
    const url = new URL(c.req.url);
    let path = decodeURIComponent(url.pathname);

    if (path === basePath + "/") {
      return c.redirect(basePath);
    }

    if (path.endsWith("/")) {
      path += "index.html";
    }

    const file = files.get(path);

    if (!file) {
      return c.notFound();
    }
    const [src, entry] = file;

    if (typeof entry === "string" || entry instanceof Uint8Array) {
      return createResponse(path, entry);
    }

    const content = (await entry.getContent(binaryLoader))
      .content as Uint8Array;
    files.set(path, [src, content]);
    return createResponse(path, content);
  };
}

function createResponse(
  path: string,
  content: Uint8Array | string,
): Response {
  const ext = getExtension(path);
  const type = contentType(ext);
  const headers = new Headers();

  if (type) {
    headers.set("content-type", type);
  }

  return new Response(content, {
    status: 200,
    headers,
  });
}

function removePrefix(prefix: string, path: string): string {
  if (path.startsWith(prefix)) {
    return path.slice(prefix.length);
  }

  return path;
}
