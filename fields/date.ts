import { transform } from "./utils.ts";
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
  applyChanges(data, changes, field, _, cmsContent) {
    try {
      const value = typeof changes[field.name] === "string"
        ? Temporal.PlainDate.from(changes[field.name] as string)
        : null;

      if (value) {
        data[field.name] = transform(field, value, cmsContent);
      } else {
        delete data[field.name];
      }
    } catch {
      delete data[field.name];
    }
  },
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
