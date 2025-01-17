import { getPath } from "../../utils/path.ts";
import { formatBytes } from "../../../deps/std.ts";
import breadcrumb from "../breadcrumb.ts";
import { formatSupported } from "../../../deps/imagick.ts";

import type { CMSContent, Version } from "../../../types.ts";
import type Upload from "../../upload.ts";

interface Props {
  options: CMSContent;
  file: string;
  publicPath: string;
  type: string;
  size: number;
  upload: Upload;
  version?: Version;
}

export default function template(
  { options, type, file, upload, size, publicPath, version }: Props,
) {
  const { basePath } = options;
  const src = getPath(basePath, "uploads", upload.name, "raw", file);

  return `
${
    breadcrumb(options, version, [
      upload.label,
      getPath(basePath, "uploads", upload.name),
    ], "File details")
  }

<header class="header">
  <h1 class="header-title">
    Details of
    <input
      class="input is-inline"
      id="_id"
      type="text"
      name="_id"
      value="${file}"
      placeholder="Rename the file…"
      form="form-edit"
      aria-label="File name"
      required
    >
  </h1>
  <dl class="header-description">
    <dt>Public path:</dt>
    <dd>
      ${publicPath} <u-copy text="${publicPath}"></u-copy>
    </dd>
    <dt>Type:</dt>
    <dd>${type}</dd>
    <dt>Size:</dt>
    <dd>${formatBytes(size)}</dd>
  </dl>
</header>

<form
  method="post"
  class="form"
  enctype="multipart/form-data"
  id="form-edit"
>
  <div class="field">
    <input
      aria-label="Update"
      id="new-file"
      type="file"
      name="file"
      class="inputFile"
    >
  </div>
  <footer class="footer ly-rowStack">
    <button class="button is-primary" type="submit">
      <u-icon name="check"></u-icon>
      Update file
    </button>
    ${
    formatSupported(file)
      ? `<a href="${
        getPath(basePath, "uploads", upload.name, "crop", file)
      }" class="button is-secondary">
      <u-icon name="crop"></u-icon>
      Crop image
    </a>`
      : ""
  }
    <a href="${src}" download="${file}" class="buttonIcon is-secondary" aria-label="Download file" title="Download file">
      <u-icon name="download-simple"></u-icon>
    </a>
    <u-confirm data-message="Delete this file?">
      <button
        aria-label="Delete file"
        title="Delete file"
        class="buttonIcon is-secondary"
        formAction="${
    getPath(basePath, "uploads", upload.name, "delete", file)
  }"
      >
        <u-icon name="trash"></u-icon>
      </button>
    </u-confirm>
  </footer>
</form>

<figure class="preview">
  <u-preview class="preview-media" data-src="${src}"></u-preview>
</figure>
  `;
}
