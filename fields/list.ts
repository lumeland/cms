import { applyTextChanges } from "./utils.ts";
import type {
  FieldDefinition,
  Option,
  ResolvedField,
  UIField,
} from "../types.ts";

/** Field for list values */
interface ListField extends UIField<ResolvedListField> {
  type: "list";
  value?: string;

  /** A list of predefined values to suggest to the user. */
  options?: Option[];
}

interface ResolvedListField extends ListField, ResolvedField {
}

export default {
  tag: "f-list",
  jsImport: "lume_cms/components/f-list.js",
  applyChanges: applyTextChanges,
} as FieldDefinition<ResolvedListField>;

declare global {
  namespace Lume.CMS {
    export interface Fields {
      list: ListField;
    }
    export interface ResolvedFields {
      list: ResolvedListField;
    }
  }
}
