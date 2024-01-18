// deno-lint-ignore-file no-explicit-any
import type Collection from "./collection.ts";
import type Document from "./document.ts";

/** Generic data to store */
export type Data = Record<string, unknown>;

/** A storage mechanism for data */
export interface Storage extends AsyncIterable<string> {
  get(id: string): Entry;
  directory(id: string): Storage;
  delete(id: string): Promise<void>;
  rename(id: string, newId: string): Promise<void>;
}

export interface Entry {
  src?: string;

  readData(): Promise<Data>;
  writeData(content: Data): Promise<void>;

  readFile(): Promise<File>;
  writeFile(content: File): Promise<void>;
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
}

type Option = string | { value: string | number; label: string };

export interface CMSContent {
  collections: Record<string, Collection>;
  documents: Record<string, Document>;
  uploads: Record<string, Storage>;
  previewUrl: (path: string) => Promise<string | undefined>;
}
