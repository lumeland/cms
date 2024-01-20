import middleware from "./middleware.ts";
import type Cms from "../src/cms.ts";

export interface Options {
  cms: Cms;
  path?: string;
}

export default function ({ cms, path }: Options) {
  // deno-lint-ignore no-explicit-any
  return (site: any) => {
    const location = new URL(site.url(path ?? "/admin/", true));
    cms.options.location = location;
    const { server } = site.options;

    if (!server.middlewares) {
      server.middlewares = [];
    }

    server.middlewares.unshift(middleware({ cms }));
  };
}
