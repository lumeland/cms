import type { Data, ResolvedField } from "../../types.ts";

export async function prepareField(
  field: ResolvedField,
): Promise<ResolvedField> {
  const json = { ...field };

  if (field.fields) {
    json.fields = await Promise.all(field.fields.map(prepareField));
  }

  if (field.init) {
    await field.init(json);
  }

  return json;
}

export function getDefaultValue(field: ResolvedField): unknown {
  if (field.fields && !field.type.endsWith("-list")) {
    const values = {} as Data;
    for (const f of field.fields) {
      values[f.name] = getDefaultValue(f);
    }
    return values;
  }

  return field.value ?? null;
}
