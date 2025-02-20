import Cms, { CmsOptions } from "./core/cms.ts";

import { defaultFields } from "./fields/core.ts";

type CmsTypeOptions = {
  strict: boolean;
};

type DefaultCmsTypeOptions = {
  strict: false;
};

export default <TypeOptions extends CmsTypeOptions = DefaultCmsTypeOptions>(
  options?: Partial<CmsOptions>,
) => {
  type FieldType = TypeOptions["strict"] extends false
    ? string & Record<never, never>
    : never;
  return new Cms<FieldType>(options).use(defaultFields<FieldType>);
};
