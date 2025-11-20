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
        data.content = body;

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
    const body = String(content || "").trimEnd() + "\n";

    if (Object.keys(attrs).length === 0) {
      return body;
    }

    return `---\n${stringifyYaml(attrs)}---\n${body}`;
  },
};
