import FilesList from "./templates/files/list.tsx";
import FilesView from "./templates/files/view.tsx";
import { getUrl, slugify } from "../utils/string.ts";

import type { Context, Hono } from "hono/mod.ts";
import type { CMSContent } from "../types.ts";

export default function (app: Hono) {
  app.get("/files/:files", async (c: Context) => {
    const { files } = c.get("options") as CMSContent;
    const collectionId = c.req.param("files");
    const collection = files[collectionId];
    const media = await Array.fromAsync(collection) as string[];

    return c.render(
      <FilesList collection={collectionId} files={media} />,
    );
  });

  app.post("/files/:files/create", async (c: Context) => {
    const { files } = c.get("options") as CMSContent;
    const collectionId = c.req.param("files");
    const collection = files[collectionId];
    const body = await c.req.parseBody();
    const file = body.file as File;
    const fileId = slugify(file.name);
    const entry = collection.get(fileId);
    await entry.write(file);

    return c.redirect(getUrl("files", collectionId, "file", fileId));
  });

  app.get("/files/:files/raw/:file", async (c: Context) => {
    const { files } = c.get("options") as CMSContent;
    const collectionId = c.req.param("files");
    const fileId = c.req.param("file");
    const collection = files[collectionId];
    const entry = collection.get(fileId);

    const file = await entry.read();
    c.header("Content-Type", file.type);
    c.header("Content-Length", file.size.toString());
    return c.body(new Uint8Array(await file.arrayBuffer()));
  });

  app.get("/files/:files/file/:file", async (c: Context) => {
    const { files } = c.get("options") as CMSContent;
    const collectionId = c.req.param("files");
    const fileId = c.req.param("file");
    const collection = files[collectionId];
    const entry = collection.get(fileId);
    const file = await entry.read();

    return c.render(
      <FilesView
        type={file.type}
        size={file.size}
        collection={collectionId}
        file={fileId}
      />,
    );
  })
    .post(async (c: Context) => {
      const { files } = c.get("options") as CMSContent;
      const collectionId = c.req.param("files");
      const collection = files[collectionId];
      const body = await c.req.parseBody();
      const prevId = c.req.param("file");
      const fileId = body._id as string;

      if (prevId !== fileId) {
        await collection.rename(prevId, fileId);
      }

      const file = body.file as File | undefined;

      if (file) {
        const entry = collection.get(fileId);
        await entry.write(file);
      }

      return c.redirect(getUrl("files", collectionId, "file", fileId));
    });

  app.post("/files/:files/delete/:file", async (c: Context) => {
    const { files } = c.get("options") as CMSContent;
    const collectionId = c.req.param("files");
    const fileId = c.req.param("file");
    const collection = files[collectionId];
    await collection.delete(fileId);

    return c.redirect(getUrl("files", collectionId));
  });
}
