import { changesToData } from "../utils/data.ts";
import collectionList from "../templates/collection/list.ts";
import collectionEdit from "../templates/collection/edit.ts";
import collectionCreate from "../templates/collection/create.ts";
import { getPath } from "../utils/path.ts";

import type { Context, Hono } from "../../deps/hono.ts";
import type { CMSContent } from "../../types.ts";

export default function (app: Hono) {
  app.get("/collection/:collection", async (c: Context) => {
    const { collection, versioning } = get(c);

    if (!collection) {
      return c.notFound();
    }

    return c.render(
      await collectionList({
        collection,
        version: await versioning?.current(),
      }),
    );
  });

  app
    .get("/collection/:collection/edit/:document", async (c: Context) => {
      const { collection, versioning, document } = get(c);

      if (!document) {
        return c.notFound();
      }

      try {
        return c.render(
          await collectionEdit({
            collection,
            document,
            version: await versioning?.current(),
          }),
        );
      } catch {
        return c.notFound();
      }
    })
    .post(async (c: Context) => {
      const { collection, document: oldDocument } = get(c);

      if (!oldDocument) {
        throw new Error("Document not found");
      }

      const body = await c.req.parseBody();
      const newName = body._id as string;
      let document = oldDocument;

      if (oldDocument.name !== newName) {
        await collection.rename(oldDocument.name, newName);
        document = collection.get(newName);
      }

      await document.write(changesToData(body));

      return c.redirect(
        getPath("collection", collection.name, "edit", document.name),
      );
    });

  app.post("/collection/:collection/delete/:document", async (c: Context) => {
    const { collection, document } = get(c);

    if (!document) {
      throw new Error("Document not found");
    }

    await collection.delete(document.name);

    return c.redirect(getPath("collection", collection.name));
  });

  app
    .get("/collection/:collection/create", async (c: Context) => {
      const { collection, versioning } = get(c);

      return c.render(
        collectionCreate({
          collection,
          version: await versioning?.current(),
        }),
      );
    })
    .post(async (c: Context) => {
      const { collection } = get(c);
      const body = await c.req.parseBody();
      const document = collection.create(body._id as string);

      await document.write(changesToData(body));

      return c.redirect(
        getPath("collection", collection.name, "edit", document.name),
      );
    });
}

function get(c: Context) {
  const { collections, versioning } = c.get("options") as CMSContent;
  const collectionName = c.req.param("collection");
  const collection = collections[collectionName];
  const documentName = c.req.param("document");
  const document = documentName ? collection?.get(documentName) : undefined;

  return {
    collection,
    document,
    versioning,
  };
}
