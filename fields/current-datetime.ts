import type { FieldDefinition, FieldResolved } from "../types.ts";
import type { InputField } from "./types.ts";

/** Field for datetime values */
interface CurrentDatetimeField
  extends InputField<CurrentDatetimeFieldResolved> {
  type: "current-datetime";
  value?: Date;
}

interface CurrentDatetimeFieldResolved
  extends CurrentDatetimeField, FieldResolved {
}

export default {
  tag: "f-current-datetime",
  jsImport: "lume_cms/components/f-current-datetime.js",
  applyChanges(data, changes, field) {
    const value = field.name in changes
      ? new Date(String(changes[field.name]))
      : null;

    if (value && !isNaN(value.getTime())) {
      data[field.name] = value;
    }

    delete data[field.name];
  },
} as FieldDefinition<CurrentDatetimeFieldResolved>;

declare global {
  namespace Lume {
    export interface CMSFields {
      "current-datetime": CurrentDatetimeField;
    }

    export interface CMSResolvedFields {
      "current-datetime": CurrentDatetimeFieldResolved;
    }
  }
}
