import {
  extractFrontMatter,
  stringifyYaml,
  testFrontMatter,
} from "../../deps/std.ts";
import { TransformError } from "./transform_error.js";
import type { Data, Transformer } from "../../types.ts";

export const FrontMatter: Transformer<string> = {
  toData(content) {
    try {
      if (testFrontMatter(content, ["yaml"])) {
        const { attrs, body } = extractFrontMatter(content);
        const data = {} as Data;
        Object.assign(data, attrs);
        data.content = body.trim();

        return data;
      }
    } catch (error) {
      throw new TransformError(
        `Malformed front matter code (YAML): ${(error as Error).message}`,
      );
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
