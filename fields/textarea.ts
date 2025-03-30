import { applyTextChanges } from "./utils.ts";
import type { FieldDefinition, FieldResolved } from "../types.ts";
import type { InputField } from "./types.ts";

/** Field for textarea values */
interface TextareaField extends InputField<TextareaFieldResolved, Attributes> {
  type: "textarea";
  value?: string;
}

interface Attributes {
  /** The max length allowed for the value */
  maxlength?: number;

  /** The min length allowed for the value */
  minlength?: number;
}

interface TextareaFieldResolved extends TextareaField, FieldResolved {
}

export default {
  tag: "f-textarea",
  jsImport: "lume_cms/components/f-textarea.js",
  applyChanges: applyTextChanges,
} as FieldDefinition<TextareaFieldResolved>;

declare global {
  namespace Lume {
    export interface CMSFields {
      textarea: TextareaField;
    }
    export interface CMSResolvedFields {
      textarea: TextareaFieldResolved;
    }
  }
}
