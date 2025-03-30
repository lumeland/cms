import type { FieldDefinition, FieldResolved } from "../types.ts";
import type { InputField } from "./types.ts";

/** Field for checkbox values */
interface CheckboxField extends InputField<CheckboxFieldResolved> {
  type: "checkbox";
  value?: boolean;
}
interface CheckboxFieldResolved extends CheckboxField, FieldResolved {
}

export default {
  tag: "f-checkbox",
  jsImport: "lume_cms/components/f-checkbox.js",
  applyChanges(data, changes, field) {
    const value = field.name in changes ? changes[field.name] === "true" : null;

    data[field.name] = value;
  },
} as FieldDefinition<CheckboxFieldResolved>;

declare global {
  namespace Lume {
    export interface CMSFields {
      checkbox: CheckboxField;
    }
    export interface CMSResolvedFields {
      checkbox: CheckboxFieldResolved;
    }
  }
}
