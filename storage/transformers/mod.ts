import { Json } from "./json.ts";
import { FrontMatter } from "./front_matter.ts";
import { Yaml } from "./yaml.ts";
import { extname } from "../../deps/std.ts";

import type { Transformer } from "../../types.ts";

export function fromFilename(path: string): Transformer<string> {
  const ext = extname(path);

  switch (ext) {
    case ".json":
      return Json;
    case ".yaml":
    case ".yml":
      return Yaml;
    default:
      return FrontMatter;
  }
}
