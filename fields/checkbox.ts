import { transform } from "./utils.ts";
import type { FieldDefinition, InputField, ResolvedField } from "../types.ts";

/** Field for checkbox values */
interface CheckboxField extends InputField<ResolvedCheckboxField> {
  type: "checkbox";
  value?: boolean;
}
interface ResolvedCheckboxField extends CheckboxField, ResolvedField {
}

export default {
  tag: "f-checkbox",
  jsImport: "lume_cms/components/f-checkbox.js",
  applyChanges(data, changes, field, _, cmsContent) {
    const value = field.name in changes ? changes[field.name] === "true" : null;

    data[field.name] = transform(field, value, cmsContent);
  },
} as FieldDefinition<ResolvedCheckboxField>;

declare global {
  namespace Lume.CMS {
    export interface Fields {
      checkbox: CheckboxField;
    }
    export interface ResolvedFields {
      checkbox: ResolvedCheckboxField;
    }
  }
}
