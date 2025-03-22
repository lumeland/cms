import type { CMSContent, Data, ResolvedField } from "../../types.ts";

/**
 * Converts a list of changes to an object:
 * {
 *   "changes.0.one": "value one",
 *   "changes.0.two": "value two"
 * }
 * Becomes:
 * {
 *   changes: {
 *   [
 *    {
 *     one: "value one",
 *     two: "value two",
 *    }
 *   ]
 * }
 */
export function changesToData(
  changes: Record<string, unknown>,
): Data {
  const data: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(changes)) {
    const parts = key.split(".");
    // deno-lint-ignore no-explicit-any
    let item: any = data;

    while (true) {
      let part = parts.shift()!;

      // if it's a numeric string prepend 0 to avoid automatic sorting
      if (part === "0" || part.match(/^[1-9]\d*$/)) {
        part = `0${part}`;
      }

      if (!parts.length) {
        item[part] = value;
        break;
      }

      if (part in item) {
        item = item[part];
        continue;
      }

      item[part] = {};
      item = item[part];
    }
  }

  return data.changes as Data;
}

export async function prepareField<T extends keyof Lume.FieldProperties>(
  field: ResolvedField<T>,
  content: CMSContent,
): Promise<ResolvedField<T>> {
  const json = { ...field };

  if (field.fields) {
    json.fields = await Promise.all(
      field.fields.map((f) => prepareField(f, content)),
    );
  }

  if (field.init) {
    await field.init(json, content);
  }

  return json;
}

export function getViews<T extends keyof Lume.FieldProperties>(
  field: ResolvedField<T>,
  views = new Set(),
): unknown {
  const { view, fields } = field as ResolvedField<T> & {
    view?: string;
  };
  if (view) {
    views.add(view);
  }

  fields?.forEach((f) => getViews(f, views));

  return views;
}
