import { changesToData } from "../utils/data.ts";
import CollectionList from "./templates/collection/list.tsx";
import CollectionEdit from "./templates/collection/edit.tsx";
import CollectionCreate from "./templates/collection/create.tsx";
import { getUrl, slugify } from "../utils/string.ts";

import type { Context, Hono } from "hono/mod.ts";
import type { CMSContent } from "../types.ts";

export default function (app: Hono) {
  app.get("/collection/:collection", async (c: Context) => {
    const { collections } = c.get("options") as CMSContent;
    const collectionId = c.req.param("collection");
    const collection = collections[collectionId];
    const documents = await Array.fromAsync(collection) as string[];

    return c.render(
      <CollectionList collection={collectionId} documents={documents} />,
    );
  });

  app
    .get("/collection/:collection/edit/:document", async (c: Context) => {
      const { collections, previewUrl } = c.get("options") as CMSContent;
      const collectionId = c.req.param("collection");
      const collection = collections[collectionId];
      const documentId = c.req.param("document");
      const document = collection.get(documentId);
      const data = await document.read();

      const src = document.src;
      const preview = src && await previewUrl(src);

      return c.render(
        <CollectionEdit
          collection={collectionId}
          document={documentId}
          fields={document.fields}
          data={data}
          previewUrl={preview}
        />,
      );
    })
    .post(async (c: Context) => {
      const { collections } = c.get("options") as CMSContent;
      const collectionId = c.req.param("collection");
      const collection = collections[collectionId];
      const body = await c.req.parseBody();
      const prevId = c.req.param("document");
      const documentId = slugify(body._id as string);

      if (prevId !== documentId) {
        await collection.rename(prevId, documentId);
      }

      const document = collection.get(documentId);
      await document.write(changesToData(body));

      return c.redirect(getUrl("collection", collectionId, "edit", documentId));
    });

  app.post("/collection/:collection/delete/:document", async (c: Context) => {
    const { collections } = c.get("options") as CMSContent;
    const collectionId = c.req.param("collection");
    const collection = collections[collectionId];
    const documentId = c.req.param("document");

    await collection.delete(documentId);

    return c.redirect(getUrl("collection", collectionId));
  });

  app
    .get("/collection/:collection/create", (c: Context) => {
      const { collections } = c.get("options") as CMSContent;
      const collectionId = c.req.param("collection");
      const collection = collections[collectionId];

      return c.render(
        <CollectionCreate
          collection={collectionId}
          fields={collection.fields}
        />,
      );
    })
    .post(async (c: Context) => {
      const { collections } = c.get("options") as CMSContent;
      const collectionId = c.req.param("collection");
      const collection = collections[collectionId];
      const body = await c.req.parseBody();
      const documentId = slugify(body._id as string);
      const document = collection.create(documentId);

      await document.write(changesToData(body));

      return c.redirect(getUrl("collection", collectionId, "edit", documentId));
    });
}
