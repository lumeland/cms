import { applyTextChanges } from "./utils.ts";
import type { FieldDefinition, FieldResolved } from "../types.ts";
import type { InputField, Option } from "./types.ts";

/** Field for text values */
interface TextField extends InputField<TextFieldResolved, Attributes> {
  type: "text";
  value?: string;

  /** A list of predefined values to suggest to the user. */
  options?: Option[];
}

interface Attributes {
  /** The max length allowed for the value */
  maxlength?: number;

  /** The min length allowed for the value */
  minlength?: number;

  /** Pattern to validate */
  pattern?: string;

  /** Used for the error message if the pattern doesn't match */
  title?: string;
}

interface TextFieldResolved extends TextField, FieldResolved {
}

export default {
  tag: "f-text",
  jsImport: "lume_cms/components/f-text.js",
  applyChanges: applyTextChanges,
} as FieldDefinition<TextFieldResolved>;

declare global {
  namespace Lume {
    export interface CMSFields {
      text: TextField;
    }
    export interface CMSResolvedFields {
      text: TextFieldResolved;
    }
  }
}
