import { basicAuth } from "../../deps/hono.ts";

import type { Hono } from "../../deps/hono.ts";
import type { AuthOptions } from "../cms.ts";

export default function (
  app: Hono,
  auth?: AuthOptions,
  excludedPaths?: string[],
) {
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

  app.get("/logout", () => {
    return new Response("Logged out", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Secure Area"',
      },
    });
  });

  app.use(
    "*",
    (c, next) => {
      if (excludedPaths?.includes(c.req.path)) {
        return next();
      }

      return authMiddleware(c, next);
    },
  );
}
