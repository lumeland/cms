import { applyTextChanges } from "./utils.ts";
import type {
  FieldDefinition,
  InputField,
  Option,
  ResolvedField,
} from "../types.ts";

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
   * Custom snippets to insert in the code.
   * The value can contain the {$} placeholder that will be replaced by the currently selected text.
   */
  snippets?: Option[];
}

interface ResolvedRichTextField extends RichTextField, ResolvedField {
}

export default {
  tag: "f-rich-text",
  jsImport: "lume_cms/components/f-rich-text.js",
  init(field, cmsContent) {
    if (field.upload !== false) {
      field.upload ??= Object.keys(cmsContent.uploads)[0];
    }
  },
  applyChanges: applyTextChanges,
} as FieldDefinition<ResolvedRichTextField>;

declare global {
  namespace Lume.CMS {
    export interface Fields {
      richText: RichTextField;
    }

    export interface ResolvedFields {
      richText: ResolvedRichTextField;
    }
  }
}
