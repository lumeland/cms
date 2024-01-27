import { PreviewWriter } from "lume/core/writer.ts";
import binaryLoader from "lume/core/loaders/binary.ts";
import { getExtension } from "lume/core/utils/path.ts";
import { contentType } from "std/media_types/content_type.ts";
import { Hono } from "hono/mod.ts";
import cms from "../mod.ts";

import type Site from "lume/core/site.ts";
import type { Context } from "hono/mod.ts";
import type Cms from "../src/cms.ts";

export interface Options {
  configFile: string;
  basePath?: string;
  port?: number;
}

export const defaults: Required<Omit<Options, "configFile">> = {
  basePath: "/admin",
  port: 8000,
};

export default async function lume(userOptions: Options): Promise<Cms> {
  const options = {
    ...defaults,
    ...userOptions,
  };
  const { configFile, basePath } = options;
  const mod = await import(configFile);
  const site = mod.default as Site;
  const preview = new PreviewWriter();

  site.writer = preview;
  site.options.location = new URL(`http://localhost:${options.port}/`);
  await site.build();

  addEventListener("cms:updatedDocument", (e) => {
    const { document } = e.detail;
    site.update(new Set([removePrefix(src, document.src)]));
  });

  const src = site.src();

  return cms({
    cwd: src,
    basePath,
    appWrapper(app) {
      const previewer = new Hono();
      previewer.route(basePath, app);
      previewer.get("*", serveSite(preview.files, basePath));
      return previewer;
    },
    previewUrl(path) {
      path = removePrefix(src, path);

      for (const [url, [source]] of preview.files) {
        if (source === path) {
          return url;
        }
      }
    },
  });
}

function serveSite(files: PreviewWriter["files"], basePath: string) {
  return async (c: Context) => {
    let path = new URL(c.req.url).pathname;
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
  const type = contentType(getExtension(path));
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
