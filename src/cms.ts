import { Hono } from "hono/mod.ts";
import { jsxRenderer } from "hono/middleware.ts";
import serveStatic from "./middleware/serve_static.ts";
import layout from "./routes/templates/layout.tsx";
import documentRoutes from "./routes/document.tsx";
import collectionRoutes from "./routes/collection.tsx";
import indexRoute from "./routes/index.tsx";
import filesRoutes from "./routes/files.tsx";
import Collection from "./collection.ts";
import Document from "./document.ts";
import { FsStorage } from "./storage/fs.ts";
import { normalizePath } from "./utils/path.ts";
import { join } from "std/path/join.ts";
import { basename } from "std/path/basename.ts";
import { dirname } from "std/path/dirname.ts";
import { labelify } from "./utils/string.ts";

import type { Context, MiddlewareHandler, Next } from "hono/mod.ts";
import type {
  CMSContent,
  Entry,
  Field,
  FielType,
  ResolvedField,
  Storage,
} from "./types.ts";

export interface CmsOptions {
  cwd?: string;
  previewUrl?: (path: string) => Promise<string | undefined>;
  server?: Deno.ServeOptions;
  middlewares?: MiddlewareHandler[];
}

const defaults: Required<CmsOptions> = {
  cwd: Deno.cwd(),
  previewUrl() {
    return Promise.resolve(undefined);
  },
  server: {},
  middlewares: [],
};

export default class Cms {
  #jsImports = new Set<string>();

  options: Required<CmsOptions>;
  storage = new Map<string, Storage>();
  uploads = new Map<string, string>();
  fields = new Map<string, FielType>();
  collections = new Map<string, [string, (Field | string)[]]>();
  documents = new Map<string, [string, (Field | string)[]]>();

  constructor(options?: CmsOptions) {
    this.#jsImports.add("/components/u-draggable.js");
    this.#jsImports.add("/components/u-icon.js");
    this.options = {
      ...defaults,
      ...options,
    };
  }

  /**
   * Returns the full path to the root directory.
   * Use the arguments to return a subpath
   */
  root(...path: string[]): string {
    return normalizePath(join(this.options.cwd, ...path));
  }

  store(name: string, storage: Storage | string = "") {
    if (typeof storage === "string") {
      storage = new FsStorage({ root: this.root(), path: storage });
    }
    this.storage.set(name, storage);
  }

  upload(name: string, storage: string) {
    this.uploads.set(name, storage);
  }

  collection(name: string, store: string, fields: (Field | string)[]) {
    this.collections.set(name, [store, fields]);
    return this;
  }

  document(name: string, store: string, fields: (Field | string)[]) {
    this.documents.set(name, [store, fields]);
    return this;
  }

  field(name: string, field: FielType) {
    this.fields.set(name, field);
    return this;
  }

  init(): Hono {
    const content: CMSContent = {
      previewUrl: this.options.previewUrl,
      collections: {},
      documents: {},
      uploads: {},
    };

    for (const type of this.fields.values()) {
      this.#jsImports.add(type.jsImport);
    }

    for (const [name, storage] of this.uploads.entries()) {
      content.uploads[name] = this.#getStorage(storage);
    }

    for (const [name, [path, fields]] of this.collections) {
      content.collections[name] = new Collection(
        this.#getStorage(path),
        this.#resolveFields(fields, content),
      );
    }

    for (const [name, [path, fields]] of this.documents) {
      content.documents[name] = new Document(
        this.#getEntry(path),
        this.#resolveFields(fields, content),
      );
    }

    const app = new Hono();

    app.use("*", ...this.options.middlewares);

    const renderer = layout({
      jsImports: [...this.#jsImports],
    });

    app.use("*", jsxRenderer(renderer, { docType: true }));
    app.use("*", (c: Context, next: Next) => {
      c.set("options", { ...content });
      return next();
    });

    documentRoutes(app);
    collectionRoutes(app);
    filesRoutes(app);
    indexRoute(app);

    app.get("*", serveStatic({ root: import.meta.resolve("../static/") }));

    return app;
  }

  serve() {
    const app = this.init();

    return Deno.serve({
      ...this.options.server,
      handler: app.fetch,
    });
  }

  #getStorage(path: string): Storage {
    const [name, src] = path.split(":");
    const storage = this.storage.get(name);
    if (!storage) {
      throw new Error(`Unknown storage "${name}"`);
    }

    return src ? storage.directory(src) : storage;
  }
  #getEntry(path: string): Entry {
    const [name, src] = path.split(":");
    const storage = this.#getStorage(name + ":" + dirname(src));

    return storage.get(basename(src));
  }

  #resolveFields(
    fields: (Field | string)[],
    content: CMSContent,
  ): ResolvedField[] {
    return fields.map((field): ResolvedField => {
      if (typeof field === "string") {
        const parts = field.split(":").map((part) => part.trim());

        field = {
          name: parts[0],
          type: parts[1] ?? "text",
        };
      }

      const type = this.fields.get(field.type);

      if (!type) {
        throw new Error(`Unknown field of type "${field.type}"`);
      }

      const resolvedField = {
        tag: type.tag,
        label: field.label ?? labelify(field.name),
        transformData: type.transformData,
        cmsContent: content,
        ...field,
      } as ResolvedField;

      if (resolvedField.fields) {
        resolvedField.fields = this.#resolveFields(
          resolvedField.fields,
          content,
        );
      }

      return resolvedField;
    });
  }
}
