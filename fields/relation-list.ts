import { compareOptions, getSelectValue, transform } from "./utils.ts";
import { isEmpty } from "../core/utils/string.ts";
import type {
  EntryMetadata,
  FieldDefinition,
  Option,
  ResolvedField,
  UIField,
} from "../types.ts";

/** Field for list values */
interface RelationListField extends UIField<ResolvedRelationListField> {
  type: "relation-list";
  value?: string[];

  /** The options to show in the field */
  /** If not provided, the options will be loaded from the collection */
  options?: Option[];

  /** The collection name to get the available options */
  collection: string;

  /** A custom function to create options */
  option?: (data: EntryMetadata) => Option;
}

interface ResolvedRelationListField extends RelationListField, ResolvedField {
  options: Option[];
}

export default {
  tag: "f-relation-list",
  jsImport: "lume_cms/components/f-relation-list.js",
  async init(field, cmsContent) {
    if (field.options?.length) {
      return;
    }

    const collection = cmsContent.collections[field.collection];
    if (!collection) {
      throw new Error(
        `Collection '${field.collection}' not found for relation field '${field.name}'`,
      );
    }

    const createOption = field.option ??
      (({ label, name }: EntryMetadata): Option => ({
        label,
        value: name,
      }));

    field.options = (await Array.fromAsync(collection))
      .map(createOption)
      .sort(compareOptions);
  },
  applyChanges(data, changes, field, _, cmsContent) {
    const options = field.options;
    const value = Object.values(changes[field.name] || {})
      .map((value) => getSelectValue(options, value))
      .filter((v) => !isEmpty(v));

    data[field.name] = transform(field, value, cmsContent);
  },
} as FieldDefinition<ResolvedRelationListField>;

declare global {
  namespace Lume.CMS {
    export interface Fields {
      "relation-list": RelationListField;
    }
    export interface ResolvedFields {
      "relation-list": ResolvedRelationListField;
    }
  }
}
