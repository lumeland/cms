import type { Data } from "../types.ts";
import type { FieldDefinition } from "../types.ts";
import type { GroupField, GroupFieldResolved } from "./types.ts";

/** Field for file-list values */
interface FileListField extends GroupField<FileListFieldResolved> {
  type: "file-list";
  value?: Record<string, unknown>[];
}

interface FileListFieldResolved
  extends Omit<FileListField, "fields">, GroupFieldResolved {
}

export default {
  tag: "f-file-list",
  jsImport: "lume_cms/components/f-file-list.js",
  async applyChanges(data, changes, field, document, cmsContent) {
    const value = await Promise.all(
      Object.values(changes[field.name] || {}).map(
        async (subchanges) => {
          const value = {} as Data;

          for (const f of field.fields) {
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
} as FieldDefinition<FileListFieldResolved>;

declare global {
  namespace Lume {
    export interface CMSParentFields {
      "file-list": FileListField;
    }
    export interface CMSResolvedFields {
      "file-list": FileListFieldResolved;
    }
  }
}
