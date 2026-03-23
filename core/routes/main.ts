import { Router } from "../../deps/galo.ts";
import User from "../user.ts";
import { getCurrentVersion } from "../utils/env.ts";
import { asset, getPath, normalizePath } from "../utils/path.ts";
import { acceptsLanguages, fromFileUrl } from "../../deps/std.ts";
import { filter, render } from "../../deps/vento.ts";
import { setLocale, t } from "../../static/common/locale.js";
import documentRoute from "./document.ts";
import collectionRoute from "./collection.ts";
import versionsRoute from "./versions.ts";
import indexRoute from "./index.ts";
import uploadsRoute from "./uploads.ts";

import type { AuthOptions, SourcePath } from "../cms.ts";
import type { CMSContent } from "../../types.ts";

export interface RouterData {
  cms: CMSContent;
  lang: "en";
  render: (file: string, data?: Record<string, unknown>) => Promise<string>;
  sourcePath?: SourcePath;
  user: User;
}

interface InitOptions {
  content: CMSContent;
  basePath: string;
  jsImports: string[];
  auth?: AuthOptions;
  extraHead?: string;
  staticFolders?: Record<string, string>;
  sourcePath?: SourcePath;
}

export default function init(options: InitOptions): Router<RouterData> {
  filter("path", (args: string[]) => getPath(options.basePath, ...args));
  filter("asset", (url: string) => asset(options.basePath, url));

  const app = new Router({
    cms: options.content,
    sourcePath: options.sourcePath,
  }, options.basePath);

  app.get("/logout", () =>
    new Response("Unauthorized", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Secure Area"',
      },
    }))
    .path("/*", async ({ request, next, _ }) => {
      const user = new User();

      // Basic authentication
      if (options.auth && _.join("/") !== "logout") {
        const authorization = request.headers.get("authorization");
        if (!user.authenticate(options.auth.users, authorization)) {
          return new Response("Unauthorized", {
            status: 401,
            headers: {
              "WWW-Authenticate": 'Basic realm="Secure Area"',
            },
          });
        }
      }

      // Detect the language
      const lang = user.language ?? acceptsLanguages(request, "en") ?? "en";
      await setLocale(lang);

      // Template renderer
      const renderTemplate = (file: string, data?: Record<string, unknown>) =>
        render(file, {
          ...data,
          t,
          lang,
          jsImports: options.jsImports,
          extraHead: options.extraHead,
          cmsVersion: getCurrentVersion(),
          git: options.content.git,
        });

      return next({ user, lang, render: renderTemplate })
        .path("/", indexRoute)
        .path("/document/*", documentRoute)
        .path("/collection/*", collectionRoute)
        .path("/uploads/*", uploadsRoute)
        .path("/versions/*", versionsRoute)
        .get("/logout", () =>
          new Response("Logged out", {
            status: 401,
            headers: {
              "WWW-Authenticate": 'Basic realm="Secure Area"',
            },
          }));
    });

  // Serve static files from local directory
  const root = import.meta.resolve("../../static/");

  if (root.startsWith("file:")) {
    app.staticFiles("/*", fromFileUrl(root));
  }

  const { staticFolders } = options;

  if (staticFolders) {
    for (const [prefix, path] of Object.entries(staticFolders)) {
      const folder = normalizePath(prefix, "*");
      if (path.startsWith("file:")) {
        app.staticFiles(folder, fromFileUrl(path));
      } else {
        app.staticFiles(folder, path);
      }
    }
  }

  return app as Router<RouterData>;
}
