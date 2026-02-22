import { applyTextChanges, toAbsolutePaths, toRelativePaths } from "./utils.ts";
import type {
  FieldDefinition,
  InputField,
  Option,
  ResolvedField,
} from "../types.ts";
import { getRelativePath } from "../core/utils/path.ts";
import { posix } from "../deps/std.ts";

/** Field for markdown values */
interface MarkdownField extends InputField<ResolvedMarkdownField> {
  type: "markdown";
  value?: string;

  /*
   * Name of the upload entity used to upload files or get files from.
   * If it's false, no uploads are used.
   */
  upload?: string | false;

  /**
   * Custom snippets to insert in the code.
   * The value can contain the {$} placeholder that will be replaced by the currently selected text.
   */
  snippets?: Option[];

  /**
   * Prefer to store the upload links as relative to the owner document.
   * @default false
   */
  relativePath?: boolean;
}

interface ResolvedMarkdownField extends MarkdownField, ResolvedField {
}

export default {
  tag: "f-markdown",
  jsImport: "lume_cms/components/f-markdown.js",
  init(field, cmsContent, data, document) {
    if (field.upload !== false) {
      field.upload ??= Object.keys(cmsContent.uploads)[0];
    }
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
      // Store the paths as relative
      data[field.name] = toRelativePaths(
        data[field.name],
        getRelativePath.bind(null, posix.dirname(document.source.path)),
      );
    }
  },
} as FieldDefinition<ResolvedMarkdownField>;

declare global {
  namespace Lume.CMS {
    export interface Fields {
      markdown: MarkdownField;
    }

    export interface ResolvedFields {
      markdown: ResolvedMarkdownField;
    }
  }
}
