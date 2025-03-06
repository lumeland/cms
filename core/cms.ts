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
  BaseField,
  CMSContent,
  Data,
  Entry,
  Field,
  FieldArray,
  FieldDefinition,
  FieldPropertyMap,
  Labelizer,
  LiteralOnly,
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

interface DocumentOptions<
  FieldType extends string,
  FieldProperties extends FieldPropertyMap<FieldType>,
> {
  name: string;
  label?: string;
  description?: string;
  store: string;
  fields: FieldArray<FieldType, FieldProperties>;
  url?: string;
  views?: string[];
}

interface CollectionOptions<
  FieldType extends string,
  FieldProperties extends FieldPropertyMap<FieldType>,
> {
  name: string;
  label?: string;
  description?: string;
  store: string;
  fields: FieldArray<FieldType, FieldProperties>;
  url?: string;
  views?: string[];
  /** @deprecated. Use `documentName` instead */
  nameField?: string | ((changes: Data) => string);
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

type UnknownFieldPropertyMap<
  FieldTypes extends string,
  FieldProperties extends FieldPropertyMap<FieldTypes>,
  UnknownFieldTypes extends string,
> = {
  [K in FieldTypes | UnknownFieldTypes]: K extends FieldTypes
    ? FieldProperties[K]
    : { name: string; [x: string]: unknown };
};

const defaults = {
  site: {
    name: "Lume CMS",
  },
  root: Deno.cwd(),
  basePath: "/",
} satisfies CmsOptions;

export default class Cms<
  FieldTypes extends string,
  FieldProperties extends FieldPropertyMap<FieldTypes>,
> {
  #jsImports = new Set<string>();

  fetch: (request: Request) => Response | Promise<Response>;
  options: CmsOptions;
  storages = new Map<string, Storage | string>();
  uploads = new Map<string, UploadOptions>();
  fields = new Map<
    string,
    FieldDefinition<
      Field<
        FieldTypes,
        FieldProperties[FieldTypes],
        FieldTypes,
        FieldProperties
      >
    >
  >();
  collections = new Map<
    string,
    CollectionOptions<FieldTypes, FieldProperties>
  >();
  documents = new Map<string, DocumentOptions<FieldTypes, FieldProperties>>();
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
  collection<UnknownFieldTypes extends string>(
    options: CollectionOptions<
      UnknownFieldTypes | FieldTypes,
      UnknownFieldPropertyMap<FieldTypes, FieldProperties, UnknownFieldTypes>
    >,
  ): this;
  collection<UnknownFieldTypes extends string>(
    name: string,
    store: string,
    fields: FieldArray<
      UnknownFieldTypes | FieldTypes,
      UnknownFieldPropertyMap<FieldTypes, FieldProperties, UnknownFieldTypes>
    >,
  ): this;
  collection<UnknownFieldTypes extends string>(
    name:
      | string
      | CollectionOptions<
        UnknownFieldTypes | FieldTypes,
        UnknownFieldPropertyMap<FieldTypes, FieldProperties, UnknownFieldTypes>
      >,
    store?: string,
    fields?: FieldArray<
      UnknownFieldTypes | FieldTypes,
      UnknownFieldPropertyMap<FieldTypes, FieldProperties, UnknownFieldTypes>
    >,
  ): this {
    type Options = CollectionOptions<
      UnknownFieldTypes | FieldTypes,
      UnknownFieldPropertyMap<FieldTypes, FieldProperties, UnknownFieldTypes>
    >;
    const options = typeof name === "string"
      ? {
        name,
        store,
        fields,
      } as Options
      : name as Options;

    if (!options.description) {
      const [name, description] = options.name.split(":").map((part) =>
        part.trim()
      );
      options.name = name;
      options.description = description;
    }

    this.collections.set(
      options.name,
      options as unknown as CollectionOptions<FieldTypes, FieldProperties>,
    );
    return this;
  }

  /** Add a new document */
  document<UnknownFieldTypes extends string>(
    options: DocumentOptions<
      UnknownFieldTypes | FieldTypes,
      UnknownFieldPropertyMap<FieldTypes, FieldProperties, UnknownFieldTypes>
    >,
  ): this;
  document<UnknownFieldTypes extends string>(
    name: string,
    store: string,
    fields: FieldArray<
      UnknownFieldTypes | FieldTypes,
      UnknownFieldPropertyMap<FieldTypes, FieldProperties, UnknownFieldTypes>
    >,
  ): this;
  document<UnknownFieldTypes extends string>(
    name:
      | string
      | DocumentOptions<
        UnknownFieldTypes | FieldTypes,
        UnknownFieldPropertyMap<FieldTypes, FieldProperties, UnknownFieldTypes>
      >,
    store?: string,
    fields?: FieldArray<
      UnknownFieldTypes | FieldTypes,
      UnknownFieldPropertyMap<FieldTypes, FieldProperties, UnknownFieldTypes>
    >,
  ): this {
    type Options = DocumentOptions<
      UnknownFieldTypes | FieldTypes,
      UnknownFieldPropertyMap<FieldTypes, FieldProperties, UnknownFieldTypes>
    >;
    const options = typeof name === "string"
      ? {
        name,
        store,
        fields,
      } as Options
      : name as Options;

    if (!options.description) {
      const [name, description] = options.name.split(":").map((part) =>
        part.trim()
      );
      options.name = name;
      options.description = description;
    }

    this.documents.set(
      options.name,
      options as unknown as DocumentOptions<FieldTypes, FieldProperties>,
    );
    return this;
  }

  field<
    AdditionalField extends BaseField<string, { name: string }>,
  >(
    name: LiteralOnly<AdditionalField["type"]>,
    field: FieldDefinition<AdditionalField>,
  ): Cms<
    FieldTypes | LiteralOnly<AdditionalField["type"]>,
    & FieldProperties
    & {
      [K in LiteralOnly<AdditionalField["type"]>]: AdditionalField;
    }
  >;
  field<
    AdditionalField extends BaseField<AdditionalFieldTypes, { name: string }>,
    AdditionalFieldTypes extends string,
  >(
    name: AdditionalFieldTypes,
    field: FieldDefinition<AdditionalField>,
  ): Cms<
    FieldTypes | LiteralOnly<AdditionalField["type"]>,
    & FieldProperties
    & {
      [K in LiteralOnly<AdditionalField["type"]>]: AdditionalField;
    }
  >;
  field<
    AdditionalField extends BaseField<string, { name: string }>,
  >(
    name: LiteralOnly<AdditionalField["type"]>,
    field: FieldDefinition<AdditionalField>,
  ): Cms<
    FieldTypes | LiteralOnly<AdditionalField["type"]>,
    & FieldProperties
    & {
      [K in LiteralOnly<AdditionalField["type"]>]: AdditionalField;
    }
  > {
    this.fields.set(
      name,
      field as unknown as FieldDefinition<
        Field<
          FieldTypes,
          FieldProperties[FieldTypes],
          FieldTypes,
          FieldProperties
        >
      >,
    );
    return this as unknown as Cms<
      FieldTypes | LiteralOnly<AdditionalField["type"]>,
      & FieldProperties
      & {
        [K in LiteralOnly<AdditionalField["type"]>]: AdditionalField;
      }
    >;
  }

  /** Use a plugin */
  use<
    AdditionalFieldTypes extends string,
    AdditionalFieldProperties extends FieldPropertyMap<AdditionalFieldTypes>,
  >(
    plugin: (c: Cms<FieldTypes, FieldProperties>) => Cms<
      FieldTypes | AdditionalFieldTypes,
      FieldProperties & AdditionalFieldProperties
    >,
  ): Cms<
    FieldTypes | AdditionalFieldTypes,
    FieldProperties & AdditionalFieldProperties
  >;
  use(plugin: (c: Cms<FieldTypes, FieldProperties>) => void): this;
  use<
    AdditionalFieldTypes extends string,
    AdditionalFieldProperties extends FieldPropertyMap<AdditionalFieldTypes>,
  >(
    plugin: (c: Cms<FieldTypes, FieldProperties>) =>
      | Cms<
        FieldTypes | AdditionalFieldTypes,
        FieldProperties & AdditionalFieldProperties
      >
      | void,
  ):
    | Cms<
      FieldTypes | AdditionalFieldTypes,
      FieldProperties & AdditionalFieldProperties
    >
    | this {
    const result = plugin(this);
    if (result instanceof Cms) {
      return result;
    }
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
    fields: FieldArray<FieldTypes, FieldProperties>,
    content: CMSContent,
  ): ResolvedField<
    Field<FieldTypes, FieldProperties[FieldTypes], FieldTypes, FieldProperties>
  >[] {
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
            type: type.slice(0, -1) as LiteralOnly<FieldTypes>,
            attributes: { required: true },
          };
        } else {
          return {
            name,
            type: (type ?? "text") as LiteralOnly<FieldTypes>,
          };
        }
      })
      .map((field): ResolvedField<
        Field<
          FieldTypes,
          FieldProperties[FieldTypes],
          FieldTypes,
          FieldProperties
        >
      > => {
        const type = this.fields.get(field.type);

        if (!type) {
          throw new Error(`Unknown field of type "${field.type}"`);
        }

        const {
          label = labelify(field.name),
          fields: nestedFields,
          ...remainingProperties
        } = field as {
          label?: string;
          fields?: FieldArray<FieldTypes, FieldProperties>;
        };

        const resolvedField = {
          tag: type.tag,
          label,
          applyChanges: type.applyChanges,
          fields: nestedFields,
          ...remainingProperties,
        } as ResolvedField<
          Field<
            FieldTypes,
            FieldProperties[FieldTypes],
            FieldTypes,
            FieldProperties
          >
        >;

        if (type.init) {
          type.init(resolvedField, content);
        }
        if (nestedFields) {
          resolvedField.fields = this.#resolveFields(
            nestedFields,
            content,
          ) as typeof resolvedField.fields;
        }

        return resolvedField;
      });
  }
}
