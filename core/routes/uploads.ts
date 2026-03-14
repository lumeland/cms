import { getPath, normalizeName } from "../utils/path.ts";
import { Router } from "../../deps/galo.ts";

import type { RouterData } from "../cms.ts";
import {
  canCropDocument,
  deleteDocument,
  getDocument,
  getNewDocument,
  getUpload,
  saveCropDocument,
  saveDocument,
  saveNewDocument,
} from "../usecases/uploads.ts";

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

app.path("/:name/*", ({ cms, name, render, next, user }) => {
  const { uploads, basePath } = cms;

  // Check if the upload exists
  const upload = uploads[name];

  if (!upload) {
    return new Response("Not found", { status: 404 });
  }

  function redirect(...paths: string[]) {
    return new Response(null, {
      status: 302,
      headers: new Headers({
        "Location": getPath(basePath, "uploads", ...paths),
      }),
    });
  }

  return next()
    /* GET /uploads/:name/ - List files in the upload */
    .get("/", async () => {
      const { tree } = await getUpload(upload);

      return render("uploads/list.vto", {
        upload,
        tree,
        user,
      });
    })
    /* GET /uploads/:name/create - Show the file upload form */
    .get("/create", ({ request }) => {
      const { searchParams } = new URL(request.url);
      const { folder } = getNewDocument(user, upload, searchParams);

      return render("uploads/create.vto", {
        upload,
        folder,
        user,
      });
    })
    /* POST /uploads/:name/create - Upload a new file */
    .post("/create", async ({ request }) => {
      const { names } = await saveNewDocument(
        user,
        upload,
        await request.formData(),
      );

      // If only one file is uploaded, redirect to its details
      if (names.length === 1) {
        return redirect(upload.name, names[0], "edit");
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
          const { type, size, exif } = await getDocument(upload, name);

          return render("uploads/edit.vto", {
            type,
            size,
            exif,
            upload,
            file: name,
            user,
          });
        })
        /* POST /uploads/:name/:file/edit - Edit the file */
        .post("/edit", async ({ request }) => {
          const { newName } = await saveDocument(
            user,
            upload,
            name,
            await request.formData(),
          );

          return redirect(upload.name, newName, "edit");
        })
        /* GET /uploads/:name/:file/crop - Show the crop form for images */
        .get("/crop", () => {
          if (!canCropDocument(user, upload, name)) {
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
          await saveCropDocument(user, upload, name, await request.formData());
          return redirect(upload.name, name, "edit");
        })
        /* POST /uploads/:name/:file/delete - Delete the file */
        .post("/delete", async () => {
          await deleteDocument(user, upload, name);
          return redirect(upload.name);
        });
    });
});

export default app;
