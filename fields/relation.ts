import { applySelectChanges, compareOptions } from "./utils.ts";
import type {
  EntryMetadata,
  FieldDefinition,
  InputField,
  Option,
  ResolvedField,
} from "../types.ts";

/** Field for select values */
interface RelationField extends InputField<ResolvedRelationField> {
  type: "relation";
  value?: string;

  /** The options to show in the field */
  /** If not provided, the options will be loaded from the collection */
  options?: Option[];

  /** The collection name to get the available options */
  collection: string;

  /** A custom function to create options */
  option?: (data: EntryMetadata) => Option;
}

interface ResolvedRelationField extends RelationField, ResolvedField {
  options: Option[];
}

export default {
  tag: "f-relation",
  jsImport: "lume_cms/components/f-relation.js",
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
  applyChanges: applySelectChanges,
} as FieldDefinition<ResolvedRelationField>;

declare global {
  namespace Lume.CMS {
    export interface Fields {
      relation: RelationField;
    }
  }
}
