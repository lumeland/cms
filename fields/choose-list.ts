import { transform } from "./utils.ts";
import type {
  Data,
  FieldDefinition,
  GroupField,
  ResolvedGroupField,
} from "../types.ts";

/** Field for choose list values */
interface ChooseListField extends GroupField<ResolvedChooseListField> {
  type: "choose-list";
  value?: Record<string, unknown>[];
}

interface ResolvedChooseListField
  extends Omit<ChooseListField, "fields">, ResolvedGroupField {
}

export default {
  tag: "f-choose-list",
  jsImport: "lume_cms/components/f-choose-list.js",
  async applyChanges(data, changes, field, document, cmsContent) {
    const value = await Promise.all(
      Object.values(changes[field.name] || {}).map(
        async (subchanges) => {
          const type = subchanges.type as string;
          const value = { type } as Data;
          const chooseField = field.fields?.find((f) => f.name === type) as
            | ResolvedGroupField
            | undefined;

          if (!chooseField) {
            throw new Error(`No field found for type '${type}'`);
          }

          for (const f of chooseField?.fields || []) {
            await f.applyChanges(
              value,
              subchanges,
              f,
              document,
              cmsContent,
            );
          }

          return value;
        },
      ),
    );

    data[field.name] = transform(field, value, cmsContent);
  },
} as FieldDefinition<ResolvedChooseListField>;

declare global {
  namespace Lume.CMS {
    export interface ParentFields {
      "choose-list": ChooseListField;
    }
    export interface ResolvedFields {
      "choose-list": ResolvedChooseListField;
    }
  }
}
