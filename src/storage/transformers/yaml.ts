import { parse, stringify } from "std/yaml/mod.ts";

import type { Transformer } from "../../types.ts";

export const Yaml: Transformer<string> = {
  toData(content) {
    return parse(content) as Record<string, unknown>;
  },

  fromData(data) {
    return stringify(data);
  },
};
