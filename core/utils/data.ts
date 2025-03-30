import type { CMSContent, Data } from "../../types.ts";

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

export async function prepareField(
  field: Lume.CMSResolvedField,
  content: CMSContent,
): Promise<Lume.CMSResolvedField> {
  const json = { ...field } as Lume.CMSResolvedFields[typeof field.type];

  if ("fields" in json) {
    json.fields = await Promise.all(
      json.fields.map((f) => prepareField(f, content)),
    );
  }

  if (json.init) {
    // deno-lint-ignore no-explicit-any
    await json.init(json as any, content);
  }

  return json;
}

export function getViews(
  field: Lume.CMSResolvedField,
  views = new Set(),
): unknown {
  if (typeof field.view === "string") {
    views.add(field.view);
  }

  if ("fields" in field) {
    field.fields.forEach((f) => getViews(f, views));
  }

  return views;
}
