import { Hono, HTTPException, serveStatic } from "../deps/hono.ts";
import layout from "./templates/layout.ts";
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
import { getPath, normalizePath } from "./utils/path.ts";
import {
  basename,
  dirname,
  fromFileUrl,
  logger,
  relative,
} from "../deps/std.ts";
import { labelify } from "./utils/string.ts";
import { dispatch } from "./utils/event.ts";
import { Git, Options as GitOptions } from "./git.ts";

import type { Context, Next } from "../deps/hono.ts";
import type {
  CMSContent,
  Data,
  Entry,
  FieldArray,
  FieldDefinition,
  Labelizer,
  MergedField,
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

interface DocumentOptions<K extends string> {
  name: string;
  label?: string;
  description?: string;
  store: string;
  fields: FieldArray<K>;
  url?: string;
  views?: string[];
}

interface UploadOptions {
  name: string;
  label?: string;
  description?: string;
  store: string;
  publicPath?: string;
  listed?: boolean;
}

interface CollectionOptions<K extends string> {
  name: string;
  label?: string;
  description?: string;
  store: string;
  fields: FieldArray<K>;
  url?: string;
  views?: string[];
  /** @deprecated. Use `documentName` instead */
  nameField?: string | ((changes: Data) => string);
  documentName?: string | ((changes: Data) => string | undefined);
  documentLabel?: Labelizer;
  create?: boolean;
  delete?: boolean;
}

const defaults = {
  site: {
    name: "Lume CMS",
  },
  root: Deno.cwd(),
  basePath: "/",
} satisfies CmsOptions;

export default class Cms<
  FieldType extends string,
> {
  #jsImports = new Set<string>();

  fetch: (request: Request) => Response | Promise<Response>;
  options: CmsOptions;
  storages = new Map<string, Storage | string>();
  uploads = new Map<string, UploadOptions>();
  fields = new Map<string, FieldDefinition<FieldType>>();
  collections = new Map<string, CollectionOptions<FieldType>>();
  documents = new Map<string, DocumentOptions<FieldType>>();
  versionManager: Versioning | undefined;

  constructor(options?: Partial<CmsOptions>) {
    this.options = {
      ...defaults,
      ...options,
    };

    this.options.root = normalizePath(this.options.root);

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
  collection(
    options: CollectionOptions<FieldType>,
  ): this;
  collection(
    name: string,
    store: string,
    fields: FieldArray<FieldType>,
  ): this;
  collection(
    name: string | CollectionOptions<FieldType>,
    store?: string,
    fields?: FieldArray<FieldType>,
  ): this {
    const options = typeof name === "string"
      ? {
        name,
        store,
        fields,
      } as CollectionOptions<FieldType>
      : name;

    if (!options.description) {
      const [name, description] = options.name.split(":").map((part) =>
        part.trim()
      );
      options.name = name;
      options.description = description;
    }

    this.collections.set(
      options.name,
      options,
    );
    return this;
  }

  /** Add a new document */
  document(
    options: DocumentOptions<FieldType>,
  ): this;
  document(
    name: string,
    store: string,
    fields: FieldArray<FieldType>,
  ): this;
  document(
    name: string | DocumentOptions<FieldType>,
    store?: string,
    fields?: FieldArray<FieldType>,
  ): this {
    const options = typeof name === "string"
      ? {
        name,
        store,
        fields,
      } as DocumentOptions<FieldType>
      : name as DocumentOptions<FieldType>;

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

  /** Add a new field type */
  field<T extends string>(
    name: T,
    field: FieldDefinition<T>,
  ): Cms<FieldType | T> {
    this.fields.set(name, field as unknown as FieldDefinition<FieldType>);
    return this as unknown as Cms<FieldType | T>;
  }

  /** Use a plugin */
  use(plugin: (cms: Cms<FieldType>) => void): this {
    plugin(this);
    return this;
  }

  /** Initialize the CMS */
  initContent(): CMSContent<FieldType> {
    const content: CMSContent<FieldType> = {
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
        fields: this.#resolveFields(
          fields as (MergedField<FieldType> | string)[],
          content,
        ),
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
        fields: this.#resolveFields(
          fields as (MergedField<FieldType> | string)[],
          content,
        ),
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
    fields: (MergedField<FieldType> | string)[],
    content: CMSContent<FieldType>,
  ): ResolvedField<FieldType>[] {
    return fields
      .map((field) => {
        if (typeof field !== "string") {
          return field;
        }
        const [name, type] = field.split(":").map((part) => part.trim());
        const required = type?.endsWith("!");
        if (required) {
          return {
            name,
            type: type.slice(0, -1) as FieldType,
            attributes: { required: true },
          } satisfies MergedField<FieldType>;
        } else {
          return {
            name,
            type: (type ?? "text") as FieldType,
          } satisfies MergedField<
            FieldType
          >;
        }
      })
      .map((field): ResolvedField<FieldType> => {
        const type = this.fields.get(field.type);

        if (!type) {
          throw new Error(`Unknown field of type "${field.type}"`);
        }

        const resolvedField = {
          tag: type.tag,
          label: field.label ?? labelify(field.name),
          applyChanges: type.applyChanges,
          ...field,
        } as ResolvedField<FieldType>;

        if (type.init) {
          type.init(resolvedField, content);
        }

        if (field.fields) {
          resolvedField.fields = this.#resolveFields(
            field.fields as (MergedField<FieldType> | string)[],
            content,
          );
        }

        return resolvedField;
      });
  }
}
