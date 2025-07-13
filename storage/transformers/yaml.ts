import { parseYaml, stringifyYaml } from "../../deps/std.ts";

import type { Transformer } from "../../types.ts";

export const Yaml: Transformer<string> = {
  toData(content) {
    return parseYaml(content) as Record<string, unknown>;
  },

  fromData(data) {
    return stringifyYaml(data);
  },
};
