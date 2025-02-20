import Cms, { CmsOptions } from "./core/cms.ts";

import { defaultFields } from "./fields/core.ts";

export default <K extends string = never>(options?: Partial<CmsOptions>) =>
  new Cms<K>(options).use(defaultFields<K>);
