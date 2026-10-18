// Code adapted from https://github.com/oscarotero/galo
import { serve } from "./services/net.ts";
import { serveFile } from "./utils/serve-file.ts";

/** Supported methods */
type Method = "GET" | "POST" | "PUT" | "DELETE" | "HEAD";

/** Router is a tupple with [handler, method?, path?] */
type RouteOrHandler = Handler<any> | Router<any>;

type Route = [
  RouteOrHandler,
  Method | undefined,
  string | string[] | undefined,
  ResponseHandler | undefined,
];

type StaticRoute = [
  (request: Request, file: string) => Promise<Response> | Response,
  string[],
];

/** Parameters passed to routes */
interface Params<T extends Data = Data> {
  _: string[];
  request: Request;
  next: <D>(params?: D) => Router<T & D>;
  [key: string]: any; // Allow additional parameters
}

interface Data {
  request?: Request;
  [key: string]: any; // Allow additional parameters
}

interface ParentConfig<D extends Data = Data> {
  params: D;
  defaultHandler?: HandlerOrRouter<any>;
  errorHandler?: Handler<any>;
}

/** Handler function type */
type Handler<D = Data, R = HandlerReturn> = (
  params: D & Params,
) => R | Promise<R>;

type HandlerReturn =
  | void
  | undefined
  | null
  | Response
  | string
  | object
  | Array<unknown>
  | Router
  | Uint8Array<ArrayBuffer>
  | ReadableStream
  | Blob
  | ArrayBuffer
  | URLSearchParams
  | FormData
  | DataView<ArrayBuffer>
  | File
  | AsyncGenerator<string | Uint8Array, void, unknown>;

type HandlerOrRouter<T extends Data, R = HandlerReturn> =
  | Handler<T, R>
  | Router<T>;

/** Response handler */
type ResponseHandler = (
  response: Response,
) => void | Response | Promise<Response | void>;

export default class Router<D extends Data = Data> {
  basePath: string[];
  routes: Route[] = [];
  staticRoutes: StaticRoute[] = [];
  params: D;
  defaultHandler?: HandlerOrRouter<any>;
  errorHandler?: Handler<any>;
  fetch: (request: Request) => Promise<Response>;

  constructor(params?: D, basePath?: string) {
    this.params = params || {} as D;
    this.basePath = basePath ? toParts(basePath) : [];
    this.fetch = (request: Request) =>
      this.#runRouter(request, toParts(new URL(request.url).pathname));
  }

  serve(port?: number, hostname?: string, signal?: AbortSignal): void {
    return serve({
      port,
      hostname,
      signal,
      handler: (request) => this.fetch(request),
    })
  }

  response(): Promise<Response> {
    const { request } = this.params;
    if (!request) {
      throw new Error("No request available in the router");
    }
    return this.fetch(request);
  }

  /** Add a handler for a path */
  path<T>(
    pattern: string,
    handler: HandlerOrRouter<T & D>,
    responseHandler?: ResponseHandler,
  ): this {
    return this.#add(handler, undefined, pattern, responseHandler);
  }

  /** Set a default handler for unmatched routes */
  default<T>(handler: HandlerOrRouter<T & D>): this {
    this.defaultHandler = handler;
    return this;
  }

  staticFiles(pattern: string, root: string): this {
    this.staticRoutes.push([
      async (request, path) => await serveFile(root, request, path),
      [...this.basePath, ...toParts(pattern)],
    ]);

    return this;
  }

  /** Set an error handler for the router */
  /** This handler will be called when an error occurs in any route */
  catch<T>(handler: Handler<T & D & { error: Error }>): this {
    this.errorHandler = handler;
    return this;
  }

  /** Add handlers for GET request */
  get<T>(
    handler: HandlerOrRouter<T & D>,
    responseHandler?: ResponseHandler,
  ): this;
  get<T>(
    pattern: string,
    handler: HandlerOrRouter<T & D>,
    responseHandler?: ResponseHandler,
  ): this;
  get<T>(
    patternOrHandler: string | HandlerOrRouter<T & D>,
    handler?: HandlerOrRouter<T & D>,
    responseHandler?: ResponseHandler,
  ): this {
    return this.#addMethod(
      "GET",
      patternOrHandler,
      handler,
      responseHandler,
    );
  }

  /** Add handlers for POST requests */
  post<T>(
    handler: HandlerOrRouter<T & D>,
    responseHandler?: ResponseHandler,
  ): this;
  post<T>(
    pattern: string,
    handler: HandlerOrRouter<T & D>,
    responseHandler?: ResponseHandler,
  ): this;
  post<T>(
    patternOrHandler: string | HandlerOrRouter<T & D>,
    handler?: HandlerOrRouter<T & D>,
    responseHandler?: ResponseHandler,
  ): this {
    return this.#addMethod(
      "POST",
      patternOrHandler,
      handler,
      responseHandler,
    );
  }

  /** Add handlers for PUT requests */
  put<T>(
    handler: HandlerOrRouter<T & D>,
    responseHandler?: ResponseHandler,
  ): this;
  put<T>(
    pattern: string,
    handler: HandlerOrRouter<T & D>,
    responseHandler?: ResponseHandler,
  ): this;
  put<T>(
    patternOrHandler: string | HandlerOrRouter<T & D>,
    handler?: HandlerOrRouter<T & D>,
    responseHandler?: ResponseHandler,
  ): this {
    return this.#addMethod(
      "PUT",
      patternOrHandler,
      handler,
      responseHandler,
    );
  }

  /** Add handlers for DELETE requests */
  delete<T>(
    handler: HandlerOrRouter<T & D>,
    responseHandler?: ResponseHandler,
  ): this;
  delete<T>(
    pattern: string,
    handler: HandlerOrRouter<T & D>,
    responseHandler?: ResponseHandler,
  ): this;
  delete<T>(
    patternOrHandler: string | HandlerOrRouter<T & D>,
    handler?: HandlerOrRouter<T & D>,
    responseHandler?: ResponseHandler,
  ): this {
    return this.#addMethod(
      "DELETE",
      patternOrHandler,
      handler,
      responseHandler,
    );
  }

  /** Add handlers for any method requests */
  #addMethod(
    method: Method,
    patternOrHandler: string | HandlerOrRouter<any, any>,
    handler?: HandlerOrRouter<any, any>,
    responseHandler?: ResponseHandler,
  ): this {
    if (
      typeof patternOrHandler === "function" ||
      patternOrHandler instanceof Router
    ) {
      return this.#add(
        patternOrHandler,
        method,
        undefined,
        responseHandler,
      );
    }
    if (typeof handler === "function" || handler instanceof Router) {
      return this.#add(
        handler,
        method,
        patternOrHandler,
        responseHandler,
      );
    }
    throw new Error("Handler must be a function or a Router instance");
  }

  #add(
    handler: RouteOrHandler,
    method?: Method,
    pattern?: string,
    responseHandler?: ResponseHandler,
  ): this {
    this.routes.push([
      handler,
      method,
      pattern,
      responseHandler,
    ]);

    return this;
  }

  async #runRouter(
    request: Request,
    parts: string[],
    parentConfig?: ParentConfig,
  ): Promise<Response> {
    const reqMethod = request.method as Method;

    // Check if it's a static file
    if ((reqMethod === "GET" || reqMethod === "HEAD") && parts.length) {
      for (const [handler, pattern] of this.staticRoutes) {
        const params = matches(pattern, parts);

        if (!params) {
          continue;
        }

        const response = await handler(request, params._.join("/"));

        if (response.status !== 404) {
          return response;
        }
      }
    }

    // Dynamic route
    const next = (params?: Record<string, unknown>) => {
      return new Router({
        ...this.params,
        ...parentConfig?.params,
        ...params,
        request,
      })
        .default(this.defaultHandler!)
        .catch(this.errorHandler!);
    };

    for (const route of this.routes) {
      const [handler, method, pattern, responseHandler] = route;

      if (method && reqMethod !== method) {
        continue;
      }
      const routeParts = typeof pattern === "string"
        ? [...this.basePath, ...toParts(pattern)]
        : pattern;
      route[2] = routeParts; // Update the route with the parts

      const params = routeParts ? matches(routeParts, parts) : { _: parts };

      if (!params) {
        continue;
      }

      const response = await this.#runHandler(
        handler,
        {
          ...this.params,
          ...parentConfig?.params,
          ...params,
          request,
          next,
        },
        this.errorHandler,
        parentConfig,
      );

      return responseHandler
        ? (await responseHandler(response)) ?? response
        : response;
    }

    const effectiveDefaultHandler = this.defaultHandler ??
      parentConfig?.defaultHandler;
    const effectiveErrorHandler = this.errorHandler ??
      parentConfig?.errorHandler;

    if (effectiveDefaultHandler) {
      return await this.#runHandler(
        effectiveDefaultHandler,
        {
          ...this.params,
          ...parentConfig?.params,
          _: parts,
          request,
          next,
        },
        effectiveErrorHandler,
        parentConfig,
      );
    }

    return new Response("Not Found", { status: 404 });
  }

  async #runHandler<D extends Data>(
    handler: HandlerOrRouter<D>,
    params: Params & D,
    errorHandler?: Handler,
    parentConfig?: ParentConfig,
  ): Promise<Response> {
    let handleReturn: HandlerReturn;
    try {
      if (handler instanceof Router) {
        handleReturn = await handler.#runRouter(
          params.request,
          params._,
          {
            params: {
              ...this.params,
              ...parentConfig?.params,
              ...params,
            },
            defaultHandler: this.defaultHandler ??
              parentConfig?.defaultHandler,
            errorHandler: this.errorHandler ??
              parentConfig?.errorHandler,
          },
        );
      } else {
        handleReturn = await handler(params);
      }
    } catch (err) {
      const error = toError(err);
      const effectiveErrorHandler = errorHandler ??
        parentConfig?.errorHandler;
      if (effectiveErrorHandler) {
        try {
          return await this.#runHandler(effectiveErrorHandler, {
            ...params,
            error,
          });
        } catch (err) {
          console.error(err);
          const error = toError(err);
          return new Response(error.toString(), { status: 500 });
        }
      }
      console.error(err);
      return new Response(error.toString(), { status: 500 });
    }

    // It's a string => return an HTML response
    if (typeof handleReturn === "string") {
      return new Response(handleReturn, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // It's a Response
    if (handleReturn instanceof Response) {
      return handleReturn;
    }

    // It's a nested Router
    if (handleReturn instanceof Router) {
      return handleReturn.#runRouter(params.request, params._, parentConfig);
    }

    // It's something that can be used as the body of a Response
    if (handleReturn === undefined) {
      return params.response || new Response();
    }

    // It's something that can be used as the body of a Response
    if (
      !handleReturn ||
      handleReturn instanceof Uint8Array ||
      handleReturn instanceof ReadableStream ||
      handleReturn instanceof Blob ||
      handleReturn instanceof ArrayBuffer ||
      handleReturn instanceof URLSearchParams ||
      handleReturn instanceof FormData ||
      handleReturn instanceof DataView
    ) {
      return new Response(handleReturn ?? undefined);
    }

    // It's a File
    if (handleReturn instanceof File) {
      return new Response(handleReturn.stream(), {
        status: 200,
        headers: {
          "Content-Type": handleReturn.type || "application/octet-stream",
          "Content-Length": handleReturn.size.toString(),
          "Content-Disposition": `attachment; filename="${handleReturn.name}"`,
        },
      });
    }

    // It's an object or array => return a JSON response
    if (typeof handleReturn === "object" || Array.isArray(handleReturn)) {
      return Response.json(handleReturn);
    }

    throw new Error(`Invalid handler return type, ${typeof handleReturn}`);
  }
}

/**
 * Convert a path to an array of directories
 * For example, "/foo/bar" becomes ["foo", "bar"]
 */
function toParts(pattern: string): string[] {
  return pattern.split("/")
    .filter((part) => part.length > 0)
    .map(decodeURIComponent);
}

/** Match a pattern with an array of directories */
function matches(pattern: string[], parts: string[]): Params | undefined {
  const captures: Record<string, string> = {};
  const hasWildcard = pattern[pattern.length - 1] === "*";

  if (hasWildcard) {
    pattern = pattern.slice(0, -1);

    if (pattern.length > parts.length) {
      return;
    }
  } else if (pattern.length !== parts.length) {
    return;
  }

  for (let i = 0; i < pattern.length; i++) {
    const part = pattern[i];
    const value = parts[i];

    if (part.startsWith(":")) {
      captures[part.slice(1)] = value;
    } else if (part !== value) {
      return;
    }
  }

  return {
    ...captures,
    _: parts.slice(pattern.length),
  } as Params;
}

function toError(err: unknown): Error {
  return err instanceof Error ? err : new Error(String(err));
}
