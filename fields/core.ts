import { normalizePath } from "../core/utils/path.ts";
import { posix } from "../deps/std.ts";
import { isEmpty } from "../core/utils/string.ts";

import type { Data, FieldDefinition } from "../types.ts";

// Logic-less fields
const inputs = {
  text: null,
  textarea: normalizeLineBreaks,
  markdown: normalizeLineBreaks,
  code: null,
  datetime: (v: string) => v ? new Date(v) : null,
  "current-datetime": (v: string) => v ? new Date(v) : null,
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
} as const;

type Inputs = typeof inputs;
type DumbFieldKeys = keyof Inputs;
type SmartFieldKeys =
  | "list"
  | "object"
  | "object-list"
  | "choose-list"
  | "markdown"
  | "file";
export type FieldKeys = DumbFieldKeys | SmartFieldKeys;

const fields = new Map<FieldKeys, FieldDefinition<FieldKeys>>();

for (const input of Object.keys(inputs) as (keyof Inputs)[]) {
  const transform = inputs[input];
  fields.set(input, {
    tag: `f-${input}`,
    jsImport: `lume_cms/components/f-${input}.js`,
    applyChanges(data, changes, field) {
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
  applyChanges(data, changes, field) {
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
  async applyChanges(data, changes, field, document, cmsContent) {
    const value = data[field.name] as Data || {};

    for (const f of field.fields || []) {
      await f.applyChanges(
        value,
        changes[field.name] as Data || {},
        f,
        document,
        cmsContent,
      );
    }

    const fn = field.transform;
    data[field.name] = fn ? fn(value, field) : value;
  },
});

fields.set("object-list", {
  tag: "f-object-list",
  jsImport: "lume_cms/components/f-object-list.js",
  async applyChanges(data, changes, field, document, cmsContent) {
    const value = await Promise.all(
      Object.values(changes[field.name] || {}).map(
        async (subchanges) => {
          const value = {} as Data;

          for (const f of field.fields || []) {
            await f.applyChanges(value, subchanges, f, document, cmsContent);
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
  async applyChanges(data, changes, field, document, cmsContent) {
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
            await f.applyChanges(value, subchanges, f, document, cmsContent);
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
  init: (field, cmsContent) => {
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
      const { publicPath } = cmsContent.uploads[name];
      field.publicPath = publicPath;
    }
  },
  async applyChanges(data, changes, field, document, cmsContent) {
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
    const upload = field.upload || field.uploads || "default";
    let [uploadKey, uploadPath = ""] = upload.split(":");
    const { storage, publicPath } = cmsContent.uploads[uploadKey];

    if (!storage) {
      throw new Error(
        `No storage found for file field '${field.name}'`,
      );
    }

    uploadPath = uploadPath.replace(
      "{document_dirname}",
      posix.dirname(document.name),
    );

    const entry = storage.get(normalizePath(uploadPath, uploaded.name));
    await entry.writeFile(uploaded);
    data[field.name] = normalizePath(publicPath, uploadPath, uploaded.name);
  },
});

fields.set("markdown", {
  tag: "f-markdown",
  jsImport: "lume_cms/components/f-markdown.js",
  init(field, { uploads }) {
    field.details ??= {};
    field.details.upload ??= field.uploads ?? field.upload ??
      Object.keys(uploads);
  },
  applyChanges(data, changes, field) {
    if (field.name in changes) {
      const value = changes[field.name];

      if (isEmpty(value) && !field.attributes?.required) {
        delete data[field.name];
      } else {
        data[field.name] = value;
      }
    }
  },
});

function normalizeLineBreaks(value: string) {
  return value.replaceAll("\r\n", "\n");
}

export default fields;
