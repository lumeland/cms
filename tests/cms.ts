import lumeCMS from "../mod.ts";
import KvStorage from "../storage/kv.ts";
import { emptyDir } from "../deps/std.ts";

emptyDir("src");

const cms = lumeCMS({
  site: {
    name: "Site name",
    url: "https://example.com/",
    description: "This is a test of Lume CMS.",
    body: `
      <p>Instructions</p>
    `,
  },
});

cms.storage("src", "src");
cms.upload("img", "src:img");

cms.storage(
  "kv",
  new KvStorage({
    kv: await Deno.openKv(),
  }),
);

cms.document({
  name: "Home",
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

export default cms;
