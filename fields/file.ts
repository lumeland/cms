import { transform } from "./utils.ts";
import { normalizePath } from "../core/utils/path.ts";
import { posix } from "../deps/std.ts";
import type { FieldDefinition, InputField, ResolvedField } from "../types.ts";

/** Field for file values */
interface FileField extends InputField<ResolvedFileField> {
  type: "file";
  value?: string;

  /** The name of the upload entity to use */
  upload?: string;

  /** The public path to the uploads */
  publicPath?: string;
}

interface ResolvedFileField extends FileField, ResolvedField {
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

    const name = field.upload.split(":")[0];
    const upload = cmsContent.uploads[name];

    if (!upload) {
      throw new Error(
        `No upload found for file field '${field.name}'`,
      );
    }

    if (!field.publicPath) {
      const { publicPath } = upload;
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
      data[field.name] = transform(field, current, cmsContent);
      return;
    }
    const upload = field.upload || "default";
    let [uploadKey, uploadPath = ""] = upload.split(":");
    const uploads = cmsContent.uploads[uploadKey];

    if (!uploads) {
      throw new Error(
        `No upload found for file field '${field.name}'`,
      );
    }

    uploadPath = uploadPath.replace(
      "{document_dirname}",
      posix.dirname(document.name),
    );

    const entry = uploads.get(normalizePath(uploadPath, uploaded.name));
    await entry.writeFile(uploaded);
    data[field.name] = transform(
      field,
      normalizePath(
        uploads.publicPath,
        uploadPath,
        uploaded.name,
      ),
      cmsContent,
    );
  },
} as FieldDefinition<ResolvedFileField>;

declare global {
  namespace Lume.CMS {
    export interface Fields {
      file: FileField;
    }
    export interface ResolvedFields {
      file: ResolvedFileField;
    }
  }
}
