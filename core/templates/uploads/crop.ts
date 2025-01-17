import { getPath } from "../../utils/path.ts";
import breadcrumb from "../breadcrumb.ts";

import type { CMSContent, Version } from "../../../types.ts";
import type Upload from "../../upload.ts";

interface Props {
  options: CMSContent;
  file: string;
  upload: Upload;
  version?: Version;
}

export default function template(
  { options, file, upload, version }: Props,
) {
  const { basePath } = options;
  const src = getPath(basePath, "uploads", upload.name, "raw", file);

  return `
${
    breadcrumb(options, version, [
      upload.label,
      getPath(basePath, "uploads", upload.name),
    ], [
      "File details",
      getPath(basePath, "uploads", upload.name, "file", file),
    ], "Crop image")
  }

<header class="header">
  <h1 class="header-title">
    Edit ${file}
  </h1>
</header>

<form
  method="post"
  class="form"
  id="form-edit"
>
  <input type="hidden" name="x">
  <input type="hidden" name="y">
  <input type="hidden" name="width">
  <input type="hidden" name="height">

  <u-cropper data-src="${src}"></u-cropper>
  
  <footer class="footer ly-rowStack">
    <a class="button is-secondary" href="${
    getPath(basePath, "uploads", upload.name, "file", file)
  }">
      Cancel
    </a>
    <button class="button is-primary" type="submit">
      <u-icon name="check"></u-icon>
      Crop image
    </button>
  </footer>
</form>
  `;
}
