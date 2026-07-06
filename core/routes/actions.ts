import { getPath } from "../utils/path.ts";
import { Router } from "../../deps/galo.ts";

import type { RouterData } from "../cms.ts";

const app = new Router<RouterData>();

/**
 * Route for handling actions.
 */
app.post("/:name", async ({ name, cms }) => {
  const { actions, basePath } = cms;
  const action = actions[name];

  if (!action) {
    return new Response("Not found", { status: 404 });
  }

  const result = await action.run();

  if (result) {
    return result;
  }

  return new Response(null, {
    status: 302,
    headers: new Headers({
      "Location": getPath(basePath),
    }),
  });
});

export default app;
