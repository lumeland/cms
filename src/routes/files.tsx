import UploadsList from "./templates/uploads/list.tsx";
import UploadsView from "./templates/uploads/view.tsx";
import { getUrl, slugify } from "../utils/string.ts";
import { normalizePath } from "../utils/path.ts";

import type { Context, Hono } from "hono/mod.ts";
import type { CMSContent } from "../types.ts";

export default function (app: Hono) {
  app.get("/uploads/:collection", async (c: Context) => {
    const { uploads } = c.get("options") as CMSContent;
    const collectionId = c.req.param("collection");
    const [collection, publicPath] = uploads[collectionId];
    const media = await Array.fromAsync(collection) as string[];

    return c.render(
      <UploadsList
        collection={collectionId}
        files={media}
        publicPath={publicPath}
      />,
    );
  });

  app.post("/uploads/:collection/create", async (c: Context) => {
    const { uploads } = c.get("options") as CMSContent;
    const collectionId = c.req.param("collection");
    const [collection] = uploads[collectionId];
    const body = await c.req.parseBody();
    const file = body.file as File;
    const fileId = slugify(file.name);
    const entry = collection.get(fileId);
    await entry.writeFile(file);

    return c.redirect(getUrl("uploads", collectionId, "file", fileId));
  });

  app.get("/uploads/:collection/raw/:file", async (c: Context) => {
    const { uploads } = c.get("options") as CMSContent;
    const collectionId = c.req.param("collection");
    const fileId = c.req.param("file");
    const [collection] = uploads[collectionId];
    const entry = collection.get(fileId);

    const file = await entry.readFile();
    c.header("Content-Type", file.type);
    c.header("Content-Length", file.size.toString());
    return c.body(new Uint8Array(await file.arrayBuffer()));
  });

  app.get("/uploads/:collection/file/:file", async (c: Context) => {
    const { uploads } = c.get("options") as CMSContent;
    const collectionId = c.req.param("collection");
    const fileId = c.req.param("file");
    const [collection, publicPath] = uploads[collectionId];
    const entry = collection.get(fileId);
    const file = await entry.readFile();

    return c.render(
      <UploadsView
        type={file.type}
        size={file.size}
        collection={collectionId}
        publicPath={normalizePath(publicPath, fileId)}
        file={fileId}
      />,
    );
  })
    .post(async (c: Context) => {
      const { uploads } = c.get("options") as CMSContent;
      const collectionId = c.req.param("collection");
      const [collection] = uploads[collectionId];
      const body = await c.req.parseBody();
      const prevId = c.req.param("file");
      const fileId = body._id as string;

      if (prevId !== fileId) {
        await collection.rename(prevId, fileId);
      }

      const file = body.file as File | undefined;

      if (file) {
        const entry = collection.get(fileId);
        await entry.writeFile(file);
      }

      return c.redirect(getUrl("uploads", collectionId, "file", fileId));
    });

  app.post("/uploads/:collection/delete/:file", async (c: Context) => {
    const { uploads } = c.get("options") as CMSContent;
    const collectionId = c.req.param("collection");
    const fileId = c.req.param("file");
    const [collection] = uploads[collectionId];
    await collection.delete(fileId);

    return c.redirect(getUrl("uploads", collectionId));
  });
}
