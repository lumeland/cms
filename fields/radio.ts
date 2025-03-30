import { applyTextChanges } from "./utils.ts";
import type { FieldDefinition, FieldResolved } from "../types.ts";
import type { InputField, Option } from "./types.ts";

/** Field for radio values */
interface RadioField extends InputField<RadioFieldResolved> {
  type: "radio";
  value?: string;

  /** A list of the available options to select */
  options: Option[];
}

interface RadioFieldResolved extends RadioField, FieldResolved {
}

export default {
  tag: "f-radio",
  jsImport: "lume_cms/components/f-radio.js",
  applyChanges: applyTextChanges,
} as FieldDefinition<RadioFieldResolved>;

declare global {
  namespace Lume {
    export interface CMSFields {
      radio: RadioField;
    }

    export interface CMSResolvedFields {
      radio: RadioFieldResolved;
    }
  }
}
