import Cms, { CmsOptions } from "./core/cms.ts";

import defaultFields from "./fields/core.ts";

export default function <K extends string = never>(
  options?: Partial<CmsOptions>,
): Cms<K> {
  const cms = new Cms<K>(options);

  for (const [name, field] of defaultFields) {
    cms.field(name, field);
  }

  return cms;
}
