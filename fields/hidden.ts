import type { Field, FieldDefinition, FieldResolved } from "../types.ts";

/** Field for values not visible in the UI */
interface HiddenField extends Field<HiddenFieldResolved> {
  type: "hidden";
  value?: string | number | boolean;
}

interface HiddenFieldResolved extends HiddenField, FieldResolved {
}

export default {
  tag: "f-hidden",
  jsImport: "lume_cms/components/f-hidden.js",
  applyChanges(data, changes, field) {
    const value = field.name in changes ? changes[field.name] : null;
    data[field.name] = value ?? null;
  },
} as FieldDefinition<HiddenFieldResolved>;

declare global {
  namespace Lume {
    export interface CMSFields {
      hidden: HiddenField;
    }
    export interface CMSResolvedFields {
      hidden: HiddenFieldResolved;
    }
  }
}
