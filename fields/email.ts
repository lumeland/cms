import { applyTextChanges } from "./utils.ts";
import type { FieldDefinition, FieldResolved } from "../types.ts";
import type { InputField, Option } from "./types.ts";

/** Field for email values */
interface EmailField extends InputField<EmailFieldResolved> {
  type: "email";
  value?: string;

  /** A list of predefined values to suggest to the user. */
  options?: Option[];
}

interface EmailFieldResolved extends EmailField, FieldResolved {
}

export default {
  tag: "f-email",
  jsImport: "lume_cms/components/f-email.js",
  applyChanges: applyTextChanges,
} as FieldDefinition<EmailFieldResolved>;

declare global {
  namespace Lume {
    export interface CMSFields {
      email: EmailField;
    }
    export interface CMSResolvedFields {
      email: EmailFieldResolved;
    }
  }
}
