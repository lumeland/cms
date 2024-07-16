import { basicAuth } from "../../deps/hono.ts";

import type { Hono } from "../../deps/hono.ts";
import type { AuthOptions } from "../cms.ts";

export default function (app: Hono, auth?: AuthOptions) {
  app.get("_socket_auth", (c) => {
    const header = c.req.header("authorization") || "";
    const token = header.split(" ").pop();
    const auth = token ? atob(token) : "";

    return c.json({ auth });
  });

  if (auth?.method !== "basic") {
    return;
  }

  const users = Object.entries(auth.users).map(
    ([user, pass]) => ({
      username: user,
      password: pass,
    }),
  );

  app.use(
    "*",
    basicAuth({
      ...users.shift()!,
    }, ...users),
  );
}
