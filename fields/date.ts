import { applyTextChanges } from "./utils.ts";
import type { FieldDefinition, InputField, ResolvedField } from "../types.ts";

/** Field for date values */
interface DateField extends InputField<ResolvedDateField, Attributes> {
  type: "date";
  value?: string;
}

interface Attributes {
  /** The latest date to accept in the format YYYY-MM-DD */
  max?: string;

  /** the earliest date to accept in the format YYYY-MM-DD */
  min?: string;

  /** The granularity (in days) that the value must adhere to */
  step?: number;
}

interface ResolvedDateField extends DateField, ResolvedField {
}

export default {
  tag: "f-date",
  jsImport: "lume_cms/components/f-date.js",
  applyChanges: applyTextChanges,
} as FieldDefinition<ResolvedDateField>;

declare global {
  namespace Lume.CMS {
    export interface Fields {
      date: DateField;
    }
    export interface ResolvedFields {
      date: ResolvedDateField;
    }
  }
}
