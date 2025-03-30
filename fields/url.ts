import { applyTextChanges } from "./utils.ts";
import type { FieldDefinition, FieldResolved } from "../types.ts";
import type { InputField, Option } from "./types.ts";

/** Field for url values */
interface UrlField extends InputField<UrlFieldResolved> {
  type: "url";
  value?: string;

  /** A list of predefined values to suggest to the user. */
  options?: Option[];
}

interface UrlFieldResolved extends UrlField, FieldResolved {
}

export default {
  tag: "f-url",
  jsImport: "lume_cms/components/f-url.js",
  applyChanges: applyTextChanges,
} as FieldDefinition<UrlFieldResolved>;

declare global {
  namespace Lume {
    export interface CMSFields {
      url: UrlField;
    }
  }
}
