import { Hono } from "hono/mod.ts";
import { serveStatic } from "hono/middleware.ts";
import layout from "./routes/templates/layout.ts";
import documentRoutes from "./routes/document.ts";
import collectionRoutes from "./routes/collection.ts";
import versionsRoutes from "./routes/versions.tsx";
import indexRoute from "./routes/index.ts";
import filesRoutes from "./routes/files.ts";
import Collection from "./collection.ts";
import Document from "./document.ts";
import { FsStorage } from "./storage/fs.ts";
import { normalizePath, setBasePath } from "./utils/path.ts";
import { join } from "std/path/join.ts";
import { fromFileUrl } from "std/path/from_file_url.ts";
import { basename } from "std/path/basename.ts";
import { dirname } from "std/path/dirname.ts";
import { labelify } from "./utils/string.ts";
import { dispatch } from "./utils/event.ts";

import type { Context, Next } from "hono/mod.ts";
import type {
  CMSContent,
  Entry,
  Field,
  FielType,
  ResolvedField,
  Storage,
  Versioning,
} from "./types.ts";

export interface CmsOptions {
  cwd?: string;
  basePath?: string;
  port?: number;
  appWrapper?: (app: Hono) => Hono;
}

const defaults: Required<CmsOptions> = {
  cwd: Deno.cwd(),
  basePath: "/",
  port: 8000,
  appWrapper: (app) => app,
};

export default class Cms {
  #jsImports = new Set<string>();

  options: Required<CmsOptions>;
  storages = new Map<string, Storage>();
  uploads = new Map<string, [string, string]>();
  fields = new Map<string, FielType>();
  collections = new Map<string, [string, (Field | string)[]]>();
  documents = new Map<string, [string, (Field | string)[]]>();
  versionManager: Versioning | undefined;

  constructor(options?: CmsOptions) {
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

  storage(name: string, storage: Storage | string = "") {
    if (typeof storage === "string") {
      storage = new FsStorage({ root: this.root(), path: storage });
    }
    this.storages.set(name, storage);
  }

  versioning(versioning: Versioning) {
    this.versionManager = versioning;
  }

  upload(name: string, storage: string, publicPath?: string) {
    if (!publicPath) {
      publicPath = normalizePath(storage.split(":")[1] ?? "/");
    }

    this.uploads.set(name, [storage, publicPath]);
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
      versioning: this.versionManager,
      collections: {},
      documents: {},
      uploads: {},
    };

    setBasePath(this.options.basePath);

    for (const type of this.fields.values()) {
      this.#jsImports.add(type.jsImport);
    }

    for (const [name, [storage, publicPath]] of this.uploads.entries()) {
      content.uploads[name] = [this.#getStorage(storage), publicPath];
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

    const app = new Hono({
      strict: false,
    });

    app.use("*", (c: Context, next: Next) => {
      c.setRenderer(async (content) => {
        return c.html(layout({
          jsImports: Array.from(this.#jsImports),
          content: await content,
        }));
      });
      c.set("options", { ...content });
      return next();
    });

    documentRoutes(app);
    collectionRoutes(app);
    filesRoutes(app);
    indexRoute(app);
    versionsRoutes(app);

    const sockets = new Set<WebSocket>();

    addEventListener("cms:previewUpdated", (e) => {
      // @ts-ignore: Detail declared in the event.
      const { src, url } = e.detail;

      sockets.forEach((socket) =>
        socket.send(JSON.stringify({
          type: "updated",
          src,
          url,
        }))
      );
    });

    app.get("_socket", (c: Context) => {
      // Is a websocket
      if (c.req.header("upgrade") === "websocket") {
        const { socket, response } = Deno.upgradeWebSocket(c.req.raw);

        socket.onopen = () => sockets.add(socket);
        socket.onclose = () => sockets.delete(socket);
        socket.onerror = (e) => console.log("Socket errored", e);
        socket.onmessage = async (e) => {
          const { type, src } = JSON.parse(e.data);

          if (type === "open") {
            const result = dispatch<{ src: string; url?: unknown }>(
              "previewUrl",
              { src },
            );

            if (result) {
              const url = await result.url;
              if (url) {
                socket.send(JSON.stringify({ type: "open", src, url }));
              }
            }
          }
        };

        return response;
      }

      return c.notFound();
    });

    let root = import.meta.resolve("../static/");

    if (root.startsWith("file:")) {
      root = fromFileUrl(root);
      const cwd = Deno.cwd();

      if (root.startsWith(cwd)) {
        root = root.slice(cwd.length);
      }

      app.get("*", serveStatic({ root }));
    }

    return this.options.appWrapper(app);
  }

  serve() {
    const app = this.init();
    const { port } = this.options;

    return Deno.serve({
      port,
      handler: app.fetch,
    });
  }

  #getStorage(path: string): Storage {
    const [name, src] = path.split(":");
    const storage = this.storages.get(name);
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

      if (type.init) {
        type.init(resolvedField);
      }

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
