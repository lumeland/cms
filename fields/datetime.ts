import type { FieldDefinition, FieldResolved } from "../types.ts";
import type { InputField } from "./types.ts";

/** Field for datetime values */
interface DatetimeField extends InputField<DatetimeFieldResolved, Attributes> {
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

interface DatetimeFieldResolved extends DatetimeField, FieldResolved {
}

export default {
  tag: "f-datetime",
  jsImport: "lume_cms/components/f-datetime.js",
  applyChanges(data, changes, field) {
    const value = field.name in changes
      ? new Date(String(changes[field.name]))
      : null;

    if (value && !isNaN(value.getTime())) {
      data[field.name] = value;
    }

    delete data[field.name];
  },
} as FieldDefinition<DatetimeFieldResolved>;

declare global {
  namespace Lume {
    export interface CMSFields {
      datetime: DatetimeField;
    }

    export interface CMSResolvedFields {
      datetime: DatetimeFieldResolved;
    }
  }
}
