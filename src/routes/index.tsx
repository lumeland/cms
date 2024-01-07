import Index from "./templates/index.tsx";
import Split from "./templates/split.tsx";

import type { Context, Hono } from "hono/mod.ts";
import type { CMSContent } from "../types.ts";

export default function (app: Hono) {
  app.get("/", (c: Context) => {
    const { collections, documents, files } = c.get(
      "options",
    ) as CMSContent;

    return c.render(
      <Index
        collections={Object.keys(collections)}
        documents={Object.keys(documents)}
        files={Object.keys(files)}
      />,
    );
  });

  app.get("/split", (c: Context) => {
    return c.html(<Split src="http://localhost:3000" />);
  });
}
