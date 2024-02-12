import { labelify } from "../../utils/string.ts";
import { getPath } from "../../utils/path.ts";
import breadcrumb from "../breadcrumb.ts";
import createTree from "../tree.ts";

import type { Tree } from "../tree.ts";
import type Collection from "../../collection.ts";
import type { Version } from "../../../types.ts";

interface Props {
  collection: Collection;
  version?: Version;
}

export default async function template({ collection, version }: Props) {
  const documents = await Array.fromAsync(collection);
  const tree = createTree(documents);

  return `
${breadcrumb(version, collection.name)}

<header class="header is-sticky">
  <h1 class="header-title">Content of ${collection.name}</h1>
  <u-filter
    class="header-filter"
    data-placeholder="Filter ${collection.name}"
    data-selector="#list > li"
  >
  </u-filter>
</header>

<ul id="list" class="list">
  ${folder({ collection, tree })}
</ul>

<footer class="ly-rowStack footer is-responsive">
  <a
    href="${getPath("collection", collection.name, "create")}"
    class="button is-primary"
  >
    <u-icon name="plus-circle"></u-icon>
    Create new
  </a>
</footer>
  `;
}

interface FolderProps {
  collection: Collection;
  tree: Tree;
}

function folder({ collection, tree }: FolderProps) {
  const folders: string[] = Array.from(tree.folders?.entries() || [])
    .map(([name, subTree]) => `
    <li>
      <details open class="accordion">
        <summary>${name}</summary>
        <ul>
          ${folder({ collection, tree: subTree })}
        </ul>
      </details>
    </li>`);

  return `
  ${folders.join("")}
  ${files({ collection, files: tree.files })}
  `;
}

interface FilesProps {
  collection: Collection;
  files?: Map<string, string>;
}

function files(
  { collection, files }: FilesProps,
) {
  if (!files) {
    return "";
  }

  return Array.from(files.entries()).map(([name, file]) => `
  <li>
    <a
      href="${getPath("collection", collection.name, "edit", file)}"
      class="list-item"
      title="${name}"
    >
      <u-icon name="file"></u-icon>
      ${labelify(name)}
    </a>
  </li>`).join("");
}
