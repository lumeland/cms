import { normalizePath } from "../core/utils/path.ts";
import { isEmpty } from "../core/utils/string.ts";

import type { Data, FielType, ResolvedField } from "../types.ts";

const fields = new Map<string, FielType>();

// Logic-less fields
const inputs = {
  text: null,
  textarea: null,
  markdown: null,
  code: null,
  datetime: (v: string) => v ? new Date(v) : null,
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

for (const [input, transform] of Object.entries(inputs)) {
  fields.set(input, {
    tag: `f-${input}`,
    jsImport: `lume_cms/components/f-${input}.js`,
    applyChanges(data, changes, field: ResolvedField) {
      if (field.name in changes) {
        const value = transform
          ? transform(changes[field.name] as string)
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
    data[field.name] = Object.values(changes[field.name] || {}).filter((v) =>
      !isEmpty(v)
    );
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

    data[field.name] = value;
  },
});

fields.set("object-list", {
  tag: "f-object-list",
  jsImport: "lume_cms/components/f-object-list.js",
  async applyChanges(data, changes, field: ResolvedField) {
    const currentData = data[field.name] as Data[] || [];

    data[field.name] = await Promise.all(
      Object.values(changes[field.name] || {}).map(
        async (subchanges, index) => {
          const value = currentData[index] || {};

          for (const f of field.fields || []) {
            await f.applyChanges(value, subchanges, f);
          }

          return value;
        },
      ),
    );
  },
});

fields.set("choose-list", {
  tag: "f-choose-list",
  jsImport: "lume_cms/components/f-choose-list.js",
  async applyChanges(data, changes, field: ResolvedField) {
    const currentData = data[field.name] as Data[] || [];

    data[field.name] = await Promise.all(
      Object.values(changes[field.name] || {}).map(
        async (subchanges, index) => {
          const value = currentData[index] || {};
          const chooseField = field.fields?.find((f) =>
            f.name === subchanges.type
          );

          if (!chooseField) {
            throw new Error(`No field found for type '${subchanges.type}'`);
          }

          for (const f of chooseField?.fields || []) {
            await f.applyChanges(value, subchanges, f);
          }

          value.type = subchanges.type;
          return value;
        },
      ),
    );
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

    const { storage, publicPath } =
      field.cmsContent.uploads[field.uploads || "default"];

    if (!storage) {
      throw new Error(
        `No storage found for file field '${field.name}'`,
      );
    }

    const entry = storage.get(uploaded.name);
    await entry.writeFile(uploaded);
    data[field.name] = normalizePath(publicPath, uploaded.name);
  },
});

export default fields;
