import type { FieldDefinition } from "../types.ts";
import type { GroupField, GroupFieldResolved } from "./types.ts";
import type { Data } from "../types.ts";

/** Field for objects values */
interface ObjectField extends GroupField<ObjectFieldResolved> {
  type: "object";
  value?: Record<string, unknown>;
}

interface ObjectFieldResolved
  extends Omit<ObjectField, "fields">, GroupFieldResolved {
}

export default {
  tag: "f-object",
  jsImport: "lume_cms/components/f-object.js",
  async applyChanges(data, changes, field, document, cmsContent) {
    const value = data[field.name] as Data || {};

    for (const f of field.fields) {
      await f.applyChanges(
        value,
        changes[field.name] as Data || {},
        f,
        document,
        cmsContent,
      );
    }

    // const fn = field.transform;
    // data[field.name] = fn ? fn(value, field) : value;
    data[field.name] = value;
  },
} as FieldDefinition<ObjectFieldResolved>;

declare global {
  namespace Lume {
    export interface CMSParentFields {
      object: ObjectField;
    }
    export interface CMSResolvedFields {
      object: ObjectFieldResolved;
    }
  }
}
