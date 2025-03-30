import { applyTextChanges } from "./utils.ts";
import type { FieldDefinition, FieldResolved } from "../types.ts";
import type { Option, VisibleField } from "./types.ts";

/** Field for list values */
interface ListField extends VisibleField<ListFieldResolved> {
  type: "list";
  value?: string;

  /** A list of predefined values to suggest to the user. */
  options?: Option[];
}

interface ListFieldResolved extends ListField, FieldResolved {
}

export default {
  tag: "f-list",
  jsImport: "lume_cms/components/f-list.js",
  applyChanges: applyTextChanges,
} as FieldDefinition<ListFieldResolved>;

declare global {
  namespace Lume {
    export interface CMSFields {
      list: ListField;
    }
    export interface CMSResolvedFields {
      list: ListFieldResolved;
    }
  }
}
