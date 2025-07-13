import type { Data, Field, InputField } from "../types.ts";

export function applyTextChanges<T extends InputField>(
  data: Data,
  changes: Data,
  field: T,
) {
  if (!(field.name in changes)) {
    return;
  }

  const value = changes[field.name];

  if (typeof value === "string" && value.trim().length > 0) {
    data[field.name] = transform(field, value.replaceAll("\r\n", "\n"));
    return;
  }

  if (field.attributes?.required) {
    data[field.name] = "";
    return;
  }

  delete data[field.name];
}

export function transform<V, T extends Field = Field>(
  field: T,
  value?: V | null,
): V | undefined | null {
  const transform = field.transform;
  return transform ? transform(value) : value;
}
