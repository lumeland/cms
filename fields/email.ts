import { applyTextChanges } from "./utils.ts";
import type {
  FieldDefinition,
  InputField,
  Option,
  ResolvedField,
} from "../types.ts";

/** Field for email values */
interface EmailField extends InputField<ResolvedEmailField> {
  type: "email";
  value?: string;

  /** A list of predefined values to suggest to the user. */
  options?: Option[];
}

interface ResolvedEmailField extends EmailField, ResolvedField {
}

export default {
  tag: "f-email",
  jsImport: "lume_cms/components/f-email.js",
  applyChanges: applyTextChanges,
} as FieldDefinition<ResolvedEmailField>;

declare global {
  namespace Lume.CMS {
    export interface Fields {
      email: EmailField;
    }
    export interface ResolvedFields {
      email: ResolvedEmailField;
    }
  }
}
