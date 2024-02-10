import { basicAuth } from "../../deps/hono.ts";

import type { Hono } from "../../deps/hono.ts";
import type { AuthOptions } from "../cms.ts";

export default function (app: Hono, auth: AuthOptions) {
  if (auth.method === "basic") {
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
}
