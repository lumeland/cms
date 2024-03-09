import { labelify } from "../../utils/string.ts";
import { getPath } from "../../utils/path.ts";
import breadcrumb from "../breadcrumb.ts";
import createTree from "../tree.ts";

import type { Tree } from "../tree.ts";
import type Collection from "../../collection.ts";
import type { CMSContent, Version } from "../../../types.ts";

interface Props {
  options: CMSContent;
  collection: Collection;
  version?: Version;
}

export default async function template(
  { options, collection, version }: Props,
) {
  const documents = await Array.fromAsync(collection);
  const tree = createTree(documents);
  const content = folder({ options, collection, tree }).trim();

  return `
${breadcrumb(options, version, collection.name)}

<header class="header is-sticky">
  <h1 class="header-title">${labelify(collection.name)}</h1>
  ${
    collection.description
      ? `<p class="header-description">${collection.description}</p>`
      : ""
  }
  <u-filter
    class="header-filter"
    data-placeholder="Filter ${collection.name}"
    data-selector="#list > li"
  >
  </u-filter>
</header>

${
    content
      ? `<ul id="list" class="list">${content}</ul>`
      : '<p class="emptyState">No results</p>'
  }

<footer class="ly-rowStack footer is-responsive">
  <a
    href="${getPath(options, "collection", collection.name, "create")}"
    class="button is-primary"
  >
    <u-icon name="plus-circle"></u-icon>
    Create new
  </a>
</footer>
  `;
}

interface FolderProps {
  options: CMSContent;
  collection: Collection;
  tree: Tree;
}

function folder({ options, collection, tree }: FolderProps) {
  const folders: string[] = Array.from(tree.folders?.entries() || [])
    .map(([name, subTree]) => `
    <li>
      <details open class="accordion">
        <summary>${name}</summary>
        <ul>
          ${folder({ options, collection, tree: subTree })}
        </ul>
      </details>
    </li>`);

  return `
  ${folders.join("")}
  ${files({ options, collection, files: tree.files })}
  `;
}

interface FilesProps {
  options: CMSContent;
  collection: Collection;
  files?: Map<string, string>;
}

function files(
  { options, collection, files }: FilesProps,
) {
  if (!files) {
    return "";
  }

  return Array.from(files.entries()).map(([name, file]) => `
  <li>
    <a
      href="${getPath(options, "collection", collection.name, "edit", file)}"
      class="list-item"
      title="${name}"
    >
      <u-icon name="file"></u-icon>
      ${labelify(name)}
    </a>
  </li>`).join("");
}
