import Cms, { CmsOptions } from "./core/cms.ts";

import { addDefaultFields } from "./fields/core.ts";

export default (<K extends string = never>(options?: Partial<CmsOptions>) =>
  addDefaultFields(new Cms<K>(options)));
