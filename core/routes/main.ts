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

import type { SourcePath } from "../cms.ts";
import type {
  AuthProvider,
  CMSContent,
  UserConfiguration,
} from "../../types.ts";

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
  extraHead?: string;
  staticFolders?: Record<string, string>;
  sourcePath?: SourcePath;
  users: Map<string, UserConfiguration>;
  authMethod?: AuthProvider;
}

export default function init(options: InitOptions): Router<RouterData> {
  filter("path", (args: string[]) => getPath(options.basePath, ...args));
  filter("asset", (url: string) => asset(options.basePath, url));

  const app = new Router({
    cms: options.content,
    sourcePath: options.sourcePath,
  }, options.basePath);

  app
    .path("/auth/*", ({ next }) => {
      const { authMethod } = options;
      if (!authMethod) {
        return new Response("Not found", { status: 404 });
      }
      return next()
        .post("/logout", ({ request }) => authMethod.logout(request))
        .default(({ request }) => authMethod.fetch(request));
    })
    .path("/*", async ({ request, next }) => {
      let user: User;

      // Authentication
      if (options.authMethod && options.users.size) {
        const result = await options.authMethod.login(request);
        if (result instanceof Response) {
          return result;
        } else {
          const config = options.users.get(result);
          if (!config) {
            throw new Error("AuthProvider resolved with an invalid user.");
          }
          user = new User(result, config);
        }
      } else {
        user = new User(); // anonymous user
      }

      // Detect the language
      const langs = ["en", "gl", "es"]
      const lang = user.language ?? acceptsLanguages(request, ...langs) ?? langs[0];
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
        .catch((params) => {
          return renderTemplate("error.vto", {
            t,
            user,
            errorType: "stack",
            error: params.error?.stack || '?',
          });
        });
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
