import { normalizePath } from "../src/utils/path.ts";
import type Cms from "../src/cms.ts";

export interface Options {
  cms: Cms;
  path?: string;
}

type RequestHandler = (req: Request) => Promise<Response>;
type Middleware = (
  req: Request,
  next: RequestHandler,
  info: Deno.ServeHandlerInfo,
) => Promise<Response>;

export default function middleware({ cms }: Options): Middleware {
  const app = cms.init();
  const basePath = normalizePath(cms.options.location.pathname);

  const pattern = new URLPattern({
    pathname: `${basePath}/*`,
  });

  return async (request, next): Promise<Response> => {
    const url = new URL(request.url);

    if (url.pathname === basePath) {
      url.pathname = `${basePath}/`;
    }

    if (!pattern.test(url)) {
      return next(request);
    }

    url.pathname = url.pathname.slice(basePath.length);

    return await app.fetch(new Request(url, request));
  };
}
