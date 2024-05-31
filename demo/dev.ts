import lumeCMS from "../mod.ts";
import KvStorage from "../storage/kv.ts";
import blocks from "../fields/blocks.ts";

const cms = lumeCMS({
  site: {
    name: "Site name",
    url: "https://lume.land/cms/",
    description: "This is a demo of Lume CMS.",
  },
});

cms.use(blocks());
cms.versioning("main");
cms.storage("src", "demo");
cms.upload("img", "src:img");

cms.storage(
  "kv",
  new KvStorage({
    kv: await Deno.openKv(),
  }),
);

cms.collection(
  "posts: List of posts for the blog",
  "kv:posts/*",
  [
    {
      name: "title",
      type: "text",
      options: [
        "Title 1",
        "Title 2",
        "Title 3",
      ],
      attributes: {
        maxlength: 20,
      },
    },
    "datetime: datetime",
    "date: date",
    "hour: time",
    "number: number",
    "code: code",
    "color: color",
    {
      name: "cover",
      type: "file",
      uploads: "img:images",
    },
    {
      name: "url",
      type: "url",
      value: "https://example.com",
    },
    {
      name: "radio",
      type: "radio",
      options: ["one", "two"],
      init(field) {
        field.options = [...field.options!, "three", "four"];
      },
    },
    {
      name: "checkout",
      type: "checkbox",
      description: "This is a description.",
    },
    {
      name: "layout",
      type: "hidden",
      value: "/posts.vto",
    },
    {
      name: "author",
      type: "object",
      fields: [
        "name: text",
        "email: email",
      ],
    },
    "markdown: markdown",
    "blocks: blocks",
  ],
);

export default cms;
