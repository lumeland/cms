import { transform } from "./utils.ts";
import type { FieldDefinition, InputField, ResolvedField } from "../types.ts";

/** Field for datetime values */
interface DatetimeField extends InputField<ResolvedDatetimeField, Attributes> {
  type: "datetime";
  value?: Date;
}

interface Attributes {
  /** The latest date and time to accept in the format YYYY-MM-DDTHH:mm */
  max?: string;

  /** the earliest date and time to accept in the format YYYY-MM-DDTHH:mm */
  min?: string;

  /** The granularity (in seconds) that the value must adhere to */
  step?: number;
}

interface ResolvedDatetimeField extends DatetimeField, ResolvedField {
}

export default {
  tag: "f-datetime",
  jsImport: "lume_cms/components/f-datetime.js",
  applyChanges(data, changes, field, _, cmsContent) {
    try {
      const value = typeof changes[field.name] === "string"
        ? Temporal.PlainDateTime.from(changes[field.name] as string)
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
} as FieldDefinition<ResolvedDatetimeField>;

declare global {
  namespace Lume.CMS {
    export interface Fields {
      datetime: DatetimeField;
    }

    export interface ResolvedFields {
      datetime: ResolvedDatetimeField;
    }
  }
}
