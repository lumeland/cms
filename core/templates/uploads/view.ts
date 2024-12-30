import { getPath } from "../../utils/path.ts";
import { formatBytes } from "../../../deps/std.ts";
import breadcrumb from "../breadcrumb.ts";
import { formatSupported } from "../../../deps/sharp.ts";

import type { CMSContent, Version } from "../../../types.ts";

interface Props {
  options: CMSContent;
  file: string;
  publicPath: string;
  type: string;
  size: number;
  collection: string;
  version?: Version;
}

export default function template(
  { options, type, file, collection, size, publicPath, version }: Props,
) {
  const { basePath } = options;
  const src = getPath(basePath, "uploads", collection, "raw", file);

  return `
${
    breadcrumb(options, version, [
      collection,
      getPath(basePath, "uploads", collection),
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
        getPath(basePath, "uploads", collection, "crop", file)
      }" class="button is-secondary">
      <u-icon name="crop"></u-icon>
      Crop image
    </a>`
      : ""
  }
    <u-confirm data-message="Are you sure?">
      <button
        class="button is-secondary"
        formAction="${getPath(basePath, "uploads", collection, "delete", file)}"
      >
        <u-icon name="trash"></u-icon>
        Delete
      </button>
    </u-confirm>
  </footer>
</form>

<figure class="preview">
  <u-preview class="preview-media" data-src="${src}"></u-preview>
  <figcaption class="preview-caption ly-rowStack">
    <a href="${src}" download="${file}" class="button is-secondary">
      <u-icon name="download-simple"></u-icon>
      Download file
    </a>
  </figcaption>
</figure>
  `;
}
