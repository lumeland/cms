import type { Transformer } from "../../types.ts";

export const Json: Transformer<string> = {
  toData(content) {
    return JSON.parse(content) as Record<string, unknown>;
  },

  fromData(data) {
    return JSON.stringify(data, null, 2);
  },
};
