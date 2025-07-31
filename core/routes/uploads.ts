import { slugify } from "../utils/string.ts";
import { getPath, normalizeName } from "../utils/path.ts";
import {
  formatSupported,
  MagickGeometry,
  transform,
} from "../../deps/imagick.ts";
import { posix } from "../../deps/std.ts";
import createTree from "../templates/tree.ts";
import { Router } from "../../deps/galo.ts";
import { parseExif } from "../../deps/exifr.ts";

import type { RouterData } from "../cms.ts";

/**
 * Route for managing file uploads in the CMS.
 * Handles listing, creating, viewing, editing, cropping, and deleting files.
 *
 * /uploads/:name/ - List files in the upload
 * /uploads/:name/create - Create a new file or folder
 * /uploads/:name/:file - Get raw file content
 * /uploads/:name/:file/edit - Edit a file
 * /uploads/:name/:file/crop - Crop an image file
 * /uploads/:name/:file/delete - Delete a file
 */

const app = new Router<RouterData>();

app.path("/:name/*", ({ request, cms, name, render, next, user }) => {
  const { uploads, basePath } = cms;

  // Check if the upload exists
  const upload = uploads[name];

  if (!upload) {
    return new Response("Not found", { status: 404 });
  }

  function redirect(...paths: string[]) {
    const path = getPath(basePath, "uploads", ...paths);
    return Response.redirect(new URL(path, request.url));
  }

  return next()
    /* GET /uploads/:name/ - List files in the upload */
    .get("/", async () => {
      return render("uploads/list.vto", {
        upload,
        tree: createTree(await Array.fromAsync(upload)),
        user,
      });
    })
    /* GET /uploads/:name/create - Show the file upload form */
    .get("/create", ({ request }) => {
      if (!user.canCreate(upload)) {
        throw new Error("Permission denied to create files in this upload");
      }
      const { searchParams } = new URL(request.url);

      return render("uploads/create.vto", {
        upload,
        folder: normalizeName(searchParams.get("folder")),
        user,
      });
    })
    /* POST /uploads/:name/create - Upload a new file */
    .post("/create", async ({ request }) => {
      if (!user.canCreate(upload)) {
        throw new Error("Permission denied to create files in this upload");
      }
      const body = await request.formData();
      const files = body.getAll("files") as File[];

      for (const file of files) {
        let fileId = file.name as string | undefined;
        const folder = body.get("_id") as string | undefined;

        if (folder) {
          fileId = folder.endsWith("/") ? posix.join(folder, fileId!) : folder;
        }

        fileId = normalizeName(slugify(fileId!));

        if (!fileId) {
          throw new Error(`Invalid file name: ${file.name}`);
        }

        const entry = upload.get(fileId);
        await entry.writeFile(file);

        // If only one file is uploaded, redirect to its details
        if (files.length === 1) {
          return redirect(upload.name, fileId, "edit");
        }
      }

      return redirect(upload.name);
    })
    /* GET /uploads/:name/:file/* - File actions */
    .path("/:file/*", ({ file, next }) => {
      const name = normalizeName(file);

      if (!name) {
        return new Response("Not found", { status: 400 });
      }

      return next()
        /* GET /uploads/:name/:file - Get raw file content */
        .get("/", () => upload.get(name).readFile())
        /* GET /uploads/:name/:file/edit - Show the file edit form */
        .get("/edit", async () => {
          const entry = upload.get(name);
          const fileData = await entry.readFile();

          return render("uploads/view.vto", {
            type: fileData.type,
            size: fileData.size,
            exif: await parseExif(fileData),
            upload,
            file: name,
            user,
          });
        })
        /* POST /uploads/:name/:file/edit - Edit the file */
        .post("/edit", async ({ request }) => {
          if (!user.canEdit(upload)) {
            throw new Error("Permission denied to edit this file");
          }
          const body = await request.formData();
          const newName = normalizeName(body.get("_id") as string);

          if (!newName) {
            throw new Error("Invalid file name");
          }

          // Rename the file if the name has changed
          if (name !== newName) {
            await upload.rename(name, newName);
          }

          const file = body.get("file") as File | undefined;
          const entry = upload.get(newName);

          if (file) {
            await entry.writeFile(file);
          }

          // Convert format if the extension has changed (e.g., from .jpg to .png)
          const format = formatSupported(newName);
          if (name !== newName && formatSupported(name) && format) {
            const extFrom = name.split(".").pop();
            const extTo = newName.split(".").pop();

            if (extTo && extFrom !== extTo) {
              const img = await transform(await entry.readFile(), (img) => {
                img.format = format;
              });
              await entry.writeFile(new File([img], newName));
            }
          }

          return redirect(upload.name, newName, "edit");
        })
        /* GET /uploads/:name/:file/crop - Show the crop form for images */
        .get("/crop", () => {
          if (!user.canEdit(upload)) {
            throw new Error("Permission denied to edit this file");
          }

          if (!formatSupported(name)) {
            return redirect(upload.name, name, "edit");
          }

          return render("uploads/crop.vto", {
            upload,
            file: name,
            user,
          });
        })
        /* POST /uploads/:name/:file/crop - Crop the image */
        .post("/crop", async ({ request }) => {
          if (!user.canEdit(upload)) {
            throw new Error("Permission denied to edit this file");
          }
          const body = await request.formData();
          const x = parseInt(body.get("x") as string);
          const y = parseInt(body.get("y") as string);
          const width = parseInt(body.get("width") as string);
          const height = parseInt(body.get("height") as string);

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
          return redirect(upload.name, name, "edit");
        })
        /* POST /uploads/:name/:file/delete - Delete the file */
        .post("/delete", async () => {
          if (!user.canDelete(upload)) {
            throw new Error("Permission denied to delete this file");
          }
          await upload.delete(name);
          return redirect(upload.name);
        });
    });
});

export default app;
