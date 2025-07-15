import { TransformError } from "./transform_error.js";
import type { Transformer } from "../../types.ts";

export const Json: Transformer<string> = {
  toData(content) {
    try {
      return JSON.parse(content) as Record<string, unknown>;
    } catch (error) {
      throw new TransformError(
        `Malformed JSON code: ${(error as Error).message}`,
      );
    }
  },

  fromData(data) {
    return JSON.stringify(data, null, 2);
  },
};
