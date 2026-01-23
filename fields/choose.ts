import { transform } from "./utils.ts";
import type {
  Data,
  FieldDefinition,
  GroupField,
  ResolvedGroupField,
} from "../types.ts";

/** Field for choose values */
interface ChooseField extends GroupField<ResolvedChooseField> {
  type: "choose";
  value?: Record<string, unknown>;
}

interface ResolvedChooseField
  extends Omit<ChooseField, "fields">, ResolvedGroupField {
}

export default {
  tag: "f-choose",
  jsImport: "lume_cms/components/f-choose.js",
  async applyChanges(data, changes, field, document, cmsContent) {
    const value = changes[field.name] as Data | undefined;

    if (!value) {
      delete data[field.name];
      return;
    }

    const type = value.type as string;

    const chooseField = field.fields?.find((f) => f.name === type) as
      | ResolvedGroupField
      | undefined;

    if (!chooseField) {
      throw new Error(`No field found for type '${type}'`);
    }

    const newValue = { type } as Data;

    for (const f of chooseField?.fields || []) {
      await f.applyChanges(
        newValue,
        changes[field.name] as Data || {},
        f,
        document,
        cmsContent,
      );
    }

    data[field.name] = transform(field, newValue);
  },
} as FieldDefinition<ResolvedChooseField>;

declare global {
  namespace Lume.CMS {
    export interface ParentFields {
      "choose": ChooseField;
    }
    export interface ResolvedFields {
      "choose": ResolvedChooseField;
    }
  }
}
