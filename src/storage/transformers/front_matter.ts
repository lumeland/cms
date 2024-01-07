import { test } from "std/front_matter/mod.ts";
import { extract } from "std/front_matter/yaml.ts";
import { stringify } from "std/yaml/mod.ts";
import type { Transformer } from "../../types.ts";

export const FrontMatter: Transformer<string> = {
  toData(content) {
    if (test(content, ["yaml"])) {
      let { attrs, body } = extract(content);
      attrs ??= {};
      attrs.content = body.trim();

      return attrs;
    }

    return { content };
  },

  fromData(data) {
    const { content, ...attrs } = data;
    return `---\n${stringify(attrs)}---\n${content || ""}\n`;
  },
};
