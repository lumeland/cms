import { changesToData, getViews, prepareField } from "../utils/data.ts";
import { getLanguageCode, getPath, normalizeName } from "../utils/path.ts";
import { posix } from "../../deps/std.ts";
import { render } from "../../deps/vento.ts";

import type { Context, Hono } from "../../deps/hono.ts";
import type Collection from "../collection.ts";
import type { CMSContent, Data } from "../../types.ts";
import createTree from "../templates/tree.ts";

export default function (app: Hono) {
  app.get("/collection/:collection", async (c: Context) => {
    const { collection, versioning } = get(c);

    if (!collection) {
      return c.notFound();
    }

    const documents = await Array.fromAsync(collection);
    const tree = createTree(documents);

    return c.render(
      await render("collection/list.vto", {
        collection,
        tree,
        version: versioning?.current(),
      }),
    );
  });

  app
    .get("/collection/:collection/edit/:document", async (c: Context) => {
      const { options, collection, versioning, document } = get(c);

      if (!document) {
        return c.notFound();
      }

      let data: Data;

      try {
        data = await document.read();
      } catch (error) {
        return c.render(
          await render("collection/edit-error.vto", {
            error: (error as Error).message,
            collection,
            document,
          }),
        );
      }

      const fields = await Promise.all(
        collection.fields.map((field) => prepareField(field, options, data)),
      );

      const collectionViews = collection.views;
      const initViews = typeof collectionViews === "function"
        ? collectionViews() || []
        : collectionViews || [];

      const views = new Set();
      collection.fields.forEach((field) => getViews(field, views));

      try {
        return c.render(
          await render("collection/edit.vto", {
            collection,
            fields,
            data,
            initViews,
            views: Array.from(views),
            document,
            version: versioning?.current(),
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

      const changes = await c.req.parseBody();
      let newName = normalizeName(changes._id as string);
      let document = oldDocument;

      if (!newName) {
        throw new Error("Document name is required");
      }

      if (
        oldDocument.name !== newName && collection.permissions.rename !== true
      ) {
        throw new Error("Permission denied");
      }

      const data = changesToData(changes);

      // Recalculate the document name automatically
      if (collection.permissions.rename === "auto") {
        newName = getDocumentName(collection, data, changes) ||
          newName;
      }

      if (oldDocument.name !== newName) {
        newName = await collection.rename(oldDocument.name, newName);
        document = collection.get(newName);
      }

      await document.write(data, options);

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

  app
    .get("/collection/:collection/code/:document", async (c: Context) => {
      const { collection, versioning, document } = get(c);

      if (!document) {
        return c.notFound();
      }

      const code = await document.readText();
      const fields = [{
        tag: "f-code",
        name: "code",
        label: "Code",
        type: "code",
        attributes: {
          data: {
            language: getLanguageCode(document.name),
          },
        },
      }];
      const data = { code };

      try {
        return c.render(
          await render("collection/code.vto", {
            collection,
            fields,
            data,
            document,
            version: versioning?.current(),
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
        if (!collection.canRename()) {
          throw new Error("Permission denied to rename document");
        }
        newName = await collection.rename(oldDocument.name, newName);
        document = collection.get(newName);
      }

      const code = body["changes.code"] as string | undefined;
      document.writeText(code ?? "");

      return c.redirect(
        getPath(
          options.basePath,
          "collection",
          collection.name,
          "code",
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

      if (!collection.canCreate()) {
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

    if (!collection.canDelete()) {
      throw new Error("Permission denied");
    }

    await collection.delete(document.name);

    return c.redirect(getPath(options.basePath, "collection", collection.name));
  });

  app
    .get("/collection/:collection/create", async (c: Context) => {
      const { options, collection, versioning } = get(c);
      const defaults = c.req.query();

      const fields = await Promise.all(
        collection.fields.map((field) => prepareField(field, options)),
      );

      const collectionViews = collection.views;
      const initViews = typeof collectionViews === "function"
        ? collectionViews() || []
        : collectionViews || [];

      const views = new Set();
      collection.fields.forEach((field) => getViews(field, views));

      return c.render(
        render("collection/create.vto", {
          defaults,
          collection,
          fields,
          initViews,
          views: Array.from(views),
          version: versioning?.current(),
          folder: normalizeName(c.req.query("folder")),
        }),
      );
    })
    .post(async (c: Context) => {
      const { options, collection } = get(c);

      if (!collection.canCreate()) {
        throw new Error("Permission denied");
      }

      const changes = await c.req.parseBody();
      const data = changesToData(changes);
      let name = normalizeName(changes._id as string) ||
        getDocumentName(collection, data, changes);

      if (!name) {
        throw new Error("Document name is required");
      }

      if (changes._prefix) {
        name = posix.join(normalizeName(changes._prefix as string) || "", name);
      }

      const document = collection.create(name);
      await document.write(data, options, true);

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

function getDocumentName(
  collection: Collection,
  data: Data,
  changes: Record<string, unknown>,
) {
  switch (typeof collection.documentName) {
    case "string":
      return collection.documentName.replaceAll(
        /\{([^}\s]+)\}/g,
        (_, key) => {
          const value = changes[`changes.${key}`];
          if (typeof value === "string") {
            return value.replaceAll("/", "").trim();
          }
          return "";
        },
      ).trim();

    case "function":
      return collection.documentName(data);
  }
}
