import { applyTextChanges } from "./utils.ts";
import type {
  FieldDefinition,
  InputField,
  Option,
  ResolvedField,
} from "../types.ts";

/** Field for url values */
interface UrlField extends InputField<ResolvedUrlField> {
  type: "url";
  value?: string;

  /** A list of predefined values to suggest to the user. */
  options?: Option[];
}

interface ResolvedUrlField extends UrlField, ResolvedField {
}

export default {
  tag: "f-url",
  jsImport: "lume_cms/components/f-url.js",
  applyChanges: applyTextChanges,
} as FieldDefinition<ResolvedUrlField>;

declare global {
  namespace Lume.CMS {
    export interface Fields {
      url: UrlField;
    }
  }
}
