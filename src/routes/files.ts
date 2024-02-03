import uploadsList from "./templates/uploads/list.ts";
import uploadsView from "./templates/uploads/view.ts";
import { slugify } from "../utils/string.ts";
import { getPath, normalizePath } from "../utils/path.ts";
import { dispatch } from "../utils/event.ts";

import type { Context, Hono } from "hono/mod.ts";
import type { CMSContent } from "../types.ts";

export default function (app: Hono) {
  app.get("/uploads/:collection", async (c: Context) => {
    const { uploads, versioning } = c.get("options") as CMSContent;
    const collectionId = c.req.param("collection");

    if (!uploads[collectionId]) {
      return c.notFound();
    }

    const [collection, publicPath] = uploads[collectionId];
    const files = await Array.fromAsync(collection);

    return c.render(
      uploadsList({
        collection: collectionId,
        files,
        publicPath,
        version: await versioning?.current(),
      }),
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
    dispatch("uploadedFile", { uploads: collectionId, file: fileId });
    return c.redirect(getPath("uploads", collectionId, "file", fileId));
  });

  app.get("/uploads/:collection/raw/:file", async (c: Context) => {
    const { uploads } = c.get("options") as CMSContent;
    const collectionId = c.req.param("collection");
    const fileId = c.req.param("file");

    if (!uploads[collectionId]) {
      return c.notFound();
    }

    const [collection] = uploads[collectionId];
    const entry = collection.get(fileId);

    const file = await entry.readFile();
    c.header("Content-Type", file.type);
    c.header("Content-Length", file.size.toString());
    return c.body(new Uint8Array(await file.arrayBuffer()));
  });

  app.get("/uploads/:collection/file/:file", async (c: Context) => {
    const { uploads, versioning } = c.get("options") as CMSContent;
    const collectionId = c.req.param("collection");
    const fileId = c.req.param("file");
    const [collection, publicPath] = uploads[collectionId];

    if (!uploads[collectionId]) {
      return c.notFound();
    }

    try {
      const entry = collection.get(fileId);
      const file = await entry.readFile();

      return c.render(
        uploadsView({
          type: file.type,
          size: file.size,
          collection: collectionId,
          publicPath: normalizePath(publicPath, fileId),
          file: fileId,
          version: await versioning?.current(),
        }),
      );
    } catch {
      return c.notFound();
    }
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
        dispatch("renamedFile", {
          uploads: collectionId,
          previousFile: prevId,
          file: fileId,
        });
      }

      const file = body.file as File | undefined;

      if (file) {
        const entry = collection.get(fileId);
        await entry.writeFile(file);
        dispatch("updatedFile", { uploads: collectionId, file: fileId });
      }

      return c.redirect(getPath("uploads", collectionId, "file", fileId));
    });

  app.post("/uploads/:collection/delete/:file", async (c: Context) => {
    const { uploads } = c.get("options") as CMSContent;
    const collectionId = c.req.param("collection");
    const fileId = c.req.param("file");
    const [collection] = uploads[collectionId];

    await collection.delete(fileId);
    dispatch("deletedFile", { uploads: collectionId, file: fileId });
    return c.redirect(getPath("uploads", collectionId));
  });
}
