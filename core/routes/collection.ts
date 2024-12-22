import { changesToData } from "../utils/data.ts";
import collectionList from "../templates/collection/list.ts";
import collectionEdit from "../templates/collection/edit.ts";
import collectionCreate from "../templates/collection/create.ts";
import { getPath, normalizeName } from "../utils/path.ts";
import { posix } from "../../deps/std.ts";

import type { Context, Hono } from "../../deps/hono.ts";
import type { CMSContent } from "../../types.ts";

export default function (app: Hono) {
  app.get("/collection/:collection", async (c: Context) => {
    const { options, collection, versioning } = get(c);

    if (!collection) {
      return c.notFound();
    }

    return c.render(
      await collectionList({
        options,
        collection,
        version: await versioning?.current(),
      }),
    );
  });

  app
    .get("/collection/:collection/edit/:document", async (c: Context) => {
      const { options, collection, versioning, document } = get(c);

      if (!document) {
        return c.notFound();
      }

      try {
        return c.render(
          await collectionEdit({
            options,
            collection,
            document,
            version: await versioning?.current(),
          }),
        );
      } catch (e) {
        console.error(e);
        return c.notFound();
      }
    })
    .post(async (c: Context) => {
      const { options, collection, document: oldDocument } = get(c);

      if (!oldDocument) {
        throw new Error("Document not found");
      }

      const body = await c.req.parseBody();
      let newName = normalizeName(body._id as string);
      let document = oldDocument;

      if (!newName) {
        throw new Error("Document name is required");
      }

      if (oldDocument.name !== newName) {
        newName = await collection.rename(oldDocument.name, newName);
        document = collection.get(newName);
      }

      await document.write(changesToData(body), options);

      return c.redirect(
        getPath(
          options.basePath,
          "collection",
          collection.name,
          "edit",
          document.name,
        ),
      );
    });
  app.post(
    "/collection/:collection/duplicate/:document",
    async (c: Context) => {
      const { options, collection, document } = get(c);

      if (!document) {
        throw new Error("Document not found");
      }

      if (!collection.permissions.create) {
        throw new Error("Permission denied");
      }

      const body = await c.req.parseBody();
      let name = normalizeName(body._id as string);

      if (!name) {
        throw new Error("Document name is required");
      }

      if (document.name === name) {
        const ext = name.split(".").pop();
        if (ext) {
          name = name.substring(0, name.length - ext.length - 1) + "-copy." +
            ext;
        } else {
          name = `${name}-copy`;
        }
      }

      const duplicate = collection.create(name);
      await duplicate.write(changesToData(body), options, true);

      return c.redirect(
        getPath(
          options.basePath,
          "collection",
          collection.name,
          "edit",
          duplicate.name,
        ),
      );
    },
  );

  app.post("/collection/:collection/delete/:document", async (c: Context) => {
    const { options, collection, document } = get(c);

    if (!document) {
      throw new Error("Document not found");
    }

    if (!collection.permissions.delete) {
      throw new Error("Permission denied");
    }

    await collection.delete(document.name);

    return c.redirect(getPath(options.basePath, "collection", collection.name));
  });

  app
    .get("/collection/:collection/create", async (c: Context) => {
      const { options, collection, versioning } = get(c);

      return c.render(
        collectionCreate({
          options,
          collection,
          version: await versioning?.current(),
          folder: normalizeName(c.req.query("folder")),
        }),
      );
    })
    .post(async (c: Context) => {
      const { options, collection } = get(c);

      if (!collection.permissions.create) {
        throw new Error("Permission denied");
      }

      const body = await c.req.parseBody();
      let name = normalizeName(body._id as string);

      const changes = changesToData(body);
      if (!name && collection.nameField) {
        switch (typeof collection.nameField) {
          case "string": {
            const autoname = body[`changes.${collection.nameField}`];
            if (typeof autoname === "string") {
              name = autoname.replaceAll("/", "").trim();
            }
            break;
          }
          case "function": {
            name = collection.nameField(changes);
            break;
          }
        }
      }

      if (!name) {
        throw new Error("Document name is required");
      }

      if (body._prefix) {
        name = posix.join(normalizeName(body._prefix as string) || "", name);
      }

      const document = collection.create(name);
      await document.write(changes, options, true);

      return c.redirect(
        getPath(
          options.basePath,
          "collection",
          collection.name,
          "edit",
          document.name,
        ),
      );
    });
}

function get(c: Context) {
  const options = c.get("options") as CMSContent;
  const { collections, versioning } = options;
  const collectionName = c.req.param("collection");
  const collection = collections[collectionName];
  const documentName = normalizeName(c.req.param("document"));
  const document = documentName ? collection?.get(documentName) : undefined;

  return {
    collection,
    document,
    options,
    versioning,
  };
}
