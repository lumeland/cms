import { labelify } from "../../utils/string.ts";
import { getPath, normalizePath } from "../../utils/path.ts";
import breadcrumb from "../breadcrumb.ts";
import createTree from "../tree.ts";

import type { Tree } from "../tree.ts";
import type Upload from "../../upload.ts";
import type { CMSContent, Version } from "../../../types.ts";

interface Props {
  options: CMSContent;
  upload: Upload;
  version?: Version;
}

export default async function template(
  { options, upload, version }: Props,
) {
  const { publicPath, name } = upload;
  const files = await Array.fromAsync(upload);
  const tree = createTree(files);
  const content = folder({ options, collection: name, tree, publicPath })
    .trim();

  return `
${breadcrumb(options, version, name)}

<header class="header is-sticky">
  <h1 class="header-title">${labelify(name)}</h1>
  ${
    upload.description
      ? `<p class="header-description">${upload.description}</p>`
      : ""
  }
  <u-filter
    class="header-filter"
    data-placeholder="Search files in ${labelify(name)}"
    data-selector="#list li"
  >
  </u-filter>
</header>

${
    content
      ? `<ul id="list" class="list">${content}</ul>`
      : '<p class="emptyState">No results</p>'
  }

<form
  method="post"
  class="footer ly-rowStack is-responsive"
  enctype="multipart/form-data"
  action="${getPath(options.basePath, "uploads", name, "create")}"
>
  <input
    aria-label="Add file"
    id="new-file"
    type="file"
    name="file"
    required
    class="inputFile"
  >
  <button class="button is-primary" type="submit">
    <u-icon name="upload-simple"></u-icon>
    Upload file
  </button>
</form>
  `;
}

interface FolderProps {
  options: CMSContent;
  collection: string;
  publicPath: string;
  tree: Tree;
}

function folder({ options, collection, publicPath, tree }: FolderProps) {
  const folders: string[] = Array.from(tree.folders?.entries() || [])
    .map(([name, subTree]) => `
    <li>
      <details open class="accordion">
        <summary>${name}</summary>
        <ul>
          ${folder({ options, collection, publicPath, tree: subTree })}
        </ul>
      </details>
    </li>`);

  return `
  ${folders.join("")}
  ${files({ options, collection, publicPath, files: tree.files })}
  `;
}

interface FilesProps {
  options: CMSContent;
  collection: string;
  publicPath: string;
  files?: Map<string, string>;
}

function files(
  { options, collection, files, publicPath }: FilesProps,
) {
  if (!files) {
    return "";
  }

  const { basePath } = options;

  return Array.from(files.entries()).map(([name, file]) => `
  <li>
    <a
      href="${getPath(basePath, "uploads", collection, "file", file)}"
      class="list-item"
    >
      <u-icon-file path="${file}"></u-icon-file>
      ${name}
    </a>
    <u-popover>
      <button class="buttonIcon" type="button">
        <u-icon name="eye"></u-icon>
      </button>
      <template>
        <u-preview
          id="preview_${file}"
          data-src="${getPath(basePath, "uploads", collection, "raw", file)}"
        >
        </u-preview>
      </template>
    </u-popover>
    <u-copy text="${normalizePath(publicPath, file)}"></u-copy>
  </li>`).join("");
}
