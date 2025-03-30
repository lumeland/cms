import type { Field, FieldResolved } from "../types.ts";

/** Option item for a select or datalist */
export type Option<T = string> = T | { value: T; label: string };

export interface GroupFieldResolved extends FieldResolved {
  /** The fields that belong to this group */
  fields: Lume.CMSResolvedField[];
}

/** Field visible in the UI */
export interface VisibleField<T extends FieldResolved = FieldResolved>
  extends Field<T> {
  /** The visible name in the UI. If it's not defined, the name option will be used. */
  label?: string;

  /** An optional description visible next to the label in the UI. */
  description?: string;

  /** View name in which this field is visible */
  view?: string;
}

/** Field for input values */
export interface InputField<
  T extends FieldResolved = FieldResolved,
  A = Record<string, unknown>,
> extends VisibleField<T> {
  attributes?: Prettify<InputAttributes & A>;
}

/** Field for groups */
export interface GroupField<T extends FieldResolved = FieldResolved>
  extends VisibleField<T> {
  /** The fields that belong to this group */
  fields: Lume.CMSField[];
}

export interface InputAttributes {
  /** Whether the value is required or not */
  required?: boolean;

  /** The placeholder text */
  placeholder?: string;

  /** If it's true, the value can't be edited by the user */
  readonly?: boolean;

  [key: string]: unknown;
}

/** Pretty */
type Prettify<T> =
  & {
    [K in keyof T]: T[K];
  }
  // deno-lint-ignore ban-types
  & {};
