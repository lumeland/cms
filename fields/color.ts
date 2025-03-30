import { applyTextChanges } from "./utils.ts";
import type { FieldDefinition, FieldResolved } from "../types.ts";
import type { InputField } from "./types.ts";

/** Field for color values */
interface ColorField extends InputField<ColorFieldResolved> {
  type: "color";
  value?: string;
}
interface ColorFieldResolved extends ColorField, FieldResolved {
}

export default {
  tag: "f-color",
  jsImport: "lume_cms/components/f-color.js",
  applyChanges: applyTextChanges,
} as FieldDefinition<ColorFieldResolved>;

declare global {
  namespace Lume {
    export interface CMSFields {
      color: ColorField;
    }
    export interface CMSResolvedFields {
      color: ColorFieldResolved;
    }
  }
}
