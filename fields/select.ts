import { applyTextChanges } from "./utils.ts";
import type {
  FieldDefinition,
  InputField,
  Option,
  ResolvedField,
} from "../types.ts";

/** Field for select values */
interface SelectField extends InputField<ResolvedSelectField> {
  type: "select";
  value?: string;

  /** A list of the available options to select */
  options: Option[];
}

interface ResolvedSelectField extends SelectField, ResolvedField {
}

export default {
  tag: "f-select",
  jsImport: "lume_cms/components/f-select.js",
  applyChanges: applyTextChanges,
} as FieldDefinition<ResolvedSelectField>;

declare global {
  namespace Lume.CMS {
    export interface Fields {
      select: SelectField;
    }
  }
}
