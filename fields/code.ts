import { applyTextChanges } from "./utils.ts";
import type { FieldDefinition, InputField, ResolvedField } from "../types.ts";

/** Field for code values */
interface CodeField extends InputField<ResolvedCodeField> {
  type: "code";
  value?: string;
}
interface ResolvedCodeField extends CodeField, ResolvedField {
}

export default {
  tag: "f-code",
  jsImport: "lume_cms/components/f-code.js",
  applyChanges: applyTextChanges,
} as FieldDefinition<ResolvedCodeField, CodeField>;

declare global {
  namespace Lume.CMS {
    export interface Fields {
      code: CodeField;
    }
    export interface ResolvedFields {
      code: ResolvedCodeField;
    }
  }
}
