import { applyTextChanges } from "./utils.ts";
import type {
  FieldDefinition,
  InputField,
  Option,
  ResolvedField,
} from "../types.ts";

/** Field for text values */
interface TextField extends InputField<ResolvedTextField, Attributes> {
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

interface ResolvedTextField extends TextField, ResolvedField {
}

export default {
  tag: "f-text",
  jsImport: "lume_cms/components/f-text.js",
  applyChanges: applyTextChanges,
} as FieldDefinition<ResolvedTextField>;

declare global {
  namespace Lume.CMS {
    export interface Fields {
      text: TextField;
    }
    export interface ResolvedFields {
      text: ResolvedTextField;
    }
  }
}
