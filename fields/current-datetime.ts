import { transform } from "./utils.ts";
import type { FieldDefinition, InputField, ResolvedField } from "../types.ts";

/** Field for datetime values */
interface CurrentDatetimeField
  extends InputField<ResolvedCurrentDatetimeField> {
  type: "current-datetime";
  value?: Date;
}

interface ResolvedCurrentDatetimeField
  extends CurrentDatetimeField, ResolvedField {
}

export default {
  tag: "f-current-datetime",
  jsImport: "lume_cms/components/f-current-datetime.js",
  applyChanges(data, changes, field) {
    try {
      const value = typeof changes[field.name] === "string"
        ? Temporal.PlainDateTime.from(changes[field.name] as string)
        : null;
      if (value) {
        data[field.name] = transform(field, value);
      } else {
        delete data[field.name];
      }
    } catch {
      delete data[field.name];
    }
  },
} as FieldDefinition<ResolvedCurrentDatetimeField>;

declare global {
  namespace Lume.CMS {
    export interface Fields {
      "current-datetime": CurrentDatetimeField;
    }

    export interface ResolvedFields {
      "current-datetime": ResolvedCurrentDatetimeField;
    }
  }
}
