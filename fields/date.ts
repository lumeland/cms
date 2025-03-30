import { applyTextChanges } from "./utils.ts";
import type { FieldDefinition, FieldResolved } from "../types.ts";
import type { InputField } from "./types.ts";

/** Field for date values */
interface DateField extends InputField<DateFieldResolved, Attributes> {
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

interface DateFieldResolved extends DateField, FieldResolved {
}

export default {
  tag: "f-date",
  jsImport: "lume_cms/components/f-date.js",
  applyChanges: applyTextChanges,
} as FieldDefinition<DateFieldResolved>;

declare global {
  namespace Lume {
    export interface CMSFields {
      date: DateField;
    }
    export interface CMSResolvedFields {
      date: DateFieldResolved;
    }
  }
}
