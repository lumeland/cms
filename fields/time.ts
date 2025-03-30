import { applyTextChanges } from "./utils.ts";
import type { FieldDefinition, FieldResolved } from "../types.ts";
import type { InputField, Option } from "./types.ts";

/** Field for time values */
interface TimeField extends InputField<TimeFieldResolved, Attributes> {
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

interface TimeFieldResolved extends TimeField, FieldResolved {
}

export default {
  tag: "f-time",
  jsImport: "lume_cms/components/f-time.js",
  applyChanges: applyTextChanges,
} as FieldDefinition<TimeFieldResolved>;

declare global {
  namespace Lume {
    export interface CMSFields {
      time: TimeField;
    }
    export interface CMSResolvedFields {
      time: TimeFieldResolved;
    }
  }
}
