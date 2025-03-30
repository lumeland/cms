import type { Field, FieldDefinition, ResolvedField } from "../types.ts";

/** Field for values not visible in the UI */
interface HiddenField extends Field<ResolvedHiddenField> {
  type: "hidden";
  value?: string | number | boolean;
}

interface ResolvedHiddenField extends HiddenField, ResolvedField {
}

export default {
  tag: "f-hidden",
  jsImport: "lume_cms/components/f-hidden.js",
  applyChanges(data, changes, field) {
    const value = field.name in changes ? changes[field.name] : null;
    data[field.name] = value ?? null;
  },
} as FieldDefinition<ResolvedHiddenField>;

declare global {
  namespace Lume.CMS {
    export interface Fields {
      hidden: HiddenField;
    }
    export interface ResolvedFields {
      hidden: ResolvedHiddenField;
    }
  }
}
