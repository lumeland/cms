import Cms, { CmsOptions } from "./src/cms.ts";

import defaultFields from "./src/fields.ts";

export default function (options?: CmsOptions): Cms {
  const cms = new Cms(options);

  for (const [name, field] of defaultFields) {
    cms.field(name, field);
  }

  return cms;
}
