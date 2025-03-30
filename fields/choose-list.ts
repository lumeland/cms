import type { FieldDefinition } from "../types.ts";
import type { GroupField, GroupFieldResolved } from "./types.ts";
import type { Data } from "../types.ts";

/** Field for choose list values */
interface ChooseListField extends GroupField<ChooseListFieldResolved> {
  type: "choose-list";
  value?: Record<string, unknown>[];
}

interface ChooseListFieldResolved
  extends Omit<ChooseListField, "fields">, GroupFieldResolved {
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
            | GroupFieldResolved
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

    // const fn = field.transform;
    // data[field.name] = fn ? fn(value, field) : value;
    data[field.name] = value;
  },
} as FieldDefinition<ChooseListFieldResolved>;

declare global {
  namespace Lume {
    export interface CMSParentFields {
      "choose-list": ChooseListField;
    }
    export interface CMSResolvedFields {
      "choose-list": ChooseListFieldResolved;
    }
  }
}
