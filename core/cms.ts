import Collection from "./collection.ts";
import Document from "./document.ts";
import Upload from "./upload.ts";
import FsStorage from "../storage/fs.ts";
import { normalizePath } from "./utils/path.ts";
import { Router } from "../deps/galo.ts";
import { basename, dirname } from "../deps/std.ts";
import Git, { Options as GitOptions } from "./git.ts";
import User from "./user.ts";

import type {
  AuthProvider,
  CMSContent,
  Data,
  Entry,
  FieldDefinition,
  Labelizer,
  PreviewUrl,
  SiteInfo,
  Storage,
  UserConfiguration,
} from "../types.ts";
import init from "./routes/main.ts";
import { Basic } from "../auth/Basic.ts";

export type SourcePath = (
  url: string,
  cms: CMSContent,
) => string | undefined | Promise<string | undefined>;

export interface CmsOptions {
  site: SiteInfo;
  root: string;
  basePath: string;
  auth?: AuthOptions;
  data: Record<string, unknown>;
  staticFolders?: Record<string, string>;
  extraHead?: string;
  previewUrl?: PreviewUrl;
  sourcePath?: SourcePath;
}

export interface AuthOptions {
  method: AuthProvider | "basic";
  users: Record<string, string | UserConfiguration>;
}

export interface RouterData {
  cms: CMSContent;
  lang: "en";
  render: (file: string, data?: Record<string, unknown>) => Promise<string>;
  sourcePath?: SourcePath;
  user: User;
}

type DocumentType = "object" | "object-list" | "choose";

const allowedTypes: DocumentType[] = [
  "object",
  "object-list",
  "choose",
];

export interface DocumentOptions {
  name: string;
  label?: string;
  description?: string;
  type?: DocumentType;
  store: string;
  fields?: Lume.CMS.Field[];
  previewUrl?: PreviewUrl;
  views?: string[] | ((data?: Data) => string[] | undefined);
  transform?: (
    data: Data,
    CmsContent: CMSContent,
    isNew: boolean,
  ) => void | Promise<void>;
  edit?: boolean;
}

export interface CollectionOptions {
  name: string;
  label?: string;
  description?: string;
  type?: DocumentType;
  store: string;
  fields?: Lume.CMS.Field[];
  previewUrl?: PreviewUrl;
  views?: string[] | ((data?: Data) => string[] | undefined);
  documentName?: string | ((changes: Data) => string | undefined);
  documentLabel?: Labelizer;
  transform?: (
    data: Data,
    CmsContent: CMSContent,
    isNew: boolean,
  ) => void | Promise<void>;
  create?: boolean;
  delete?: boolean;
  edit?: boolean;
  rename?: boolean | "auto";
}

export interface UploadOptions {
  name: string;
  label?: string;
  description?: string;
  store: string;
  publicPath?: string;
  documentLabel?: Labelizer;
  listed?: boolean;
  create?: boolean;
  delete?: boolean;
  edit?: boolean;
  rename?: boolean | "auto";
}

const defaults: Partial<CmsOptions> = {
  site: {},
  basePath: "/",
  data: {},
};

export default class Cms {
  fetch: (request: Request) => Response | Promise<Response>;
  options: CmsOptions;
  storages = new Map<string, Storage | string>();
  uploads = new Map<string, UploadOptions>();
  fields = new Map<string, FieldDefinition>();
  collections = new Map<string, CollectionOptions>();
  documents = new Map<string, DocumentOptions>();
  gitRepo: Git | undefined;
  authentication?: AuthProvider;

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
    this.gitRepo = new Git({
      ...options,
    });

    return this;
  }

  /** Setup the auth */
  auth(
    users: Record<string, string | UserConfiguration>,
    method: "basic" | AuthProvider = "basic",
  ): this {
    this.options.auth = {
      method,
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

  /** Start the CMS */
  init(): Router<RouterData> {
    const content: CMSContent = {
      basePath: this.options.basePath,
      site: this.options.site ?? {},
      data: this.options.data ?? {},
      git: this.gitRepo,
      collections: {},
      documents: {},
      uploads: {},
    };

    // Initialize uploads
    for (const entry of this.uploads.values()) {
      const {
        name,
        label,
        description,
        documentLabel,
        store,
        publicPath,
        listed,
      } = entry;

      content.uploads[name] = new Upload({
        name,
        label: label ?? name,
        description,
        documentLabel,
        storage: this.#getStorage(store),
        publicPath: publicPath ?? "/",
        listed: listed ?? true,
      });
    }

    // Initialize collections
    for (const entry of this.collections.values()) {
      const { name, label, store, fields, type, ...options } = entry;

      content.collections[name] = new Collection({
        storage: this.#getStorage(store),
        fields: fields ? this.#resolveFields(fields, content, type) : undefined,
        name,
        label: label ?? name,
        previewUrl: this.options.previewUrl,
        ...options,
      });
    }

    // Initialize documents
    for (const entry of this.documents.values()) {
      const { name, label, store, fields, type, ...options } = entry;

      content.documents[name] = new Document({
        entry: this.#getEntry(store),
        fields: fields ? this.#resolveFields(fields, content, type) : undefined,
        name,
        label: label ?? name,
        previewUrl: this.options.previewUrl,
        ...options,
      });
    }

    // JavaScript files to import
    const jsImports = new Set(
      this.fields.values().map((field) => field.jsImport),
    );

    // Authentication method
    const { auth } = this.options;
    const users = new Map<string, UserConfiguration>();
    let authMethod: AuthProvider | undefined;

    if (auth) {
      for (const [user, password] of Object.entries(auth.users)) {
        users.set(user, typeof password === "string" ? { password } : password);
      }
      authMethod = auth.method === "basic" ? new Basic() : auth.method;
    }

    return init({
      content,
      jsImports: Array.from(jsImports),
      basePath: this.options.basePath,
      extraHead: this.options.extraHead,
      staticFolders: this.options.staticFolders,
      sourcePath: this.options.sourcePath,
      users,
      authMethod,
    });
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
    type: DocumentType = "object",
  ): Lume.CMS.ResolvedField {
    if (!allowedTypes.includes(type)) {
      throw new Error(`Unknown document type "${type}"`);
    }
    const field = this.fields.get(type);
    if (!field) {
      throw new Error(`Field of type "${type}" was not found`);
    }

    return {
      name: "root",
      type: "object",
      tag: field.tag + "-root",
      applyChanges: field.applyChanges,
      init: field.init,
      fields: fields.map((field) => this.#resolveField(field, content)),
    } as Lume.CMS.ResolvedField;
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
      label: resolvedField.label ?? resolvedField.name,
      applyChanges: type.applyChanges,
      ...resolvedField,
    };

    if (resolvedField.fields) {
      resolvedField.fields = resolvedField.fields.map((field: Lume.CMS.Field) =>
        this.#resolveField(field, content)
      );
    }

    if (type.init) {
      const customInit = resolvedField.init;

      resolvedField.init = typeof customInit === "function"
        ? async (
          field: Lume.CMS.ResolvedField,
          content: CMSContent,
          data: Data,
        ) => {
          await type.init!(field, content);
          await customInit(field, content, data);
        }
        : type.init;
    }

    return resolvedField as Lume.CMS.ResolvedField;
  }
}
