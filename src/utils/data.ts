import type { Data } from "../types.ts";

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
      const part = parts.shift()!;

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
