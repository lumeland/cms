// deno-lint-ignore-file no-explicit-any
import type Collection from "./core/collection.ts";
import type Document from "./core/document.ts";
import type Upload from "./core/upload.ts";
import { FieldKeys } from "./fields/core.ts";

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
 * Utility type that extracts only literal string types from a given union type.
 *
 * @template T - The type to filter, which is typically a union of literal strings and broader string types.
 *
 * @example
 * // Given a union of a literal and a broad string type:
 * type Test = LiteralOnly<"hello" | string & Record<never, never>>;
 *
 * // Test resolves to "hello" because the broad string type is filtered out.
 */
type LiteralOnly<T> = T extends string ? (string extends T ? never : T) : never;

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

type Option = string | { value: string | number; label: string };

/**
 * The common options for all fields.
 */
type CommonFieldProperties =
  | "name"
  | "label"
  | "value"
  | "description"
  | "view"
  | "attributes"
  | "init"
  | "transform";

/**
 * Maps field types to the common properties to exclude.
 */
type FieldTypeToPropertyFilterMap = Prettify<
  & {
    [K in "choose-list" | "list" | "object" | "object-list"]:
      | "value"
      | "attributes";
  }
  & {
    "hidden":
      | "label"
      | "description"
      | "view"
      | "attributes";
  }
>;

/**
 * Maps field types to any additional properties they may have beyond the common ones.
 */
type FieldTypeToPropertyAdditionMap = Prettify<
  & {
    [K in "choose-list" | "object" | "object-list"]: "fields";
  }
  & {
    [K in "list" | "radio" | "select"]: "options";
  }
  & {
    "file": "uploads" | "upload" | "publicPath";
    "markdown": "uploads" | "upload";
  }
>;

/**
 * Maps the field type to a subset of options if it has one
 */
type FieldTypeToPropertySelectionMap = {
  [K in FieldKeys]:
    | (K extends keyof FieldTypeToPropertyFilterMap
      ? Exclude<CommonFieldProperties, FieldTypeToPropertyFilterMap[K]>
      : CommonFieldProperties)
    | (K extends keyof FieldTypeToPropertyAdditionMap
      ? FieldTypeToPropertyAdditionMap[K]
      : never);
};

/**
 * Represents common field options shared by all field types.
 */
interface BuiltInFieldProperties<AllFields extends string> {
  name: string;
  label?: string;
  description?: string;
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
  /** @deprecated. Use `upload` instead */
  uploads?: string;
  upload?: string | false;
  publicPath?: string;
  options?: Option[];
  fields?: FieldArray<AllFields>;
  init?(
    field: ResolvedField,
    content: CMSContent,
  ): void | Promise<void>;
  transform?(value: any, field: ResolvedField): any;
}

/**
 * Contains the mapping of field types to the type of their value property.
 */
type FieldTypeToValueTypeMap = Prettify<
  & {
    [K in FieldKeys]:
      Extract<FieldTypeToPropertySelectionMap[K], "value"> extends never ? never
        : unknown;
  }
  & {
    [K in "text" | "textarea" | "email" | "url"]: string;
  }
  & {
    "checkbox": boolean;
    "number": number;
  }
>;

type FieldInternal<
  FieldType extends string,
  AllFields extends string,
> =
  & {
    readonly type: FieldType;
  }
  & (
    FieldType extends FieldKeys ?
        & (FieldTypeToValueTypeMap[FieldType] extends never ? {}
          : {
            value?: FieldTypeToValueTypeMap[FieldType];
          })
        & Pick<
          BuiltInFieldProperties<AllFields>,
          Exclude<FieldTypeToPropertySelectionMap[FieldType], "value">
        >
      :
        & {
          value?: unknown;
          [key: string]: unknown;
        }
        & Pick<
          BuiltInFieldProperties<AllFields>,
          Exclude<CommonFieldProperties, "value">
        >
  );

/**
 * Represents the options for a field (both built in and custom).
 */
export type Field<
  FieldType extends string,
  AllFields extends string,
> = LiteralOnly<FieldType> extends never ? never
  : {
    [K in LiteralOnly<FieldType>]: FieldInternal<K, AllFields>;
  }[LiteralOnly<FieldType>];

/**
 * Matches a string of form `/^.*:\s?.*!?$/` where the first part is the field name and the second part is the field type.
 */
export type FieldString<FieldType extends string> = `${string}:${
  | ""
  | " "}${FieldType}${
  | ""
  | "!"}`;

export type FieldArray<FieldType extends string> =
  (Field<FieldType, FieldKeys | FieldType> | FieldString<string>)[];

export type MergedField = Prettify<
  & {
    type: FieldKeys | string & Record<never, never>;
  }
  & BuiltInFieldProperties<string>
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
    [key: string]: unknown;
  }
>;

export interface FieldDefinition {
  tag: string;
  jsImport: string;
  init?(
    field: ResolvedField,
    content: CMSContent,
  ): void;
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
