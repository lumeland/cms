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

/**
 * This utility type is useful when you want to see the full expanded type
 * rather than type references in tooltips/intellisense.
 *
 * @typeParam T - The type to prettify
 *
 * @example
 * ```typescript
 * type Foo = { a: number } & { b: string };
 * type PrettyFoo = Prettify<Foo>; // { a: number, b: string }
 * ```
 */
type Prettify<T> =
  & {
    [K in keyof T]: T[K];
  }
  & {};

/**
 * Converts a union type to an intersection type.
 *
 * @template U - The union type to convert
 * @returns An intersection of all types in the union
 *
 * @example
 * type Union = { a: string } | { b: number };
 * type Result = UnionToIntersection<Union>; // { a: string } & { b: number }
 *
 * @remarks
 * This uses conditional types and function parameter inference to achieve the conversion.
 * The resulting type will contain all members from each type in the union.
 */
type UnionToIntersection<U> = (U extends any ? (x: U) => void : never) extends
  ((x: infer I) => void) ? I : never;

type Option = string | { value: string | number; label: string };
type FieldTypes = FieldKeys | (string & Record<never, never>);

/**
 * Matches a string of form `/^.*:\s?.*!?$/` where the first part is the field name and the second part is the field type.
 */
type FieldString = `${string}:${"" | " "}${FieldTypes}${"" | "!"}`;

/**
 * Maps the field type to its unique options
 */
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

/**
 * Maps the field type to a subset of options if it has one
 */
type FieldOptionPropertySelectionMap = Prettify<
  {
    "choose-list": "name" | "label" | "description" | "view";
    "hidden": "name" | "value";
    "list": "name" | "label" | "description" | "view";
    "object": "name" | "label" | "description" | "view";
    "object-list": "name" | "label" | "description" | "view";
  }
>;

/**
 * Represents common field options shared by all field types.
 */
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

/**
 * Creates the field options for one of the built-in field types with type `K`.
 */
type BuiltInFieldOptions<K extends FieldKeys> = Prettify<
  & {
    type: K;
  }
  & (K extends keyof FieldOptionPropertySelectionMap
    ? Pick<CommonFieldOptions, FieldOptionPropertySelectionMap[K]>
    : CommonFieldOptions)
  & UniqueFieldOptionMap[K]
>;

/**
 * Represents the options for a custom field type.
 */
type CustomFieldOptions = Prettify<
  & {
    type: string & Record<never, never>;
    //                ^ Typescript hack to suggest the correct keys but allow any string
    //                  https://x.com/diegohaz/status/1524257274012876801
    [key: string]: unknown;
  }
  & CommonFieldOptions
>;

/**
 * Represents the options for a field (both built in and custom).
 */
type FieldOptions = Prettify<
  | {
    [K in keyof UniqueFieldOptionMap]: BuiltInFieldOptions<K>;
  }[keyof UniqueFieldOptionMap]
  | CustomFieldOptions
>;

/**
 * Represents a field in a collection both as an option object and as a string.
 */
export type Field = FieldString | FieldOptions;

/**
 * Combines all possible field options into a single type. (This is equivalent to the previous Field type)
 */
export type MergedField = Prettify<
  & { type: FieldOptions["type"] }
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
