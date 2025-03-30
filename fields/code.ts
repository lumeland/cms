import { applyTextChanges } from "./utils.ts";
import type { FieldDefinition, FieldResolved } from "../types.ts";
import type { InputField } from "./types.ts";

/** Field for code values */
interface CodeField extends InputField<CodeFieldResolved> {
  type: "code";
  value?: string;
}
interface CodeFieldResolved extends CodeField, FieldResolved {
}

export default {
  tag: "f-code",
  jsImport: "lume_cms/components/f-code.js",
  applyChanges: applyTextChanges,
} as FieldDefinition<CodeFieldResolved>;

declare global {
  namespace Lume {
    export interface CMSFields {
      code: CodeField;
    }
    export interface CMSResolvedFields {
      code: CodeFieldResolved;
    }
  }
}
