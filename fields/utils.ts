import { isEmpty } from "../core/utils/string.ts";
import type Document from "../core/document.ts";
import type {
  CMSContent,
  Data,
  Field,
  InputField,
  Option,
  ResolvedField,
} from "../types.ts";

export function applySelectChanges<
  T extends InputField & { options: Option[] },
>(
  data: Data,
  changes: Data,
  field: T,
  _: Document,
  content: CMSContent,
) {
  if (!(field.name in changes)) {
    return;
  }
  const value = getSelectValue(field.options, changes[field.name]);

  if (value !== undefined) {
    data[field.name] = transform(field, value, content);
    return;
  }

  delete data[field.name];
}

export function compareOptions(a: Option, b: Option): number {
  return typeof a === "object"
    ? a.label.localeCompare(
      typeof b === "object" ? b.label.toString() : b.toString(),
    )
    : a.toString().localeCompare(
      typeof b === "object" ? b.label.toString() : b.toString(),
    );
}

export function getSelectValue(
  options: Option[],
  value: unknown,
): unknown | undefined {
  if (isEmpty(value)) {
    return;
  }

  for (const option of options) {
    if (typeof option === "object") {
      if (option.value == value) {
        return option.value;
      }
      continue;
    }
    if (option == value) {
      return option;
    }
  }
}

export function applyTextChanges<T extends InputField>(
  data: Data,
  changes: Data,
  field: T,
  _: Document,
  content: CMSContent,
) {
  if (!(field.name in changes)) {
    return;
  }

  const value = changes[field.name];

  if (typeof value === "string" && value.trim().length > 0) {
    data[field.name] = transform(
      field,
      value.replaceAll("\r\n", "\n"),
      content,
    );
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
  value: V | null | undefined,
  content: CMSContent,
): V | undefined | null {
  const transform = field.transform;
  return transform
    ? transform(value, field as unknown as ResolvedField, content)
    : value;
}
