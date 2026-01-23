import { transform } from "./utils.ts";
import type {
  Data,
  FieldDefinition,
  GroupField,
  ResolvedGroupField,
} from "../types.ts";

/** Field for file-list values */
interface FileListField extends GroupField<ResolvedFileListField> {
  type: "file-list";
  value?: Record<string, unknown>[];
}

interface ResolvedFileListField
  extends Omit<FileListField, "fields">, ResolvedGroupField {
}

export default {
  tag: "f-file-list",
  jsImport: "lume_cms/components/f-file-list.js",
  async applyChanges(data, changes, field, document, cmsContent) {
    const value = await Promise.all(
      Object.values(changes[field.name] || {}).map(
        // deno-lint-ignore no-explicit-any
        async (subchanges: any) => {
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

    data[field.name] = transform(field, value);
  },
} as FieldDefinition<ResolvedFileListField>;

declare global {
  namespace Lume.CMS {
    export interface ParentFields {
      "file-list": FileListField;
    }
    export interface ResolvedFields {
      "file-list": ResolvedFileListField;
    }
  }
}
