import { basicAuth } from "../../deps/hono.ts";

import type { Hono } from "../../deps/hono.ts";
import type { AuthOptions } from "../cms.ts";

export default function (app: Hono, auth?: AuthOptions) {
  if (auth?.method !== "basic") {
    return;
  }

  const users = Object.entries(auth.users).map(
    ([user, pass]) => ({
      username: user,
      password: pass,
    }),
  );

  const authMiddleware = basicAuth({
    ...users.shift()!,
  }, ...users);

  app.use(
    "*",
    (c, next) => {
      // Skip auth for socket because Safari doesn't keep the auth header
      if (c.req.url === "/_socket") {
        return next();
      }

      return authMiddleware(c, next);
    },
  );
}
