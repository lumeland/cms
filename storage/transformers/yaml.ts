import { parseYaml, stringifyYaml } from "../../deps/std.ts";
import { TransformError } from "./transform_error.js";
import type { Transformer } from "../../types.ts";

export const Yaml: Transformer<string> = {
  toData(content) {
    try {
      return parseYaml(content) as Record<string, unknown>;
    } catch (error) {
      throw new TransformError(
        `Malformed YAML code: ${(error as Error).message}`,
      );
    }
  },

  fromData(data) {
    return stringifyYaml(data);
  },
};
