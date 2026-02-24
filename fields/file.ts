import { toRelativePaths, toAbsolutePaths, transform } from "./utils.ts";
import { getRelativePath, normalizePath } from "../core/utils/path.ts";
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

  /**
   * Prefer to store the value as a relative path to the owner document.
   * @default false
   */
  relativePath?: boolean;
}

interface ResolvedFileField extends FileField, ResolvedField {
}

export default {
  tag: "f-file",
  jsImport: "lume_cms/components/f-file.js",
  init(field, cmsContent, data, document) {
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

    if (field.relativePath && data && document) {
      // Convert back to an absolute path
      data[field.name] = toAbsolutePaths(
        data[field.name],
        posix.join.bind(posix, posix.dirname(document.source.path)),
      );
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
    // To store the path as relative if needed
    const getRelativePathBound = getRelativePath.bind(null, posix.dirname(document.source.path));
    if (!uploaded) {
      data[field.name] = transform(
        field,
        field.relativePath
          ? toRelativePaths(current ?? '', getRelativePathBound)
          : current,
      );
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
      field.relativePath
        ? toRelativePaths(entry.source.path, getRelativePathBound)
        : normalizePath(
            uploads.publicPath,
            uploadPath,
            uploaded.name,
        ),
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
