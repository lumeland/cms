import cms from "./mod.ts";
import KvStorage from "./storage/kv.ts";
import blocks from "./fields/blocks.ts";

const app = cms({
  site: {
    name: "Site name",
    url: "https://lume.land/cms/",
    description: "This is a demo of Lume CMS.",
  },
});

app.use(blocks());

app.storage("src", "probas");
app.upload("img", "src");

app.storage(
  "kv",
  new KvStorage({
    kv: await Deno.openKv(),
  }),
);

app.collection(
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

// Start the server
Deno.serve(app.init().fetch);
