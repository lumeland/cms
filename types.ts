// deno-lint-ignore-file no-explicit-any
import type Collection from "./core/collection.ts";
import type Document from "./core/document.ts";
import type Upload from "./core/upload.ts";
import { FieldKeys } from "./fields/core.ts";

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

/** The schema for a field */
export interface Field {
  type: FieldKeys | (string & Record<never, never>);
  //                ^ Typescript hack to suggest the correct keys but allow any string
  //                  https://x.com/diegohaz/status/1524257274012876801
  name: string;
  value?: unknown;
  fields?: (Field | string)[];
  label?: string;
  description?: string;
  options?: Option[];
  uploads?: string;
  publicPath?: string;
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
  [key: string]: unknown;
}

export interface ResolvedField extends Field {
  tag: string;
  label: string;
  fields?: ResolvedField[];
  details?: Record<string, any>;
  applyChanges(
    data: Data,
    changes: Data,
    field: ResolvedField,
    content: CMSContent,
  ): void | Promise<void>;
}

export interface FieldType {
  tag: string;
  jsImport: string;
  init?: (field: ResolvedField, content: CMSContent) => void;
  applyChanges(
    data: Data,
    changes: Data,
    field: ResolvedField,
    content: CMSContent,
  ): void | Promise<void>;
}

type Option = string | { value: string | number; label: string };

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
