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

import type { RouterData } from "../cms.ts";

/**
 * Route for managing file uploads in the CMS.
 * Handles listing, creating, viewing, editing, cropping, and deleting files.
 *
 * /uploads/:name/ - List files in the upload
 * /uploads/:name/create - Create a new file or folder
 * /uploads/:name/raw/:file - Get raw file content
 * /uploads/:name/file/:file - View file details and edit
 * /uploads/:name/crop/:file - Crop an image file
 * /uploads/:name/delete/:file - Delete a file
 */

const app = new Router<RouterData>();

app.path("/:name/*", ({ request, cms, name, render, next }) => {
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
    // List all files in the upload
    .get("/", async () => {
      const files = await Array.fromAsync(upload);

      return render("uploads/list.vto", {
        upload,
        tree: createTree(files),
      });
    })
    // Show the form to upload a new file
    .get("/create", ({ request }) => {
      const { searchParams } = new URL(request.url);

      return render("uploads/create.vto", {
        upload,
        folder: normalizeName(searchParams.get("folder")),
      });
    })
    // Handle file upload
    .post("/create", async ({ request }) => {
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

        if (files.length === 1) {
          return redirect(upload.name, "file", fileId);
        }
      }

      return redirect(upload.name);
    })
    // Handle file actions
    .path("/:action/:file", ({ action, file, next }) => {
      const name = normalizeName(file);

      if (!name) {
        return new Response("Not found", { status: 400 });
      }

      return next()
        // Get raw file content
        .get(action === "raw", () => upload.get(name).readFile())
        // View file details and edit
        .get(action === "file", async () => {
          const entry = upload.get(name);
          const fileData = await entry.readFile();

          return render("uploads/view.vto", {
            type: fileData.type,
            size: fileData.size,
            upload,
            file: name,
          });
        })
        // Update file details or upload a new file
        .post(action === "file", async ({ request }) => {
          const body = await request.formData();
          const newName = normalizeName(body.get("_id") as string);

          if (!newName) {
            throw new Error("Invalid file name");
          }

          if (name !== newName) {
            await upload.rename(name, newName);
          }

          const file = body.get("file") as File | undefined;
          const entry = upload.get(newName);

          if (file) {
            await entry.writeFile(file);
          }

          // Convert format
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

          return redirect(upload.name, "file", newName);
        })
        // Show the crop form for images
        .get(action === "crop", () => {
          if (!formatSupported(name)) {
            return redirect(upload.name, "file", name);
          }

          return render("uploads/crop.vto", {
            upload,
            file: name,
          });
        })
        // Handle image cropping
        .post(action === "crop", async ({ request }) => {
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
          return redirect(upload.name, "file", name);
        })
        // Delete a file
        .post(action === "delete", async () => {
          await upload.delete(name);
          return redirect(upload.name);
        });
    });
});

export default app;
