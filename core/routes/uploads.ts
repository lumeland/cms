import { getPath, normalizeName } from "../utils/path.ts";
import { Router } from "../../deps/galo.ts";

import type { RouterData } from "../cms.ts";
import {
  canCropDocument,
  deleteDocument,
  getDocument,
  getNewDocument,
  getUpload,
  moveDocument,
  saveCropDocument,
  saveNewDocument,
} from "../usecases/uploads.ts";

/**
 * Route for managing file uploads in the CMS.
 * Handles listing, creating, viewing, editing, and deleting files.
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
      const { folder } = getNewDocument(
        user,
        upload,
        searchParams.get("folder") as string,
      );

      return render("uploads/create.vto", {
        upload,
        folder,
        user,
      });
    })
    /* POST /uploads/:name/create - Upload a new file */
    .post("/create", async ({ request }) => {
      const data = await request.formData();
      const files = data.getAll("files") as File[];
      const folder = data.get("_id") as string | undefined;
      const { names } = await saveNewDocument(
        user,
        upload,
        files,
        folder,
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
          const data = await request.formData();
          const x = parseInt(data.get("x") as string);
          const y = parseInt(data.get("y") as string);
          const width = parseInt(data.get("width") as string);
          const height = parseInt(data.get("height") as string);

          await saveCropDocument(user, upload, name, { x, y, width, height });
          return redirect(upload.name, name, "edit");
        })
        /* POST /uploads/:name/:file/delete - Delete the file */
        .post("/delete", async () => {
          await deleteDocument(user, upload, name);
          return redirect(upload.name);
        })
        /* POST /uploads/:name/:file/move - Move the file */
        .post("/move", async ({ request }) => {
          const data = await request.formData();
          const { newName } = await moveDocument(
            user,
            upload,
            name,
            data.get("name") as string,
          );
          return redirect(upload.name, newName, "edit");
        })
        /* POST /uploads/:name/:file/duplicate - Duplicate the file */
        .post("/duplicate", async ({ request }) => {
          const data = await request.formData();
          const { newName } = await moveDocument(
            user,
            upload,
            name,
            data.get("name") as string,
            true,
          );
          return redirect(upload.name, newName, "edit");
        });
    });
});

export default app;
