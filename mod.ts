import Cms, { CmsOptions } from "./core/cms.ts";

import { defaultFields } from "./fields/core.ts";

export default <CustomFieldType extends string = never>(
  options?: Partial<CmsOptions>,
) => new Cms<CustomFieldType>(options).use(defaultFields);
