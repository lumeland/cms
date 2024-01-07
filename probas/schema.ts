import cms from "../mod.ts";
import { KvStorage } from "../src/storage/kv.ts";

const app = cms({
  cwd: Deno.cwd() + "/probas",
});

app.data("fs", "src");
app.files("uploads", "src/uploads");
app.data(
  "kv",
  new KvStorage({
    kv: await Deno.openKv("./probas/kv.db"),
  }),
);

app.collection(
  "posts",
  "fs:*",
  [
    {
      name: "title",
      type: "text",
      options: [
        "Título 1",
        "Título 2",
        "Título 3",
      ],
    },
    "date: datetime",
    {
      name: "cover",
      type: "file",
      storage: "uploads",
      publicPath: "/uploads",
    },
    "bg: color",
    "age: number",
    "hour: time",
    "link: url",
    {
      name: "type",
      type: "select",
      options: ["post", "page"],
    },
    {
      name: "draft",
      type: "checkbox",
      description: "Déixao marcado se é un borrador",
    },
    {
      name: "author",
      type: "object",
      fields: [
        "name: text",
        "email",
      ],
    },
    "content: textarea",
  ],
);

app.collection(
  "authors",
  "fs:autores/*.md",
  [
    {
      name: "title",
      type: "text",
    },
    {
      name: "email",
      type: "text",
    },
    {
      name: "content",
      type: "textarea",
    },
  ],
);

app.collection(
  "other",
  "kv:other",
  [
    {
      name: "title",
      type: "text",
    },
    {
      name: "email",
      type: "text",
    },
    {
      name: "content",
      type: "textarea",
    },
  ],
);

app.document(
  "options",
  "fs:_data.yml",
  [
    {
      name: "layout",
      type: "text",
      description: "Por exemplo: 'default' ou 'post'. Non é obrigatorio",
    },
    {
      name: "new",
      type: "textarea",
    },
    {
      name: "type",
      type: "text",
    },
    {
      name: "tags",
      type: "list",
    },
    {
      name: "people",
      type: "object-list",
      fields: [
        {
          name: "name",
          type: "text",
        },
        {
          name: "email",
          type: "text",
        },
      ],
    },
    {
      name: "content",
      type: "choose-list",
      fields: [
        {
          name: "contact",
          type: "object",
          fields: [
            {
              name: "title",
              type: "text",
            },
            {
              name: "email",
              type: "text",
            },
          ],
        },
        {
          name: "content",
          type: "object",
          label: "Contido",
          description: "Contido do documento",
          fields: [
            {
              name: "text",
              type: "textarea",
            },
          ],
        },
      ],
    },
  ],
);

app.serve();
