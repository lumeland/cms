import { normalizePath } from "./utils/path.ts";

import type { FielType, ResolvedField } from "../types.ts";

const fields = new Map<string, FielType>();

// Logic-less fields
const inputs = [
  "text",
  "textarea",
  "markdown",
  "date",
  "datetime",
  "time",
  "hidden",
  "color",
  "email",
  "url",
  "select",
  "object",
];

for (const input of inputs) {
  fields.set(input, {
    tag: `f-${input}`,
    jsImport: `lume_cms/components/f-${input}.js`,
  });
}

// Add fields with custom logic
fields.set("checkbox", {
  tag: "f-checkbox",
  jsImport: "lume_cms/components/f-checkbox.js",
  transformData: (value: unknown) => value === "true",
});

fields.set("number", {
  tag: "f-number",
  jsImport: "lume_cms/components/f-number.js",
  transformData: (value: unknown) => value === "" ? null : Number(value),
});

fields.set("choose-list", {
  tag: "f-choose-list",
  jsImport: "lume_cms/components/f-choose-list.js",
  transformData: (value: unknown) => Object.values(value || {}),
});

fields.set("list", {
  tag: "f-list",
  jsImport: "lume_cms/components/f-list.js",
  transformData: (value: unknown) => Object.values(value || {}),
});

fields.set("object-list", {
  tag: "f-object-list",
  jsImport: "lume_cms/components/f-object-list.js",
  transformData: (value: unknown) => Object.values(value || {}),
});

fields.set("file", {
  tag: "f-file",
  jsImport: "lume_cms/components/f-file.js",
  init: (field: ResolvedField) => {
    const { cmsContent } = field;

    if (!field.uploads) {
      field.uploads = Object.keys(cmsContent.uploads)[0];
    }

    if (!field.publicPath) {
      const name = field.uploads.split(":")[0];
      const [, publicPath] = field.cmsContent.uploads[name];
      field.publicPath = publicPath;
    }
  },
  async transformData(
    value: { current?: string; uploaded?: File } | undefined,
    field: ResolvedField,
  ) {
    if (!value) {
      return;
    }

    const { current, uploaded } = value;

    if (!uploaded) {
      return current;
    }

    const [storage, publicPath] =
      field.cmsContent.uploads[field.uploads || "default"];

    if (!storage) {
      throw new Error(
        `No storage found for file field '${field.name}'`,
      );
    }

    const entry = storage.get(uploaded.name);
    await entry.writeFile(uploaded);
    return normalizePath(publicPath, uploaded.name);
  },
});

export default fields;
