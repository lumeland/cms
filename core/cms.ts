import { Hono, HTTPException, serveStatic } from "../deps/hono.ts";
import { render } from "../deps/vento.ts";
import { getCurrentVersion } from "./utils/env.ts";
import documentRoutes from "./routes/document.ts";
import collectionRoutes from "./routes/collection.ts";
import versionsRoutes from "./routes/versions.ts";
import indexRoute from "./routes/index.ts";
import filesRoutes from "./routes/files.ts";
import authRoutes from "./routes/auth.ts";
import Collection from "./collection.ts";
import Document from "./document.ts";
import Upload from "./upload.ts";
import FsStorage from "../storage/fs.ts";
import { asset, getPath, normalizePath } from "./utils/path.ts";
import {
  basename,
  dirname,
  fromFileUrl,
  logger,
  relative,
} from "../deps/std.ts";
import { filter } from "../deps/vento.ts";
import { labelify } from "./utils/string.ts";
import { dispatch } from "./utils/event.ts";
import { Git, Options as GitOptions } from "./git.ts";

import type { Context, Next } from "../deps/hono.ts";
import type {
  CMSContent,
  Data,
  Entry,
  FieldDefinition,
  Labelizer,
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

interface DocumentOptions {
  name: string;
  label?: string;
  description?: string;
  store: string;
  fields: Lume.CMS.Field[];
  url?: string;
  views?: string[] | ((data?: Data) => string[] | undefined);
}

interface CollectionOptions {
  name: string;
  label?: string;
  description?: string;
  store: string;
  fields: Lume.CMS.Field[];
  url?: string;
  views?: string[] | ((data?: Data) => string[] | undefined);
  documentName?: string | ((changes: Data) => string | undefined);
  documentLabel?: Labelizer;
  create?: boolean;
  delete?: boolean;
}

interface UploadOptions {
  name: string;
  label?: string;
  description?: string;
  store: string;
  publicPath?: string;
  listed?: boolean;
}

const defaults: Partial<CmsOptions> = {
  site: {
    name: "Lume CMS",
  },
  basePath: "/",
};

export default class Cms {
  #jsImports = new Set<string>();

  fetch: (request: Request) => Response | Promise<Response>;
  options: CmsOptions;
  storages = new Map<string, Storage | string>();
  uploads = new Map<string, UploadOptions>();
  fields = new Map<string, FieldDefinition>();
  collections = new Map<string, CollectionOptions>();
  documents = new Map<string, DocumentOptions>();
  versionManager: Versioning | undefined;

  constructor(options?: Partial<CmsOptions>) {
    this.options = {
      ...defaults,
      ...options,
    } as CmsOptions;

    this.options.root = normalizePath(this.options.root ?? Deno.cwd());

    // Set the .fetch method (https://github.com/denoland/deno/issues/24062)
    let fetch: ((request: Request) => Response | Promise<Response>) | undefined;

    this.fetch = (request: Request): Response | Promise<Response> => {
      if (!fetch) {
        fetch = this.init().fetch;
      }

      return fetch!(request);
    };
  }

  /** Setup the Git repository */
  git(options?: GitOptions): this {
    this.versionManager = new Git({
      ...options,
    });

    return this;
  }

  /** Setup the basic auth */
  auth(users: Record<string, string>): this {
    this.options.auth = {
      method: "basic",
      users,
    };

    return this;
  }

  /** Add a new storage method */
  storage(name: string, storage: Storage | string = ""): this {
    this.storages.set(name, storage);
    return this;
  }

  /** Add a new upload foler */
  upload(options: UploadOptions): this;
  upload(name: string, store: string, publicPath?: string): this;
  upload(
    name: string | UploadOptions,
    store?: string,
    publicPath?: string,
  ): this {
    const options: UploadOptions = typeof name === "string"
      ? {
        name,
        store,
        publicPath,
      } as UploadOptions
      : name;

    if (!options.description) {
      const [name, description] = options.name.split(":").map((part) =>
        part.trim()
      );
      options.name = name;
      options.description = description;
    }

    if (!options.publicPath) {
      const path = options.store.split(":")[1] ?? "/";
      options.publicPath = normalizePath(path.split("*")[0]);
    }

    this.uploads.set(options.name, options);
    return this;
  }

  /** Add a new collection */
  collection(options: CollectionOptions): this;
  collection(
    name: string,
    store: string,
    fields: Lume.CMS.Field[],
  ): this;
  collection(
    name: string | CollectionOptions,
    store?: string,
    fields?: Lume.CMS.Field[],
  ): this {
    const options = typeof name === "string"
      ? {
        name,
        store,
        fields,
      } as CollectionOptions
      : name as CollectionOptions;

    if (!options.description) {
      const [name, description] = options.name.split(":").map((part) =>
        part.trim()
      );
      options.name = name;
      options.description = description;
    }

    this.collections.set(options.name, options);
    return this;
  }

  /** Add a new document */
  document(options: DocumentOptions): this;
  document(
    name: string,
    store: string,
    fields: Lume.CMS.Field[],
  ): this;
  document(
    name: string | DocumentOptions,
    store?: string,
    fields?: Lume.CMS.Field[],
  ): this {
    const options = typeof name === "string"
      ? {
        name,
        store,
        fields,
      } as DocumentOptions
      : name as DocumentOptions;

    if (!options.description) {
      const [name, description] = options.name.split(":").map((part) =>
        part.trim()
      );
      options.name = name;
      options.description = description;
    }

    this.documents.set(options.name, options);
    return this;
  }

  field(
    name: string,
    field: FieldDefinition,
  ): this {
    this.fields.set(name, field);
    return this;
  }

  /** Use a plugin */
  use(plugin: (c: Cms) => void): this {
    plugin(this);
    return this;
  }

  /** Initialize the CMS */
  initContent(): CMSContent {
    const content: CMSContent = {
      basePath: this.options.basePath,
      auth: this.options.auth?.method === "basic",
      site: this.options.site!,
      data: this.options.data ?? {},
      collections: {},
      documents: {},
      uploads: {},
    };

    if (this.versionManager) {
      content.versioning = this.versionManager;
    }

    for (
      const { name, label, description, store, publicPath, listed } of this
        .uploads
        .values()
    ) {
      content.uploads[name] = new Upload({
        name,
        label: label ?? labelify(name),
        description,
        storage: this.#getStorage(store),
        publicPath: publicPath ?? "/",
        listed: listed ?? true,
      });
    }

    for (
      const { name, label, store, fields, documentLabel, ...options } of this
        .collections
        .values()
    ) {
      content.collections[name] = new Collection({
        storage: this.#getStorage(store),
        fields: this.#resolveFields(fields, content),
        name,
        label: label ?? labelify(name),
        documentLabel: documentLabel
          ? (name) => documentLabel(name, labelify)
          : labelify,
        ...options,
      });
    }

    for (
      const { name, label, store, fields, ...options } of this.documents
        .values()
    ) {
      content.documents[name] = new Document({
        entry: this.#getEntry(store),
        fields: this.#resolveFields(fields, content),
        name,
        label: label ?? labelify(name),
        ...options,
      });
    }

    return content;
  }

  /** Start the CMS */
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
      console.error(message);
      log.error(error);
      log.handlers.forEach((handler) => {
        if (handler instanceof logger.FileHandler) {
          handler.flush();
        }
      });

      return c.text("There was an error. See logs for more info.", 500);
    });

    authRoutes(app, this.options.auth, [
      // Skip auth for socket because Safari doesn't keep the auth header
      getPath(this.options.basePath, "_socket"),
      getPath(this.options.basePath, "logout"),
    ]);

    filter("path", (args: string[]) => getPath(this.options.basePath, ...args));
    filter("asset", (url: string) => asset(this.options.basePath, url));

    app.use("*", (c: Context, next: Next) => {
      c.setRenderer(async (content) => {
        return c.html(render("layout.vto", {
          jsImports: Array.from(this.#jsImports),
          extraHead: this.options.extraHead,
          content: await content,
          version: getCurrentVersion(),
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
    fields: Lume.CMS.Field[],
    content: CMSContent,
  ): Lume.CMS.ResolvedField[] {
    return fields.map((field) => this.#resolveField(field, content));
  }

  #resolveField(
    field: Lume.CMS.Field,
    content: CMSContent,
  ): Lume.CMS.ResolvedField {
    // deno-lint-ignore no-explicit-any
    let resolvedField: any;

    if (typeof field === "string") {
      const parts = field.split(":").map((part) => part.trim());
      resolvedField = {
        name: parts[0],
        type: parts[1] as keyof Lume.CMS.Fields,
      };

      if (resolvedField.type.endsWith("!")) {
        resolvedField.type = resolvedField.type.slice(0, -1);
        resolvedField.attributes = { required: true };
      }
    } else {
      resolvedField = field;
    }

    const type = this.fields.get(resolvedField.type);

    if (!type) {
      throw new Error(`Unknown field of type "${resolvedField.type}"`);
    }

    resolvedField = {
      tag: type.tag,
      label: resolvedField.label ?? labelify(resolvedField.name),
      applyChanges: type.applyChanges,
      ...resolvedField,
    };

    if (resolvedField.fields) {
      resolvedField.fields = this.#resolveFields(
        resolvedField.fields,
        content,
      );
    }

    if (type.init) {
      type.init(resolvedField, content);
    }

    return resolvedField as Lume.CMS.ResolvedField;
  }
}
