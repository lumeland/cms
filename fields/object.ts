import { transform } from "./utils.ts";
import type {
  Data,
  FieldDefinition,
  GroupField,
  ResolvedGroupField,
} from "../types.ts";

/** Field for objects values */
interface ObjectField extends GroupField<ResolvedObjectField> {
  type: "object";
  value?: Record<string, unknown>;
  attributes?: Record<string, string | number | boolean>;
}

interface ResolvedObjectField
  extends Omit<ObjectField, "fields">, ResolvedGroupField {
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

    data[field.name] = transform(field, value);
  },
} as FieldDefinition<ResolvedObjectField>;

declare global {
  namespace Lume.CMS {
    export interface ParentFields {
      object: ObjectField;
    }
    export interface ResolvedFields {
      object: ResolvedObjectField;
    }
  }
}
