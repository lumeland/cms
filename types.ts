// deno-lint-ignore-file no-explicit-any
import type Collection from "./core/collection.ts";
import type Document from "./core/document.ts";
import type Upload from "./core/upload.ts";
import { FieldKeys } from "./fields/core.ts";

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

export interface Versioning extends AsyncIterable<Version> {
  current(): Promise<Version>;
  create(id: string): Promise<void>;
  change(id: string): Promise<void>;
  publish(id: string): Promise<void>;
  delete(id: string): Promise<void>;
}

/** A transformer to convert from/to Data */
export interface Transformer<T> {
  toData(content: T): Data | Promise<Data>;
  fromData(data: Data): T | Promise<T>;
}

type Prettify<T> =
  & {
    [K in keyof T]: T[K];
  }
  & {};

type UnionToIntersection<U> = (U extends any ? (x: U) => void : never) extends
  ((x: infer I) => void) ? I : never;

type Option = string | { value: string | number; label: string };

type FieldTypes = FieldKeys | (string & Record<never, never>);
type FieldString = `${string}:${"" | " "}${FieldTypes}${"" | "!"}`;

type UniqueFieldOptionMap = Prettify<
  Pick<
    { [key in FieldKeys]: {} } & {
      "checkbox": {
        value?: boolean;
      };
      "choose-list": {
        fields?: Field[];
      };
      "file": {
        /** @deprecated. Use `upload` instead */
        uploads?: string;
        upload?: string | false;
        publicPath?: string;
      };
      "list": {
        options?: Option[];
      };
      "markdown": {
        /** @deprecated. Use `upload` instead */
        uploads?: string;
        upload?: string | string[] | false;
      };
      "object": {
        fields?: Field[];
      };
      "object-list": {
        fields?: Field[];
      };
      "radio": {
        options?: Option[];
      };
      "select": {
        options?: Option[];
      };
    },
    FieldKeys
  >
>;

type SelectFieldOptionMap = Prettify<
  {
    "choose-list": "name" | "label" | "description";
    "hidden": "name" | "value";
    "list": "name" | "label" | "description";
    "object": "name" | "label" | "description";
    "object-list": "name" | "label" | "description";
  }
>;

interface CommonFieldOptions {
  name: string;
  label?: string;
  description?: string;
  value?: unknown;
  view?: string;
  attributes?: {
    required?: boolean;
    min?: number;
    max?: number;
    step?: number;
    maxlength?: number;
    pattern?: string;
    [key: string]: unknown;
  };
  init?: (field: ResolvedField, content: CMSContent) => void | Promise<void>;
  transform?(value: any, field: ResolvedField): any;
}

type BaseFieldOptions<K extends FieldKeys> = Prettify<
  & {
    type: K;
  }
  & (K extends keyof SelectFieldOptionMap
    ? Pick<CommonFieldOptions, SelectFieldOptionMap[K]>
    : CommonFieldOptions)
  & UniqueFieldOptionMap[K]
>;

type CustomFieldOptions = Prettify<
  & {
    type: string & Record<never, never>;
    //                ^ Typescript hack to suggest the correct keys but allow any string
    //                  https://x.com/diegohaz/status/1524257274012876801
    [key: string]: unknown;
  }
  & CommonFieldOptions
>;

type UniqueFieldOptions = Prettify<
  | {
    [K in keyof UniqueFieldOptionMap]: BaseFieldOptions<K>;
  }[keyof UniqueFieldOptionMap]
  | CustomFieldOptions
>;

export type Field = FieldString | UniqueFieldOptions;

export type MergedField = Prettify<
  & { type: UniqueFieldOptions["type"] }
  & CommonFieldOptions
  & UnionToIntersection<UniqueFieldOptionMap[keyof UniqueFieldOptionMap]>
>;

export type ResolvedField = Prettify<
  Omit<MergedField, "fields"> & {
    tag: string;
    label: string;
    fields?: ResolvedField[];
    details?: Record<string, any>;
    applyChanges(
      data: Data,
      changes: Data,
      field: ResolvedField,
      document: Document,
      content: CMSContent,
    ): void | Promise<void>;
  }
>;

export interface FieldType {
  tag: string;
  jsImport: string;
  init?: (field: ResolvedField, content: CMSContent) => void;
  applyChanges(
    data: Data,
    changes: Data,
    field: ResolvedField,
    document: Document,
    content: CMSContent,
  ): void | Promise<void>;
}

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
