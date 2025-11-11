import { applyTextChanges } from "./utils.ts";
import type {
  FieldDefinition,
  InputField,
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
}

interface ResolvedRichTextField extends RichTextField, ResolvedField {
}

export default {
  tag: "f-rich-text",
  jsImport: "lume_cms/components/f-rich-text.js",
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
