import type { Data, InputField } from "../types.ts";

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
    data[field.name] = value.replaceAll("\r\n", "\n");
    return;
  }

  if (field.attributes?.required) {
    data[field.name] = "";
    return;
  }

  delete data[field.name];
}
