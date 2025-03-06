// deno-lint-ignore-file no-explicit-any
import type Collection from "./core/collection.ts";
import type Document from "./core/document.ts";
import type Upload from "./core/upload.ts";

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
export type LiteralOnly<T> = T extends string ? (string extends T ? never : T)
  : never;

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

export type FieldPropertyMap<FieldTypes extends string> = {
  [K in FieldTypes]: {
    name: string;
  };
};

export type BaseField<
  FieldType extends string,
  FieldProperties extends { name: string },
> =
  & { type: FieldType; name: string }
  & {
    init?(
      field: ResolvedField<
        BaseField<
          FieldType,
          FieldProperties
        >
      >,
      content: CMSContent,
    ): void | Promise<void>;
    transform?(
      value: any,
      field: ResolvedField<
        BaseField<
          FieldType,
          FieldProperties
        >
      >,
    ): any;
  }
  & FieldProperties;

export type Field<
  FieldType extends string,
  FieldProperties extends { name: string },
  AllFieldTypes extends string,
  AllFieldProperties extends FieldPropertyMap<AllFieldTypes>,
> =
  & {
    type: FieldType;
  }
  & BaseField<
    FieldType,
    & Omit<FieldProperties, "fields">
    & ("fields" extends keyof FieldProperties
      ? FieldProperties["fields"] extends boolean ? {
          fields?: FieldArray<AllFieldTypes, AllFieldProperties>;
        }
      : {}
      : {})
  >;

/**
 * Represents the options for a field (both built in and custom).
 */
export type FieldUnion<
  FieldTypes extends string,
  FieldProperties extends FieldPropertyMap<FieldTypes>,
> = {
  [K in LiteralOnly<FieldTypes>]: Field<
    K,
    FieldProperties[K],
    LiteralOnly<FieldTypes>,
    FieldProperties
  >;
}[LiteralOnly<FieldTypes>];

/**
 * Matches a string of form `/^.*:\s?.*!?$/` where the first part is the field name and the second part is the field type.
 */
export type FieldString<FieldType extends string> = `${string}:${
  | ""
  | " "}${FieldType}${
  | ""
  | "!"}`;

export type FieldArray<
  FieldType extends string,
  FieldProperties extends FieldPropertyMap<FieldType>,
> = (FieldUnion<FieldType, FieldProperties> | FieldString<string>)[];

export type ResolvedField<
  Field extends BaseField<string, { name: string }>,
> =
  & Omit<Field, "fields">
  & {
    tag: string;
    label: string;
    fields?: ResolvedField<Field>[];
    details?: Record<string, any>;
    applyChanges(
      data: Data,
      changes: Data,
      field: ResolvedField<Field>,
      document: Document,
      content: CMSContent,
    ): void | Promise<void>;
  };

export type FieldDefinition<
  Field extends BaseField<string, { name: string }>,
> = {
  tag: string;
  jsImport: string;
  init?(
    field: ResolvedField<Field>,
    content: CMSContent,
  ): void;
  applyChanges(
    data: Data,
    changes: Data,
    field: ResolvedField<Field>,
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
