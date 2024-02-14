import {
  extractFrontMatter,
  stringifyYaml,
  testFrontMatter,
} from "../../deps/std.ts";
import type { Transformer } from "../../types.ts";

export const FrontMatter: Transformer<string> = {
  toData(content) {
    if (testFrontMatter(content, ["yaml"])) {
      let { attrs, body } = extractFrontMatter(content);
      attrs ??= {};
      attrs.content = body.trim();

      return attrs;
    }

    return { content };
  },

  fromData(data) {
    const { content, ...attrs } = data;

    if (Object.keys(attrs).length === 0) {
      return `${content || ""}\n`;
    }

    return `---\n${stringifyYaml(attrs)}---\n${content || ""}\n`;
  },
};
