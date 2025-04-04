import { transform } from "./utils.ts";
import type {
  Data,
  FieldDefinition,
  GroupField,
  ResolvedGroupField,
} from "../types.ts";

/** Field for object list values */
interface ObjectListField extends GroupField<ResolvedObjectListField> {
  type: "object-list";
  value?: Record<string, unknown>[];
}

interface ResolvedObjectListField
  extends Omit<ObjectListField, "fields">, ResolvedGroupField {
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

    data[field.name] = transform(field, value);
  },
} as FieldDefinition<ResolvedObjectListField>;

declare global {
  namespace Lume.CMS {
    export interface ParentFields {
      "object-list": ObjectListField;
    }
    export interface ResolvedFields {
      "object-list": ResolvedObjectListField;
    }
  }
}
