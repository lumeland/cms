// deno-lint-ignore-file no-explicit-any
import type Collection from "./core/collection.ts";
import type Document from "./core/document.ts";
import type Upload from "./core/upload.ts";
import type {
  CmsOptions,
  CollectionOptions,
  DocumentOptions,
  UploadOptions,
} from "./core/cms.ts";
import type { Options as GitOptions } from "./core/git.ts";

/** Generic data to store */
export type Data = Record<string, unknown>;

export interface EntrySource {
  name: string;
  path: string;
  src: string;
}

export type EntryMetadata = EntrySource & DocumentLabel;

export interface SiteInfo {
  name?: string;
  description?: string;
  url?: string;
  body?: string;
}

/** A storage mechanism for data */
export interface Storage extends AsyncIterable<EntrySource> {
  name(name: string): string;
  get(name: string): Entry;
  source(name: string): EntrySource;
  directory(name: string): Storage;
  delete(name: string): Promise<void>;
  rename(name: string, newName: string): Promise<void>;
}

export interface Entry {
  source: EntrySource;

  readData(): Promise<Data>;
  writeData(content: Data): Promise<void>;

  readText(): Promise<string>;
  writeText(content: string): Promise<void>;

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

export interface Field<T extends ResolvedField = ResolvedField, V = unknown> {
  /** The name of the field */
  name: string;

  /** The type of the field */
  type: string;

  /** Default value when a new document is created */
  value?: V;

  /** Function to execute on init the field  */
  init?(
    field: T,
    content: CMSContent,
    data?: Data,
  ): void | Promise<void>;

  /** Function to transform the value before saved */
  transform?(value: any): any;
}

export interface ResolvedField {
  /** View name in which this field is visible */
  view?: string;

  /** Function to apply the changes in the data object */
  applyChanges<T = this>(
    data: Data,
    changes: Data,
    field: T,
    document: Document,
    content: CMSContent,
  ): void | Promise<void>;
}

/** A field definition to be used by the CMS */
export type FieldDefinition<
  T extends ResolvedField & Field = ResolvedField & Field,
> = {
  /** The tagName used in the HTML for the custom element */
  tag: string;

  /** The JavaScript import path for the custom element */
  jsImport: string;

  /** Function to execute on init the field definition  */
  init?(
    field: T,
    content: CMSContent,
  ): void | Promise<void>;

  /** Function to apply the changes in the data object */
  applyChanges(
    data: Data,
    changes: Data,
    field: T,
    document: Document,
    content: CMSContent,
  ): void | Promise<void>;

  transform?(value: T["value"]): T["value"] | unknown;
};

/** Option item for a select or datalist */
export type Option<T = string | number> = T | { value: T; label: string };

export interface ResolvedGroupField extends ResolvedField {
  /** The fields that belong to this group */
  fields: Lume.CMS.ResolvedField[];
}

/** A function to generate a preview URL for a file */
export type PreviewURL = (
  file: string,
  cms: CMSContent,
  changed?: boolean,
) => undefined | string | Promise<string | undefined>;

/** Field visible in the UI */
export interface UIField<T extends ResolvedField = ResolvedField>
  extends Field<T> {
  /** The visible name in the UI. If it's not defined, the name option will be used. */
  label?: string;

  /** An optional description visible next to the label in the UI. */
  description?: string;

  /** View name in which this field is visible */
  view?: string;

  /** CSS selector to highlight the element in the preview panel */
  cssSelector?: string;
}

/** Field for input values */
export interface InputField<
  T extends ResolvedField = ResolvedField,
  A = Record<string, unknown>,
> extends UIField<T> {
  attributes?: Prettify<InputAttributes & A>;
}

/** Field for groups */
export interface GroupField<T extends ResolvedField = ResolvedField>
  extends UIField<T> {
  /** The fields that belong to this group */
  fields: Lume.CMS.Field[];
}

/** Common attributes for inputs */
export interface InputAttributes {
  /** Whether the value is required or not */
  required?: boolean;

  /** The placeholder text */
  placeholder?: string;

  /** If it's true, the value can't be edited by the user */
  readonly?: boolean;

  [key: string]: unknown;
}

/** Pretty */
type Prettify<T> =
  & {
    [K in keyof T]: T[K];
  }
  // deno-lint-ignore ban-types
  & {};

export interface DocumentLabel {
  label: string;
  icon?: string;
  flags?: Record<string, any>;
}

export type Labelizer = (name: string) => string | DocumentLabel;

export interface CMSContent {
  basePath: string;
  site: SiteInfo;
  collections: Record<string, Collection>;
  documents: Record<string, Document>;
  uploads: Record<string, Upload>;
  versioning?: Versioning;
  data: Record<string, any>;
}

export interface UserConfiguration {
  password: string;
  name?: string;
  permissions?: Permission[];
}

export interface Permission {
  subject: string;
  create?: boolean;
  delete?: boolean;
  edit?: boolean;
  rename?: boolean;
}

declare global {
  namespace Lume.CMS {
    type FieldStrings = `${string}:${" " | ""}${keyof Fields}${
      | "!"
      | ""}`;
    export type Field =
      | Fields[keyof Fields]
      | ParentFields[keyof ParentFields]
      | FieldStrings;
    export type ResolvedField = ResolvedFields[keyof ResolvedFields];

    export type {
      CmsOptions,
      CollectionOptions,
      DocumentOptions,
      GitOptions,
      UploadOptions,
    };
  }
}
