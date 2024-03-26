import type { StrictPresetOptions } from "../deps/fff.ts";
import { Field } from "../types.ts";

export interface Options {
  /** {@link https://fff.js.org/references/fff-flavored-frontmatter.strictpresetoptions.html} */
  strict?: StrictPresetOptions;
  /** {@link https://fff.js.org/version/1.2.html#extra} */
  extra?: {
    authors?: false;
    lang?: false;
    location?: true; // TODO
    syndication?: true; // TODO
    checkin?: true; // TODO
    rsvp?: true; // TODO
  };
}

/** {@link https://fff.js.org/version/1.2.html#base} */
export const fffBase = (options: Options): (Field | string)[] => [
  "title: text",
  "summary: text",
  ...(options.strict?.categories === false ? [] : [
    {
      name: "categories",
      type: "list",
      label: "Categories",
      init: (field) => {
        const { data } = field.cmsContent;
        field.options = data.site?.search.values("categories");
      },
    } satisfies Field,
  ]),
  {
    name: "tags",
    type: "list",
    label: "Tags",
    init: (field) => {
      const { data } = field.cmsContent;
      field.options = data.site?.search.values("tags");
    },
  },
  {
    name: "flags",
    type: "list",
    label: "Flags",
    init: (field) => {
      const { data } = field.cmsContent;
      field.options = data.site?.search.values("flags");
    },
  },
];

/** {@link https://fff.js.org/version/1.2.html#extra} */
export const fffExtra = (options: Options): (Field | string)[] => [
  ...(options.extra?.authors === false ? [] : [
    {
      name: "authors",
      type: "object-list",
      /** {@link https://fff.js.org/version/1.2.html#fffauthor} */
      fields: [
        "name: text",
        "url: url",
        "avatar: url",
      ],
    } satisfies Field,
  ]),
  ...(options.extra?.lang === false ? [] : [
    {
      name: "lang",
      type: "text",
      label: "Language",
    } satisfies Field,
  ]),
  ...(options.strict?.draft === false ? [] : [
    {
      name: "draft",
      type: "checkbox",
      label: "Draft",
      description: "If checked, the post will not be published.",
    } satisfies Field,
  ]),
  ...(options.strict?.visibility === false ? [] : [
    {
      name: "visibility",
      type: "select",
      label: "Visibility",
      options: [
        "public",
        "unlisted",
        "private",
      ],
    } satisfies Field,
  ]),
];

export const article = (options: Options): (Field | string)[] => [
  ...fffBase(options),
  // https://fff.js.org/version/1.2.html#datetime
  "created: date",
  "updated: date",
  "published: date",
  // https://fff.js.org/version/1.2.html#media
  {
    // https://fff.js.org/version/1.2.html#image
    // `images` / Object Media is not supported yet.
    name: "image",
    type: "file",
    label: "Image",
    uploads: "src:images",
  },
  ...fffExtra(options),
  // markdown content
  {
    name: "content",
    type: "markdown",
    label: "Content",
  },
];

export const fffPreset = (options: Options) => ({
  article: () => article(options),
});

export default fffPreset;
