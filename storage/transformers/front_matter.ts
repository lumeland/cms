import {
  extractFrontMatter,
  stringifyYaml,
  testFrontMatter,
} from "../../deps/std.ts";

import type { Data, Transformer } from "../../types.ts";

export const FrontMatter: Transformer<string> = {
  toData(content) {
    if (testFrontMatter(content, ["yaml"])) {
      const { attrs, body } = extractFrontMatter(content);
      const data = {} as Data;
      Object.assign(data, attrs);
      data.content = body.trim();

      return data;
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
