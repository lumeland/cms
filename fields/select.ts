import { applyTextChanges } from "./utils.ts";
import type { FieldDefinition, FieldResolved } from "../types.ts";
import type { InputField, Option } from "./types.ts";

/** Field for select values */
interface SelectField extends InputField<SelectFieldResolved> {
  type: "select";
  value?: string;

  /** A list of the available options to select */
  options: Option[];
}

interface SelectFieldResolved extends SelectField, FieldResolved {
}

export default {
  tag: "f-select",
  jsImport: "lume_cms/components/f-select.js",
  applyChanges: applyTextChanges,
} as FieldDefinition<SelectFieldResolved>;

declare global {
  namespace Lume {
    export interface CMSFields {
      select: SelectField;
    }
  }
}
