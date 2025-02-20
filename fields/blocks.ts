import type Cms from "../core/cms.ts";
import { isEmpty } from "../core/utils/string.ts";

export default function () {
  return <FieldType extends string>(cms: Cms<FieldType>) => {
    return cms.field("blocks", {
      tag: "f-blocks",
      jsImport: `lume_cms/components/f-blocks.js`,
      applyChanges(data, changes, field) {
        if (field.name in changes) {
          const value = changes[field.name];

          if (isEmpty(value) && !field.attributes?.required) {
            delete data[field.name];
          } else {
            data[field.name] = value;
          }
        }
      },
    });
  };
}
