// deno-lint-ignore-file no-explicit-any
import type Collection from "./core/collection.ts";
import type Document from "./core/document.ts";
import type Upload from "./core/upload.ts";

/** Generic data to store */
export type Data = Record<string, unknown>;

export interface EntryMetadata {
  label: string;
  name: string;
  src: string;
}

export interface SiteInfo {
  name: string;
  description?: string;
  url?: string;
  body?: string;
}

/** A storage mechanism for data */
export interface Storage extends AsyncIterable<EntryMetadata> {
  name(name: string): string;
  get(name: string): Entry;
  directory(name: string): Storage;
  delete(name: string): Promise<void>;
  rename(name: string, newName: string): Promise<void>;
}

export interface Entry {
  src?: string;
  metadata: EntryMetadata;

  readData(): Promise<Data>;
  writeData(content: Data): Promise<void>;

  readFile(): Promise<File>;
  writeFile(content: File): Promise<void>;
}

export interface Version {
  name: string;
  isCurrent: boolean;
  isProduction: boolean;
}

export interface Versioning extends Iterable<Version> {
  current(): Version;
  create(id: string): void;
  change(id: string): void;
  publish(id: string): void;
  delete(id: string): void;
}

/** A transformer to convert from/to Data */
export interface Transformer<T> {
  toData(content: T): Data | Promise<Data>;
  fromData(data: Data): T | Promise<T>;
}

declare global {
  namespace Lume {
    export type StringField = `${string}:${" " | ""}${keyof FieldProperties}${
      | "!"
      | ""}`;
    export type Field<T extends keyof FieldProperties> = {
      [K in keyof FieldProperties]: FieldProperties[K] & {
        init?(
          field: ResolvedField<K>,
          content: CMSContent,
        ): void | Promise<void>;
        transform?(
          value: any,
          field: ResolvedField<K>,
        ): any;
      };
    }[T];
  }
}

export type ResolvedField<
  T extends keyof Lume.FieldProperties = keyof Lume.FieldProperties,
> =
  & Omit<Lume.FieldProperties[T], "fields">
  & {
    tag: string;
    label: string;
    fields?: ResolvedField[];
    details?: Record<string, any>;
    applyChanges(
      data: Data,
      changes: Data,
      field: ResolvedField<T>,
      document: Document,
      content: CMSContent,
    ): void | Promise<void>;
    init?(
      field: ResolvedField<T>,
      content: CMSContent,
    ): void | Promise<void>;
    transform?(
      value: any,
      field: ResolvedField<T>,
    ): any;
  };

export type FieldDefinition<T extends keyof Lume.FieldProperties> = {
  tag: string;
  jsImport: string;
  init?(
    field: ResolvedField<T>,
    content: CMSContent,
  ): void;
  applyChanges(
    data: Data,
    changes: Data,
    field: ResolvedField<T>,
    document: Document,
    content: CMSContent,
  ): void | Promise<void>;
};

export type Labelizer = (
  name: string,
  prev?: (name: string) => string,
) => string;

export interface CMSContent {
  basePath: string;
  auth: boolean;
  site: SiteInfo;
  collections: Record<string, Collection>;
  documents: Record<string, Document>;
  uploads: Record<string, Upload>;
  versioning?: Versioning;
  data: Record<string, any>;
}
