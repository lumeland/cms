import { normalizePath } from "../core/utils/path.ts";
import { posix } from "../deps/std.ts";
import type { FieldDefinition, FieldResolved } from "../types.ts";
import type { InputField } from "./types.ts";

/** Field for file values */
interface FileField extends InputField<FileFieldResolved> {
  type: "file";
  value?: string;

  /** The name of the upload entity to use */
  upload?: string;

  /** The public path to the uploads */
  publicPath?: string;
}

interface FileFieldResolved extends FileField, FieldResolved {
}

export default {
  tag: "f-file",
  jsImport: "lume_cms/components/f-file.js",
  init(field, cmsContent) {
    if (!field.upload) {
      field.upload = Object.keys(cmsContent.uploads)[0];

      if (!field.upload) {
        throw new Error(
          `No uploads found for file field '${field.name}'`,
        );
      }
    }

    if (!field.publicPath) {
      const name = field.upload.split(":")[0];
      const { publicPath } = cmsContent.uploads[name];
      field.publicPath = publicPath;
    }
  },
  async applyChanges(data, changes, field, document, cmsContent) {
    const value = changes[field.name] as
      | { current?: string; uploaded?: File }
      | undefined;

    if (!value) {
      return;
    }

    const { current, uploaded } = value;

    if (!uploaded) {
      data[field.name] = current;
      return;
    }
    const upload = field.upload || "default";
    let [uploadKey, uploadPath = ""] = upload.split(":");
    const { storage, publicPath } = cmsContent.uploads[uploadKey];

    if (!storage) {
      throw new Error(
        `No storage found for file field '${field.name}'`,
      );
    }

    uploadPath = uploadPath.replace(
      "{document_dirname}",
      posix.dirname(document.name),
    );

    const entry = storage.get(normalizePath(uploadPath, uploaded.name));
    await entry.writeFile(uploaded);
    data[field.name] = normalizePath(
      publicPath,
      uploadPath,
      uploaded.name,
    );
  },
} as FieldDefinition<FileFieldResolved>;

declare global {
  namespace Lume {
    export interface CMSFields {
      file: FileField;
    }
    export interface CMSResolvedFields {
      file: FileFieldResolved;
    }
  }
}
