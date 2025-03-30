import { applyTextChanges } from "./utils.ts";
import type { FieldDefinition, InputField, ResolvedField } from "../types.ts";

/** Field for color values */
interface ColorField extends InputField<ResolvedColorField> {
  type: "color";
  value?: string;
}
interface ResolvedColorField extends ColorField, ResolvedField {
}

export default {
  tag: "f-color",
  jsImport: "lume_cms/components/f-color.js",
  applyChanges: applyTextChanges,
} as FieldDefinition<ResolvedColorField>;

declare global {
  namespace Lume.CMS {
    export interface Fields {
      color: ColorField;
    }
    export interface ResolvedFields {
      color: ResolvedColorField;
    }
  }
}
