import uploadsList from "../templates/uploads/list.ts";
import uploadsView from "../templates/uploads/view.ts";
import uploadsCreate from "../templates/uploads/create.ts";
import { slugify } from "../utils/string.ts";
import { getPath, normalizePath } from "../utils/path.ts";

import type { Context, Hono } from "../../deps/hono.ts";
import type { CMSContent } from "../../types.ts";

export default function (app: Hono) {
  app.get("/uploads/:upload", async (c: Context) => {
    const { options, uploads, uploadId, versioning } = get(c);

    if (!uploads[uploadId]) {
      return c.notFound();
    }

    const upload = uploads[uploadId];

    return c.render(
      uploadsList({
        options,
        upload,
        version: await versioning?.current(),
      }),
    );
  });

  app.get("/uploads/:upload/create", async (c: Context) => {
    const { options, uploadId, versioning } = get(c);

    return c.render(
      uploadsCreate({
        options,
        collection: uploadId,
        version: await versioning?.current(),
        folder: c.req.query("folder"),
      }),
    );
  }).post("/uploads/:upload/create", async (c: Context) => {
    const { options, uploads, uploadId } = get(c);
    const upload = uploads[uploadId];
    const body = await c.req.parseBody();
    const file = body.file as File;
    const fileId = slugify(file.name);
    const entry = upload.get(fileId);

    await entry.writeFile(file);
    return c.redirect(
      getPath(options.basePath, "uploads", uploadId, "file", fileId),
    );
  });

  app.get("/uploads/:upload/raw/:file", async (c: Context) => {
    const { uploads, uploadId, fileId } = get(c);

    if (!uploads[uploadId]) {
      return c.notFound();
    }

    const upload = uploads[uploadId];
    const entry = upload.get(fileId);

    const file = await entry.readFile();
    c.header("Content-Type", file.type);
    c.header("Content-Length", file.size.toString());
    return c.body(new Uint8Array(await file.arrayBuffer()));
  });

  app.get("/uploads/:upload/file/:file", async (c: Context) => {
    const { options, uploadId, fileId, uploads, versioning } = get(c);
    const { storage, publicPath } = uploads[uploadId];

    if (!uploads[uploadId]) {
      return c.notFound();
    }

    try {
      const entry = storage.get(fileId);
      const file = await entry.readFile();

      return c.render(
        uploadsView({
          options,
          type: file.type,
          size: file.size,
          collection: uploadId,
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
      const { options, uploadId, uploads } = get(c);
      const upload = uploads[uploadId];
      const body = await c.req.parseBody();
      const prevId = c.req.param("file");
      const fileId = body._id as string;

      if (prevId !== fileId) {
        await upload.rename(prevId, fileId);
      }

      const file = body.file as File | undefined;

      if (file) {
        const entry = upload.get(fileId);
        await entry.writeFile(file);
      }

      return c.redirect(
        getPath(options.basePath, "uploads", uploadId, "file", fileId),
      );
    });

  app.post("/uploads/:upload/delete/:file", async (c: Context) => {
    const { options, fileId, uploadId, uploads } = get(c);
    const upload = uploads[uploadId];

    await upload.delete(fileId);
    return c.redirect(getPath(options.basePath, "uploads", uploadId));
  });
}

function get(c: Context) {
  const options = c.get("options") as CMSContent;
  const { uploads, versioning } = options;
  const uploadId = c.req.param("upload");
  const fileId = c.req.param("file");

  return {
    fileId,
    options,
    uploadId,
    uploads,
    versioning,
  };
}
