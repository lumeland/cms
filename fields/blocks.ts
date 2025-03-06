import type Cms from "../core/cms.ts";
import { isEmpty } from "../core/utils/string.ts";
import { FieldPropertyMap } from "../types.ts";

export default function <
  FieldTypes extends string,
  FieldProperties extends FieldPropertyMap<FieldTypes>,
>() {
  return (cms: Cms<FieldTypes, FieldProperties>) => {
    return cms.field("blocks", {
      tag: "f-blocks",
      jsImport: `lume_cms/components/f-blocks.js`,
      applyChanges(data, changes, field) {
        if (field.name in changes) {
          const value = changes[field.name];

          const { attributes: { required } = {} } = field as {
            attributes?: { required?: boolean };
          };
          if (isEmpty(value) && !required) {
            delete data[field.name];
          } else {
            data[field.name] = value;
          }
        }
      },
    });
  };
}
