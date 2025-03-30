import type { FieldDefinition, FieldResolved } from "../types.ts";
import type { InputField, Option } from "./types.ts";

/** Field for numeric values */
interface NumberField extends InputField<NumberFieldResolved, Attributes> {
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

interface NumberFieldResolved extends NumberField, FieldResolved {
}

export default {
  tag: "f-number",
  jsImport: "lume_cms/components/f-number.js",
  applyChanges(data, changes, field) {
    const value = Number(field.name in changes ? changes[field.name] : null);

    if (!isNaN(value)) {
      data[field.name] = value;
    }

    if (field.attributes?.required) {
      data[field.name] = 0;
      return;
    }

    delete data[field.name];
  },
} as FieldDefinition<NumberFieldResolved>;

declare global {
  namespace Lume {
    export interface CMSFields {
      number: NumberField;
    }

    export interface CMSResolvedFields {
      number: NumberFieldResolved;
    }
  }
}
