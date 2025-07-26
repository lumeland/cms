import type { AuthOptions } from "../cms.ts";
import type { Middleware } from "../../deps/galo.ts";

export default function (
  auth: AuthOptions,
  excludedPaths: string[],
): Middleware {
  const { users, method } = auth;

  if (auth.method !== "basic") {
    throw new Error(
      `Unsupported authentication method: ${method}. Only 'basic' is supported.`,
    );
  }

  return async (request: Request, next) => {
    const { pathname } = new URL(request.url);

    if (excludedPaths.includes(pathname)) {
      return await next(request);
    }

    const authorization = request.headers.get("authorization");
    if (authorization && checkAuthorization(authorization, users)) {
      return await next(request);
    }

    return new Response("Unauthorized", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Secure Area"',
      },
    });
  };
}

function checkAuthorization(
  authorization: string,
  users: Record<string, string>,
): boolean {
  const match = authorization.match(/^Basic\s+(.*)$/);
  if (match) {
    const [user, pw] = atob(match[1]).split(":");
    for (const [u, p] of Object.entries(users)) {
      if (user === u && pw == p) {
        return true;
      }
    }
  }

  return false;
}
