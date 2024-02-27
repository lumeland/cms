// deno-lint-ignore-file no-explicit-any
import type Collection from "./core/collection.ts";
import type Document from "./core/document.ts";

/** Generic data to store */
export type Data = Record<string, unknown>;

export interface EntryMetadata {
  name: string;
  src: string;
}

export interface SiteInfo {
  name: string;
  description?: string;
  url?: string;
}

/** A storage mechanism for data */
export interface Storage extends AsyncIterable<EntryMetadata> {
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

/** The schema for a field */
export interface Field {
  type: string;
  name: string;
  value?: unknown;
  fields?: (Field | string)[];
  label?: string;
  description?: string;
  options?: Option[];
  uploads?: string;
  publicPath?: string;
  attributes?: {
    required?: boolean;
    min?: number;
    max?: number;
    step?: number;
    maxlength?: number;
    pattern?: string;
    [key: string]: unknown;
  };
  toJSON?: (this: ResolvedField) => Record<string, unknown>;
  [key: string]: unknown;
}

export interface ResolvedField extends Field {
  tag: string;
  label: string;
  transformData?: (value: any, field: ResolvedField) => any | Promise<unknown>;
  fields?: ResolvedField[];
  cmsContent: CMSContent;
}

export interface FielType {
  tag: string;
  jsImport: string;
  transformData?: (value: any, field: ResolvedField) => any | Promise<unknown>;
  init?: (field: ResolvedField) => void;
}

type Option = string | { value: string | number; label: string };

export interface CMSContent {
  site: SiteInfo;
  collections: Record<string, Collection>;
  documents: Record<string, Document>;
  uploads: Record<string, [Storage, string]>;
  versioning?: Versioning;
  data?: Record<string, unknown>;
}
