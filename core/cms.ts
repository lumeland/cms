import { Hono, HTTPException, serveStatic } from "../deps/hono.ts";
import layout from "./templates/layout.ts";
import documentRoutes from "./routes/document.ts";
import collectionRoutes from "./routes/collection.ts";
import versionsRoutes from "./routes/versions.tsx";
import indexRoute from "./routes/index.ts";
import filesRoutes from "./routes/files.ts";
import authRoutes from "./routes/auth.ts";
import Collection from "./collection.ts";
import Document from "./document.ts";
import Upload from "./upload.ts";
import FsStorage from "../storage/fs.ts";
import { Git } from "../versioning/git.ts";
import { normalizePath } from "./utils/path.ts";
import {
  basename,
  dirname,
  fromFileUrl,
  logger,
  relative,
} from "../deps/std.ts";
import { labelify } from "./utils/string.ts";
import { dispatch } from "./utils/event.ts";

import type { Context, Next } from "../deps/hono.ts";
import type {
  CMSContent,
  Entry,
  Field,
  FielType,
  ResolvedField,
  SiteInfo,
  Storage,
  Versioning,
} from "../types.ts";

export interface CmsOptions {
  site?: SiteInfo;
  root: string;
  basePath: string;
  auth?: AuthOptions;
  data?: Record<string, unknown>;
  log?: LogOptions;
  extraHead?: string;
}

export interface AuthOptions {
  method: "basic";
  users: Record<string, string>;
}

export interface LogOptions {
  filename: string;
}

const defaults: CmsOptions = {
  site: {
    name: "Lume CMS",
  },
  root: Deno.cwd(),
  basePath: "/",
};

export default class Cms {
  #jsImports = new Set<string>();

  options: CmsOptions;
  storages = new Map<string, Storage | string>();
  uploads = new Map<string, [string, string]>();
  fields = new Map<string, FielType>();
  collections = new Map<string, [string, (Field | string)[]]>();
  documents = new Map<string, [string, (Field | string)[]]>();
  versionManager: Versioning | string | undefined;

  constructor(options?: Partial<CmsOptions>) {
    this.options = {
      ...defaults,
      ...options,
    };

    this.options.root = normalizePath(this.options.root);
  }

  storage(name: string, storage: Storage | string = ""): this {
    this.storages.set(name, storage);
    return this;
  }

  versioning(versioning: Versioning | string): this {
    this.versionManager = versioning;
    return this;
  }

  upload(name: string, storage: string, publicPath?: string): this {
    if (!publicPath) {
      const path = storage.split(":")[1] ?? "/";
      publicPath = normalizePath(path.split("*")[0]);
    }

    this.uploads.set(name, [storage, publicPath]);
    return this;
  }

  collection(name: string, store: string, fields: (Field | string)[]): this {
    this.collections.set(name, [store, fields]);
    return this;
  }

  document(name: string, store: string, fields: (Field | string)[]): this {
    this.documents.set(name, [store, fields]);
    return this;
  }

  field(name: string, field: FielType): this {
    this.fields.set(name, field);
    return this;
  }

  use(plugin: (cms: Cms) => void): this {
    plugin(this);
    return this;
  }

  initContent(): CMSContent {
    const content: CMSContent = {
      basePath: this.options.basePath,
      site: this.options.site!,
      data: this.options.data ?? {},
      collections: {},
      documents: {},
      uploads: {},
    };

    if (typeof this.versionManager === "string") {
      content.versioning = new Git({
        root: this.options.root,
        prodBranch: this.versionManager,
      });
    }

    for (const [key, [storage, publicPath]] of this.uploads.entries()) {
      const [name, description] = key.split(":").map((part) => part.trim());

      content.uploads[name] = new Upload({
        name,
        description,
        storage: this.#getStorage(storage),
        publicPath,
      });
    }

    for (const [key, [path, fields]] of this.collections) {
      const [name, description] = key.split(":").map((part) => part.trim());

      content.collections[name] = new Collection({
        storage: this.#getStorage(path),
        fields: this.#resolveFields(fields, content),
        name,
        description,
      });
    }

    for (const [key, [path, fields]] of this.documents) {
      const [name, description] = key.split(":").map((part) => part.trim());

      content.documents[name] = new Document({
        entry: this.#getEntry(path),
        fields: this.#resolveFields(fields, content),
        name,
        description,
      });
    }

    return content;
  }

  init(): Hono {
    const content = this.initContent();

    for (const type of this.fields.values()) {
      this.#jsImports.add(type.jsImport);
    }

    const app = new Hono({
      strict: false,
    });

    if (this.options.log?.filename) {
      logger.setup({
        handlers: {
          file: new logger.FileHandler("ERROR", {
            filename: this.options.log.filename,
          }),
        },
        loggers: {
          lumecms: {
            level: "ERROR",
            handlers: ["file"],
          },
        },
      });
    } else {
      logger.setup({
        handlers: {
          console: new logger.ConsoleHandler("ERROR"),
        },
        loggers: {
          lumecms: {
            level: "ERROR",
            handlers: ["console"],
          },
        },
      });
    }

    app.onError((error: Error, c: Context) => {
      if (error instanceof HTTPException && error.res) {
        return error.res;
      }

      const log = logger.getLogger("lumecms");
      const { req } = c;
      const time = new Date().toISOString();
      const message = `${time} [${req.method}] ${req.url} - ${error.message}`;
      error.message = message;

      log.error(error);
      log.handlers.forEach((handler) => {
        if (handler instanceof logger.FileHandler) {
          handler.flush();
        }
      });

      return c.text("There was an error. See logs for more info.", 500);
    });

    if (this.options.auth) {
      authRoutes(app, this.options.auth);
    }

    app.use("*", (c: Context, next: Next) => {
      c.setRenderer(async (content) => {
        return c.html(layout({
          options: c.var.options,
          jsImports: Array.from(this.#jsImports),
          extraHead: this.options.extraHead,
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

    addEventListener("cms:previewUpdated", () => {
      sockets.forEach((socket) => {
        socket.send(JSON.stringify({ type: "preview" }));
      });
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

          if (type === "url") {
            const result = dispatch<{ src: string; url?: unknown }>(
              "previewUrl",
              { src },
            );

            if (result) {
              const url = await result.url;
              if (url) {
                socket.send(JSON.stringify({ type: "reload", src, url }));
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
      root = relative(Deno.cwd(), fromFileUrl(root));
      app.get(
        "*",
        serveStatic({
          root,
          rewriteRequestPath: (path: string) =>
            normalizePath(path.substring(this.options.basePath.length)),
        }),
      );
    }

    return app;
  }

  #getStorage(path: string): Storage {
    const [name, src] = path.split(":");
    const storage = this.storages.get(name);

    if (storage === undefined) {
      throw new Error(`Unknown storage "${name}"`);
    }

    if (typeof storage === "string") {
      const fs = new FsStorage({ root: this.options.root, path: storage });
      this.storages.set(name, fs);
      return src ? fs.directory(src) : fs;
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

        if (field.type.endsWith("!")) {
          field.type = field.type.slice(0, -1);
          field.attributes = { required: true };
        }
      }

      const type = this.fields.get(field.type);

      if (!type) {
        throw new Error(`Unknown field of type "${field.type}"`);
      }

      const resolvedField = {
        tag: type.tag,
        label: field.label ?? labelify(field.name),
        applyChanges: type.applyChanges,
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
