import lumeCMS from "../mod.ts";
import KvStorage from "../storage/kv.ts";
import blocks from "../fields/blocks.ts";

const cms = lumeCMS({
  site: {
    name: "Site name",
    url: "https://lume.land/cms/",
    description: "This is a demo of Lume CMS.",
    body: `
      <h2>Bla bla bla</h2>
      <p>
        This is the body of the site.
      </p>
      <ul>
        <li>Item 1</li>
        <li>Item 2</li>
        <li>Item 3</li>
      </ul>
      <code>foo</code>
    `,
  },
  auth: {
    method: "basic",
    users: {
      admin: "admin",
    },
  },
});

cms.use(blocks());
cms.storage("src", "demo");
cms.upload("img", "src:img");

cms.storage(
  "kv",
  new KvStorage({
    kv: await Deno.openKv(),
  }),
);

cms.document({
  name: "Settings",
  store: "kv:_data.yml",
  views: ["full"],
  fields: [
    "title: text",
    {
      name: "description",
      type: "textarea",
      view: "full",
    },
  ],
});
cms.collection({
  name: "Articles",
  store: "src:articles/**/*.md",
  fields: [
    "title: text!",
    "description: text",
    {
      name: "published",
      type: "datetime",
      view: "merda",
      init(field) {
        field.value = new Date();
      },
    },
  ],
  nameField: "title",
});

cms.collection({
  name: "Posts",
  description: "List of posts for the blog",
  store: "kv:posts/*",
  nameField: "title",
  views: ["full", "time"],
  fields: [
    {
      name: "title",
      type: "text",
      options: [
        "Title 1",
        "Title 2",
        "Title 3",
      ],
      view: "full",
      attributes: {
        maxlength: 20,
        required: true,
      },
    },
    {
      name: "created_at",
      view: "time",
      type: "datetime",
      init(field) {
        field.value = new Date();
      },
    },
    {
      name: "updated_at",
      view: "full",
      type: "current-datetime",
      attributes: {
        readonly: false,
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
      value: "three",
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
        "name: text!",
        "email: email",
      ],
    },
    {
      name: "object-list",
      type: "object-list",
      fields: [
        "name: text!",
        "date: date",
        {
          name: "tags",
          type: "select",
          value: "tag2",
          options: [
            "tag1",
            "tag2",
            "tag3",
          ],
        },
      ],
    },
    "markdown: markdown",
    "code: code",
    {
      name: "blocks",
      type: "choose-list",
      fields: [
        {
          name: "title",
          type: "object",
          fields: [
            {
              name: "text",
              type: "text",
              value: "Hello world!",
              attributes: {
                required: true,
              },
            },
          ],
        },
        {
          name: "content",
          type: "object",
          fields: [
            "body: markdown",
          ],
        },
      ],
    },
  ],
});

export default cms;
