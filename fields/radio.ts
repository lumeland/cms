import { applyTextChanges } from "./utils.ts";
import type {
  FieldDefinition,
  InputField,
  Option,
  ResolvedField,
} from "../types.ts";

/** Field for radio values */
interface RadioField extends InputField<ResolvedRadioField> {
  type: "radio";
  value?: string;

  /** A list of the available options to select */
  options: Option[];
}

interface ResolvedRadioField extends RadioField, ResolvedField {
}

export default {
  tag: "f-radio",
  jsImport: "lume_cms/components/f-radio.js",
  applyChanges: applyTextChanges,
} as FieldDefinition<ResolvedRadioField>;

declare global {
  namespace Lume.CMS {
    export interface Fields {
      radio: RadioField;
    }

    export interface ResolvedFields {
      radio: ResolvedRadioField;
    }
  }
}
