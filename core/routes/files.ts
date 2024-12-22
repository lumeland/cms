import uploadsList from "../templates/uploads/list.ts";
import uploadsView from "../templates/uploads/view.ts";
import uploadsCreate from "../templates/uploads/create.ts";
import { slugify } from "../utils/string.ts";
import { getPath, normalizeName, normalizePath } from "../utils/path.ts";

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
        folder: normalizeName(c.req.query("folder")),
      }),
    );
  }).post("/uploads/:upload/create", async (c: Context) => {
    const { options, uploads, uploadId } = get(c);
    const upload = uploads[uploadId];
    const body = await c.req.parseBody();
    const file = body.file as File;
    const fileId = normalizeName(slugify(file.name));

    if (!fileId) {
      throw new Error("Invalid file name");
    }

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
    const name = normalizeName(fileId);

    if (!name) {
      return c.notFound();
    }

    const entry = upload.get(name);
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
      const name = normalizeName(fileId);
      if (!name) {
        throw new Error("Invalid file name");
      }
      const entry = storage.get(name);
      const file = await entry.readFile();

      return c.render(
        uploadsView({
          options,
          type: file.type,
          size: file.size,
          collection: uploadId,
          publicPath: normalizePath(publicPath, name),
          file: name,
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
      const name = normalizeName(body._id as string);

      if (!name) {
        throw new Error("Invalid file name");
      }

      if (prevId !== name) {
        await upload.rename(prevId, name);
      }

      const file = body.file as File | undefined;

      if (file) {
        const entry = upload.get(name);
        await entry.writeFile(file);
      }

      return c.redirect(
        getPath(options.basePath, "uploads", uploadId, "file", name),
      );
    });

  app.post("/uploads/:upload/delete/:file", async (c: Context) => {
    const { options, fileId, uploadId, uploads } = get(c);
    const upload = uploads[uploadId];
    const name = normalizeName(fileId);

    if (!name) {
      throw new Error("Invalid file name");
    }

    await upload.delete(name);
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
