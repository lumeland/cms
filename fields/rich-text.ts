import { applyTextChanges, toAbsolutePaths, toRelativePaths } from "./utils.ts";
import type { FieldDefinition, InputField, ResolvedField } from "../types.ts";
import { getRelativePath } from "../core/utils/path.ts";
import { posix } from "../deps/std.ts";

/** Field for rich text values */
interface RichTextField extends InputField<ResolvedRichTextField> {
  type: "rich-text";
  value?: string;

  /*
   * Name of the upload entity used to upload files or get files from.
   * If it's false, no uploads are used.
   */
  upload?: string | false;

  /**
   * Prefer to store the upload links as relative to the owner document.
   * @default false
   */
  relativePath?: boolean;
}

interface ResolvedRichTextField extends RichTextField, ResolvedField {
}

export default {
  tag: "f-rich-text",
  jsImport: "lume_cms/components/f-rich-text.js",
  init(field, _cmsContent, data, document) {
    if (field.relativePath && data && document) {
      // Convert back to absolute paths
      data[field.name] = toAbsolutePaths(
        data[field.name], 
        posix.join.bind(posix, posix.dirname(document.source.path)),
      );
    }
  },
  applyChanges(data, changes, field, document) {
    applyTextChanges(data, changes, field);
    if (field.relativePath && data[field.name]) {
      // Store paths as relative
      data[field.name] = toRelativePaths(
        data[field.name],
        getRelativePath.bind(null, posix.dirname(document.source.path)),
      );
    }
  },
} as FieldDefinition<ResolvedRichTextField>;

declare global {
  namespace Lume.CMS {
    export interface Fields {
      "rich-text": RichTextField;
    }

    export interface ResolvedFields {
      "rich-text": ResolvedRichTextField;
    }
  }
}
