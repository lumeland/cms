// deno-lint-ignore-file no-explicit-any
import { transform } from "./utils.ts";
import { isEmpty } from "../core/utils/string.ts";
import type {
  FieldDefinition,
  Option,
  ResolvedField,
  UIField,
} from "../types.ts";

/** Field for map values */
interface MapField extends UIField<ResolvedMapField> {
  type: "map";
  value?: Record<string, string>;

  /** A list of predefined values to suggest to the user. */
  options?: Option[];
}

interface ResolvedMapField extends MapField, ResolvedField {
}

export default {
  tag: "f-map",
  jsImport: "lume_cms/components/f-map.js",
  applyChanges(data, changes, field) {
    const value = Object.values(changes[field.name] || [])
      .filter((v: any) => !isEmpty(v.key))
      .map((v: any) => [v.key, v.value]);

    data[field.name] = transform(field, Object.fromEntries(value));
  },
} as FieldDefinition<ResolvedMapField>;

declare global {
  namespace Lume.CMS {
    export interface Fields {
      map: MapField;
    }
    export interface ResolvedFields {
      map: ResolvedMapField;
    }
  }
}
