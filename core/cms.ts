import { render } from "../deps/vento.ts";
import { getCurrentVersion } from "./utils/env.ts";
import documentRoute from "./routes/document.ts";
import collectionRoute from "./routes/collection.ts";
import versionsRoute from "./routes/versions.ts";
import indexRoute from "./routes/index.ts";
import filesRoute from "./routes/files.ts";
import Collection from "./collection.ts";
import Document from "./document.ts";
import Upload from "./upload.ts";
import FsStorage from "../storage/fs.ts";
import { asset, getPath, normalizePath } from "./utils/path.ts";
import { Router } from "../deps/galo.ts";
import { basename, dirname, fromFileUrl } from "../deps/std.ts";
import { filter } from "../deps/vento.ts";
import { labelify } from "./utils/string.ts";
import { checkBasicAuthorization } from "./utils/auth.ts";
import { Git, Options as GitOptions } from "./git.ts";

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

type PreviewURL = (
  file: string,
  changed?: boolean,
) => undefined | string | Promise<string | undefined>;

type SourcePath = (
  url: string,
) => string | undefined | Promise<string | undefined>;

export interface CmsOptions {
  site?: SiteInfo;
  root: string;
  basePath: string;
  auth?: AuthOptions;
  data?: Record<string, unknown>;
  extraHead?: string;
  previewURL?: PreviewURL;
  sourcePath?: SourcePath;
}

export interface AuthOptions {
  method: "basic";
  users: Record<string, string>;
}

export interface RouterData {
  cms: CMSContent;
  render: (file: string, data?: Record<string, unknown>) => Promise<string>;
  previewURL?: PreviewURL;
  sourcePath?: SourcePath;
  user?: string;
}

interface DocumentOptions {
  name: string;
  label?: string;
  description?: string;
  store: string;
  fields: Lume.CMS.Field[];
  url?: string;
  views?: string[] | ((data?: Data) => string[] | undefined);
  edit?: boolean;
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
  edit?: boolean;
  rename?: boolean | "auto";
}

interface UploadOptions {
  name: string;
  label?: string;
  description?: string;
  store: string;
  publicPath?: string;
  listed?: boolean;
  create?: boolean;
  delete?: boolean;
  edit?: boolean;
  rename?: boolean | "auto";
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
  init(): Router<{ cms: CMSContent }> {
    const content = this.initContent();

    for (const type of this.fields.values()) {
      this.#jsImports.add(type.jsImport);
    }

    filter("path", (args: string[]) => getPath(this.options.basePath, ...args));
    filter("asset", (url: string) => asset(this.options.basePath, url));

    const app = new Router<RouterData>({
      cms: content,
      previewURL: this.options.previewURL,
      sourcePath: this.options.sourcePath,
      render: (file: string, data?: Record<string, unknown>) =>
        render(file, {
          ...data,
          jsImports: Array.from(this.#jsImports),
          extraHead: this.options.extraHead,
          cmsVersion: getCurrentVersion(),
        }),
    });

    const { basePath } = this.options;

    app.get(`${basePath}/logout`, () =>
      new Response("Unauthorized", {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="Secure Area"',
        },
      }))
      .path(`${basePath}/*`, ({ request, next, _ }) => {
        // Basic authentication
        let user: string | undefined;
        if (this.options.auth && _.join("/") !== "logout") {
          const authorization = request.headers.get("authorization") ??
            undefined;
          user = authorization && checkBasicAuthorization(
            authorization,
            this.options.auth.users,
          );
          if (!user) {
            return new Response("Unauthorized", {
              status: 401,
              headers: {
                "WWW-Authenticate": 'Basic realm="Secure Area"',
              },
            });
          }
        }

        return next<{ user?: string }>({ user })
          .path("/", indexRoute)
          .path("/document/*", documentRoute)
          .path("/collection/*", collectionRoute)
          .path("/uploads/*", filesRoute)
          .path("/versions/*", versionsRoute)
          .get("/logout", () =>
            new Response("Logged out", {
              status: 401,
              headers: {
                "WWW-Authenticate": 'Basic realm="Secure Area"',
              },
            }));
      });

    // Serve static files from local directory
    const root = import.meta.resolve("../static/");

    if (root.startsWith("file:")) {
      app.staticFiles(`${basePath}/*`, fromFileUrl(root));
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
