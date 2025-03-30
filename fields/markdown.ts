import { applyTextChanges } from "./utils.ts";
import type {
  FieldDefinition,
  InputField,
  Option,
  ResolvedField,
} from "../types.ts";

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
}

interface ResolvedMarkdownField extends MarkdownField, ResolvedField {
}

export default {
  tag: "f-markdown",
  jsImport: "lume_cms/components/f-markdown.js",
  init(field, cmsContent) {
    if (field.upload !== false) {
      field.upload ??= Object.keys(cmsContent.uploads)[0];
    }
  },
  applyChanges: applyTextChanges,
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
