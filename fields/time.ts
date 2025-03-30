import { applyTextChanges } from "./utils.ts";
import type {
  FieldDefinition,
  InputField,
  Option,
  ResolvedField,
} from "../types.ts";

/** Field for time values */
interface TimeField extends InputField<ResolvedTimeField, Attributes> {
  type: "time";
  value?: string;
}

interface Attributes {
  /** A list of predefined values to suggest to the user. */
  options: Option<string>[];

  /** The latest time to accept in the format HH:mm */
  max?: string;

  /** the earliest time to accept in the format HH:mm */
  min?: string;

  /** The granularity (in seconds) that the value must adhere to */
  step?: number;
}

interface ResolvedTimeField extends TimeField, ResolvedField {
}

export default {
  tag: "f-time",
  jsImport: "lume_cms/components/f-time.js",
  applyChanges: applyTextChanges,
} as FieldDefinition<ResolvedTimeField>;

declare global {
  namespace Lume.CMS {
    export interface Fields {
      time: TimeField;
    }
    export interface ResolvedFields {
      time: ResolvedTimeField;
    }
  }
}
