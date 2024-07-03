import { basicAuth } from "../../deps/hono.ts";

import type { Hono } from "../../deps/hono.ts";
import type { AuthOptions } from "../cms.ts";

export default function (app: Hono, auth?: AuthOptions) {
  app.get("_socket_auth", (c) => {
    const auth = c.req.header("authorization") || "";
    const token = auth.split(" ").pop();
    const url = new URL(c.req.url);
    url.pathname = url.pathname.replace(/\/_socket_auth$/, "/_socket");
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";

    if (token) {
      const [user, pass] = atob(token).split(":");
      url.username = user;
      url.password = pass;
    }

    return c.json({ url: url.toString() });
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
