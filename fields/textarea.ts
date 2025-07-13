import { applyTextChanges } from "./utils.ts";
import type { FieldDefinition, InputField, ResolvedField } from "../types.ts";

/** Field for textarea values */
interface TextareaField extends InputField<ResolvedTextareaField, Attributes> {
  type: "textarea";
  value?: string;
}

interface Attributes {
  /** The max length allowed for the value */
  maxlength?: number;

  /** The min length allowed for the value */
  minlength?: number;
}

interface ResolvedTextareaField extends TextareaField, ResolvedField {
}

export default {
  tag: "f-textarea",
  jsImport: "lume_cms/components/f-textarea.js",
  applyChanges: applyTextChanges,
} as FieldDefinition<ResolvedTextareaField>;

declare global {
  namespace Lume.CMS {
    export interface Fields {
      textarea: TextareaField;
    }
    export interface ResolvedFields {
      textarea: ResolvedTextareaField;
    }
  }
}
