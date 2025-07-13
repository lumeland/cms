import { slugify } from "../utils/string.ts";
import { getPath, normalizeName } from "../utils/path.ts";
import { render } from "../../deps/vento.ts";
import {
  formatSupported,
  MagickGeometry,
  transform,
} from "../../deps/imagick.ts";
import { posix } from "../../deps/std.ts";
import createTree from "../templates/tree.ts";

import type { Context, Hono } from "../../deps/hono.ts";
import type { CMSContent } from "../../types.ts";

export default function (app: Hono) {
  app.get("/uploads/:upload", async (c: Context) => {
    const { uploads, uploadId, versioning } = get(c);

    const upload = uploads[uploadId];

    if (!upload) {
      return c.notFound();
    }

    const files = await Array.fromAsync(upload);
    const tree = createTree(files);

    return c.render(
      render("uploads/list.vto", {
        upload,
        tree,
        version: versioning?.current(),
      }),
    );
  });

  app.get("/uploads/:upload/create", (c: Context) => {
    const { uploads, uploadId, versioning } = get(c);

    const upload = uploads[uploadId];

    if (!upload) {
      return c.notFound();
    }

    return c.render(
      render("uploads/create.vto", {
        upload,
        version: versioning?.current(),
        folder: normalizeName(c.req.query("folder")),
      }),
    );
  }).post("/uploads/:upload/create", async (c: Context) => {
    const { options, uploads, uploadId } = get(c);
    const upload = uploads[uploadId];

    if (!upload) {
      return c.notFound();
    }

    const body = await c.req.parseBody();
    const files = body["file[]"] as unknown as File[];
    const filesArray = Array.isArray(files) ? files : [files];
    for (const file of filesArray) {
      let fileId = file.name as string | undefined;
      const folder = body._id as string | undefined;

      if (folder) {
        fileId = folder.endsWith("/") ? posix.join(folder, fileId!) : folder;
      }

      fileId = normalizeName(slugify(fileId!));

      if (!fileId) {
        throw new Error(`Invalid file name: ${file.name}`);
      }

      const entry = upload.get(fileId);
      await entry.writeFile(file);

      if (filesArray.length === 1) {
        return c.redirect(
          getPath(options.basePath, "uploads", upload.name, "file", fileId),
        );
      }
    }

    return c.redirect(getPath(options.basePath, "uploads", upload.name));
  });

  app.get("/uploads/:upload/raw/:file", async (c: Context) => {
    const { uploads, uploadId, fileId } = get(c);

    const upload = uploads[uploadId];
    if (!upload) {
      return c.notFound();
    }

    const name = normalizeName(fileId);

    if (!name) {
      return c.notFound();
    }

    const entry = upload.get(name);
    const file = await entry.readFile();
    c.header("Content-Type", file.type);
    c.header("Content-Length", file.size.toString());
    return c.body(await file.arrayBuffer());
  });

  app.get("/uploads/:upload/file/:file", async (c: Context) => {
    const { uploadId, fileId, uploads, versioning } = get(c);
    const upload = uploads[uploadId];

    if (!upload) {
      return c.notFound();
    }

    const { storage } = upload;

    try {
      const name = normalizeName(fileId);
      if (!name) {
        throw new Error("Invalid file name");
      }
      const entry = storage.get(name);
      const file = await entry.readFile();

      return c.render(
        render("uploads/view.vto", {
          type: file.type,
          size: file.size,
          upload,
          file: name,
          version: versioning?.current(),
        }),
      );
    } catch {
      return c.notFound();
    }
  })
    .post(async (c: Context) => {
      const { options, uploadId, uploads } = get(c);
      const upload = uploads[uploadId];

      if (!upload) {
        return c.notFound();
      }

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
      const entry = upload.get(name);

      if (file) {
        await entry.writeFile(file);
      }

      // Convert format
      const format = formatSupported(name);
      if (prevId !== name && formatSupported(prevId) && format) {
        const extFrom = prevId.split(".").pop();
        const extTo = name.split(".").pop();

        if (extTo && extFrom !== extTo) {
          const img = await transform(await entry.readFile(), (img) => {
            img.format = format;
          });
          await entry.writeFile(new File([img], name));
        }
      }

      return c.redirect(
        getPath(options.basePath, "uploads", upload.name, "file", name),
      );
    });

  app.get("/uploads/:upload/crop/:file", (c: Context) => {
    const { options, uploadId, fileId, uploads, versioning } = get(c);
    const upload = uploads[uploadId];

    if (!upload) {
      return c.notFound();
    }

    if (!formatSupported(fileId)) {
      return c.redirect(
        getPath(options.basePath, "uploads", upload.name, "file", fileId),
      );
    }

    try {
      const name = normalizeName(fileId);
      if (!name) {
        throw new Error("Invalid file name");
      }

      return c.render(
        render("uploads/crop.vto", {
          upload,
          file: name,
          version: versioning?.current(),
        }),
      );
    } catch {
      return c.notFound();
    }
  }).post(async (c: Context) => {
    const { uploadId, uploads, fileId, options } = get(c);
    const upload = uploads[uploadId];

    if (!upload) {
      return c.notFound();
    }

    const name = normalizeName(fileId);

    if (!name) {
      return c.notFound();
    }

    const body = await c.req.parseBody();
    const x = parseInt(body.x as string);
    const y = parseInt(body.y as string);
    const width = parseInt(body.width as string);
    const height = parseInt(body.height as string);

    if (
      Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(width) ||
      Number.isNaN(height)
    ) {
      throw new Error("Invalid crop values");
    }
    const entry = upload.get(name);
    const img = await transform(
      await entry.readFile(),
      (img) => {
        img.crop(new MagickGeometry(x, y, width, height));
      },
    );

    const file = new File([img], name);
    await entry.writeFile(file);
    return c.redirect(
      getPath(options.basePath, "uploads", upload.name, "file", name),
    );
  });

  app.post("/uploads/:upload/delete/:file", async (c: Context) => {
    const { options, fileId, uploadId, uploads } = get(c);
    const upload = uploads[uploadId];

    if (!upload) {
      return c.notFound();
    }

    const name = normalizeName(fileId);

    if (!name) {
      throw new Error("Invalid file name");
    }

    await upload.delete(name);
    return c.redirect(getPath(options.basePath, "uploads", upload.name));
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
