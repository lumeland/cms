import type { FieldDefinition } from "../types.ts";
import type { GroupField, GroupFieldResolved } from "./types.ts";
import type { Data } from "../types.ts";

/** Field for object list values */
interface ObjectListField extends GroupField<ObjectListFieldResolved> {
  type: "object-list";
  value?: Record<string, unknown>[];
}

interface ObjectListFieldResolved
  extends Omit<ObjectListField, "fields">, GroupFieldResolved {
}

export default {
  tag: "f-object-list",
  jsImport: "lume_cms/components/f-object-list.js",
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
} as FieldDefinition<ObjectListFieldResolved>;

declare global {
  namespace Lume {
    export interface CMSParentFields {
      "object-list": ObjectListField;
    }
    export interface CMSResolvedFields {
      "object-list": ObjectListFieldResolved;
    }
  }
}
