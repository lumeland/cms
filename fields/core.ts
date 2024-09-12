import { normalizePath } from "../core/utils/path.ts";
import { isEmpty } from "../core/utils/string.ts";

import type { Data, FieldType, ResolvedField } from "../types.ts";

// Logic-less fields
const inputs = {
  text: null,
  textarea: normalizeLineBreaks,
  markdown: normalizeLineBreaks,
  code: null,
  datetime: (v: string) => v ? new Date(v) : null,
  current_datetime: (v: string) => v ? new Date(v) : null,
  date: null,
  time: null,
  hidden: null,
  color: null,
  email: null,
  url: null,
  select: null,
  radio: null,
  checkbox: (v: string) => v === "true",
  number: (v: string) => Number(v),
};

type DumpFieldKeys = keyof typeof inputs;
type SmartFieldKeys = "list" | "object" | "object-list" | "choose-list" | "file";
export type FieldKeys = DumpFieldKeys | SmartFieldKeys;

const fields = new Map<FieldKeys, FieldType>();

for (const [input, transform] of Object.entries(inputs)) {
  fields.set(input as DumpFieldKeys, {
    tag: `f-${input}`,
    jsImport: `lume_cms/components/f-${input}.js`,
    applyChanges(data, changes, field: ResolvedField) {
      if (field.name in changes) {
        const fn = field.transform || transform;
        const value = fn
          ? fn(changes[field.name] as string, field)
          : changes[field.name];

        if (isEmpty(value) && !field.attributes?.required) {
          delete data[field.name];
        } else {
          data[field.name] = value;
        }
      }
    },
  });
}

// Add fields with custom logic
fields.set("list", {
  tag: "f-list",
  jsImport: "lume_cms/components/f-list.js",
  applyChanges(data, changes, field: ResolvedField) {
    const value = Object.values(changes[field.name] || {}).filter((v) =>
      !isEmpty(v)
    );

    const fn = field.transform;
    data[field.name] = fn ? fn(value, field) : value;
  },
});

fields.set("object", {
  tag: "f-object",
  jsImport: "lume_cms/components/f-object.js",
  async applyChanges(data, changes, field: ResolvedField) {
    const value = data[field.name] as Data || {};

    for (const f of field.fields || []) {
      await f.applyChanges(value, changes[field.name] as Data || {}, f);
    }

    const fn = field.transform;
    data[field.name] = fn ? fn(value, field) : value;
  },
});

fields.set("object-list", {
  tag: "f-object-list",
  jsImport: "lume_cms/components/f-object-list.js",
  async applyChanges(data, changes, field: ResolvedField) {
    const value = await Promise.all(
      Object.values(changes[field.name] || {}).map(
        async (subchanges) => {
          const value = {} as Data;

          for (const f of field.fields || []) {
            await f.applyChanges(value, subchanges, f);
          }

          return value;
        },
      ),
    );

    const fn = field.transform;
    data[field.name] = fn ? fn(value, field) : value;
  },
});

fields.set("choose-list", {
  tag: "f-choose-list",
  jsImport: "lume_cms/components/f-choose-list.js",
  async applyChanges(data, changes, field: ResolvedField) {
    const value = await Promise.all(
      Object.values(changes[field.name] || {}).map(
        async (subchanges) => {
          const type = subchanges.type as string;
          const value = { type } as Data;
          const chooseField = field.fields?.find((f) => f.name === type);

          if (!chooseField) {
            throw new Error(`No field found for type '${type}'`);
          }

          for (const f of chooseField?.fields || []) {
            await f.applyChanges(value, subchanges, f);
          }

          return value;
        },
      ),
    );

    const fn = field.transform;
    data[field.name] = fn ? fn(value, field) : value;
  },
});

fields.set("file", {
  tag: "f-file",
  jsImport: "lume_cms/components/f-file.js",
  init: (field: ResolvedField) => {
    const { cmsContent } = field;

    if (!field.uploads) {
      field.uploads = Object.keys(cmsContent.uploads)[0];

      if (!field.uploads) {
        throw new Error(
          `No uploads found for file field '${field.name}'`,
        );
      }
    }

    if (!field.publicPath) {
      const name = field.uploads.split(":")[0];
      const { publicPath } = field.cmsContent.uploads[name];
      field.publicPath = publicPath;
    }
  },
  async applyChanges(data, changes, field: ResolvedField) {
    const value = changes[field.name] as
      | { current?: string; uploaded?: File }
      | undefined;

    if (!value) {
      return;
    }

    const { current, uploaded } = value;

    if (!uploaded) {
      data[field.name] = current;
      return;
    }
    const uploads = field.uploads || "default";
    const [uploadsKey, uploadsPath = ""] = uploads.split(":");
    const { storage, publicPath } = field.cmsContent.uploads[uploadsKey];

    if (!storage) {
      throw new Error(
        `No storage found for file field '${field.name}'`,
      );
    }

    const entry = storage.get(normalizePath(uploadsPath, uploaded.name));
    await entry.writeFile(uploaded);
    data[field.name] = normalizePath(publicPath, uploadsPath, uploaded.name);
  },
});

function normalizeLineBreaks(value: string) {
  return value.replaceAll("\r\n", "\n");
}

export default fields;
