import { normalizePath } from "../core/utils/path.ts";
import { posix } from "../deps/std.ts";
import { isEmpty } from "../core/utils/string.ts";

import type { Data, ResolvedField } from "../types.ts";
import type Cms from "../core/cms.ts";

function normalizeLineBreaks(value: string) {
  return value.replaceAll("\r\n", "\n");
}

type Prettify<T> =
  & {
    [K in keyof T]: T[K];
  }
  // deno-lint-ignore ban-types
  & {};

type Option = string | { value: string | number; label: string };

interface BaseFieldProperties {
  name: string;
}

interface VisibleFieldProperties extends BaseFieldProperties {
  label?: string;
  description?: string;
  view?: string;
}

interface BaseInputFieldProperties extends VisibleFieldProperties {
  type:
    | "textarea"
    | "markdown"
    | "code"
    | "datetime"
    | "current-datetime"
    | "date"
    | "time"
    | "color"
    | "email"
    | "url"
    | "checkbox"
    | "number";
  value?: string;
  attributes?: {
    required?: boolean;
    min?: number;
    max?: number;
    step?: number;
    maxlength?: number;
    pattern?: string;
    [key: string]: unknown;
  };
}

interface SelectInputFieldProperties
  extends Omit<BaseInputFieldProperties, "type"> {
  type: "text" | "list" | "radio" | "select";
  options?: Option[];
}

interface ContainerFieldProperties extends VisibleFieldProperties {
  type:
    | "object"
    | "object-list"
    | "file-list"
    | "choose-list";
  fields: (Lume.Field<keyof Lume.FieldProperties> | Lume.StringField)[];
}

interface UploadableFieldProperties extends VisibleFieldProperties {
  type: "file" | "markdown";
  /** @deprecated. Use `upload` instead */
  uploads?: string;
  upload?: string | false;
}

type ValueTypeOverrideMap = {
  "number": number;
  "checkbox": boolean;
  "datetime": Date | null;
  "current-datetime": Date | null;
};

type OverrideValueType<
  T extends string,
  Properties extends Omit<BaseInputFieldProperties, "type">,
> = T extends keyof ValueTypeOverrideMap ?
    & Omit<Properties, "value">
    & {
      value?: ValueTypeOverrideMap[T];
    }
  : Properties;

type FieldProperties<
  T extends string,
  FieldProperties extends BaseFieldProperties,
> = Prettify<{ type: T } & FieldProperties>;

type CoreFieldProperties =
  & {
    [K in BaseInputFieldProperties["type"]]: FieldProperties<
      K,
      OverrideValueType<K, BaseInputFieldProperties>
    >;
  }
  & {
    [K in SelectInputFieldProperties["type"]]: FieldProperties<
      K,
      OverrideValueType<K, SelectInputFieldProperties>
    >;
  }
  & {
    [K in ContainerFieldProperties["type"]]: FieldProperties<
      K,
      ContainerFieldProperties
    >;
  }
  & {
    "file": FieldProperties<
      "file",
      UploadableFieldProperties & {
        publicPath?: string;
      }
    >;
    "markdown": FieldProperties<
      "markdown",
      UploadableFieldProperties & {
        snippets?: {
          label: string;
          value: string;
        }[];
      }
    >;
    "hidden": FieldProperties<
      "hidden",
      BaseFieldProperties & {
        value?: string;
      }
    >;
  };

type CoreFieldTransform<T extends keyof CoreFieldProperties> = "value" extends
  keyof CoreFieldProperties[T] ? (
    v: string,
    field: ResolvedField<T>,
  ) => Required<CoreFieldProperties[T]>["value"]
  : never;

declare global {
  namespace Lume {
    interface FieldProperties extends CoreFieldProperties {}
  }
}

const inputFields = [
  "text",
  "textarea",
  "markdown",
  "code",
  "datetime",
  "current-datetime",
  "date",
  "time",
  "color",
  "email",
  "url",
  "checkbox",
  "number",
  "select",
  "radio",
] as const satisfies (
  | BaseInputFieldProperties["type"]
  | SelectInputFieldProperties["type"]
)[];

// Logic-less fields
const defaultTransforms = {
  "textarea": normalizeLineBreaks,
  "markdown": normalizeLineBreaks,
  "datetime": (v: string) => v ? new Date(v) : null,
  "current-datetime": (v: string) => v ? new Date(v) : null,
  "checkbox": (v: string) => v === "true",
  "number": (v: string) => Number(v),
} satisfies {
  [K in typeof inputFields[number]]?: CoreFieldTransform<K>;
};

const hasDefaultTransform = (
  input: typeof inputFields[number],
): input is keyof typeof defaultTransforms => {
  return Object.hasOwn(defaultTransforms, input);
};

export const defaultFields = (cms: Cms): void => {
  for (const input of inputFields) {
    const defaultTransform = hasDefaultTransform(input)
      ? defaultTransforms[input]
      : undefined;

    cms.field(input, {
      tag: `f-${input}`,
      jsImport: `lume_cms/components/f-${input}.js`,
      applyChanges(data, changes, field) {
        if (!(field.name in changes)) {
          return;
        }
        const { transform = defaultTransform } = field;
        const value = transform
          ? transform(changes[field.name], field)
          : changes[field.name];

        const { attributes: { required } = {} } = field as typeof field & {
          attributes?: { required?: boolean };
        };
        if (isEmpty(value) && !required) {
          delete data[field.name];
        } else {
          data[field.name] = value;
        }
      },
    });
  }
  cms
    .field(
      "hidden",
      {
        tag: `f-hidden`,
        jsImport: `lume_cms/components/f-hidden.js`,
        applyChanges(data, changes, field) {
          if (!(field.name in changes)) {
            return;
          }
          const { transform: fn } = field;
          const value = fn
            ? fn(
              changes[field.name] as string,
              field,
            )
            : changes[field.name];

          if (isEmpty(value)) {
            delete data[field.name];
          } else {
            data[field.name] = value;
          }
        },
      },
    )
    .field(
      "list",
      {
        tag: "f-list",
        jsImport: "lume_cms/components/f-list.js",
        applyChanges(data, changes, field) {
          const value = Object.values(changes[field.name] || {}).filter((v) =>
            !isEmpty(v)
          );

          const fn = field.transform;
          data[field.name] = fn ? fn(value, field) : value;
        },
      },
    )
    .field(
      "object",
      {
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
      },
    )
    .field(
      "object-list",
      {
        tag: "f-object-list",
        jsImport: "lume_cms/components/f-object-list.js",
        async applyChanges(data, changes, field, document, cmsContent) {
          const value = await Promise.all(
            Object.values(changes[field.name] || {}).map(
              async (subchanges) => {
                const value = {} as Data;

                for (const f of field.fields || []) {
                  await f.applyChanges(
                    value,
                    subchanges,
                    f,
                    document,
                    cmsContent,
                  );
                }

                return value;
              },
            ),
          );

          const fn = field.transform;
          data[field.name] = fn ? fn(value, field) : value;
        },
      },
    )
    .field(
      "file-list",
      {
        tag: "f-file-list",
        jsImport: "lume_cms/components/f-file-list.js",
        async applyChanges(data, changes, field, document, cmsContent) {
          const value = await Promise.all(
            Object.values(changes[field.name] || {}).map(
              async (subchanges) => {
                const value = {} as Data;

                for (const f of field.fields || []) {
                  await f.applyChanges(
                    value,
                    subchanges,
                    f,
                    document,
                    cmsContent,
                  );
                }

                return value;
              },
            ),
          );

          const fn = field.transform;
          data[field.name] = fn ? fn(value, field) : value;
        },
      },
    )
    .field(
      "choose-list",
      {
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
                  await f.applyChanges(
                    value,
                    subchanges,
                    f,
                    document,
                    cmsContent,
                  );
                }

                return value;
              },
            ),
          );

          const fn = field.transform;
          data[field.name] = fn ? fn(value, field) : value;
        },
      },
    )
    .field(
      "file",
      {
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
          data[field.name] = normalizePath(
            publicPath,
            uploadPath,
            uploaded.name,
          );
        },
      },
    )
    .field(
      "markdown",
      {
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
      },
    );
};
