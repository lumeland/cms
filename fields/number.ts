import { transform } from "./utils.ts";
import type {
  FieldDefinition,
  InputField,
  Option,
  ResolvedField,
} from "../types.ts";

/** Field for numeric values */
interface NumberField extends InputField<ResolvedNumberField, Attributes> {
  type: "number";
  value?: string;
}

interface Attributes {
  /** A list of predefined values to suggest to the user. */
  options?: Option<number>[];

  /** The maximum value to accept for this input */
  max?: number;

  /** The minimum value to accept for this input */
  min?: number;

  /** The granularity that the value must adhere to */
  step?: number;
}

interface ResolvedNumberField extends NumberField, ResolvedField {
}

export default {
  tag: "f-number",
  jsImport: "lume_cms/components/f-number.js",
  applyChanges(data, changes, field) {
    const value = Number(field.name in changes ? changes[field.name] : null);

    if (!isNaN(value)) {
      data[field.name] = transform(field, value);
    }

    if (field.attributes?.required) {
      data[field.name] = 0;
      return;
    }

    delete data[field.name];
  },
} as FieldDefinition<ResolvedNumberField>;

declare global {
  namespace Lume.CMS {
    export interface Fields {
      number: NumberField;
    }

    export interface ResolvedFields {
      number: ResolvedNumberField;
    }
  }
}
