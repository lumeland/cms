import { applyTextChanges } from "./utils.ts";
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

  /** A function to create every option */
  option?: (data: EntryMetadata) => Option;
}

interface ResolvedRelationField extends RelationField, ResolvedField {
}

export default {
  tag: "f-relation",
  jsImport: "lume_cms/components/f-relation.js",
  async init(field, cmsContent) {
    const collection = cmsContent.collections[field.collection];
    console.log(cmsContent.collections);
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
      .sort((a, b) =>
        typeof a === "string"
          ? a.localeCompare(typeof b === "string" ? b : b.label)
          : a.label.localeCompare(typeof b === "string" ? b : b.label)
      );
  },
  applyChanges: applyTextChanges,
} as FieldDefinition<ResolvedRelationField>;

declare global {
  namespace Lume.CMS {
    export interface Fields {
      relation: RelationField;
    }
  }
}
