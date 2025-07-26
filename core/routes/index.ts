import { Router } from "../../deps/galo.ts";

import type { RouterData } from "../cms.ts";

const app = new Router<RouterData>();

app.get("/", ({ cms, render }) => {
  const { collections, documents, uploads, site } = cms;

  return render("home.vto", {
    site,
    collections,
    documents,
    uploads,
  });
});

export default app;
