import { getPath } from "../../utils/path.ts";
import breadcrumb from "../breadcrumb.ts";
import createTree from "../tree.ts";

import type { Tree } from "../tree.ts";
import type Collection from "../../collection.ts";
import type { CMSContent, Version } from "../../../types.ts";

interface Props {
  options: CMSContent<string>;
  collection: Collection<string>;
  version?: Version;
}

export default async function template(
  { options, collection, version }: Props,
) {
  const documents = await Array.fromAsync(collection);
  const tree = createTree(documents);
  const content = folder({ options, collection, tree }).trim();

  return `
${breadcrumb(options, version, collection.label)}

<header class="header is-sticky">
  <h1 class="header-title">${collection.label}</h1>
  ${
    collection.description
      ? `<p class="header-description">${collection.description}</p>`
      : ""
  }
  <u-filter
    class="header-filter"
    data-placeholder="Filter ${collection.label}"
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
  ${
    collection.permissions.create
      ? `
  <a
    href="${getPath(options.basePath, "collection", collection.name, "create")}"
    class="button is-primary"
  >
    <u-icon name="plus-circle"></u-icon>
    Create new
  </a>
  `
      : ""
  }
</footer>
  `;
}

interface FolderProps {
  options: CMSContent<string>;
  collection: Collection<string>;
  tree: Tree;
}

function folder({ options, collection, tree }: FolderProps) {
  const content: string[] = Array.from([
    ...tree.folders?.entries() || [],
    ...tree.files?.entries() || [],
  ])
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, child]) => {
      return typeof child === "string"
        ? printFile(name, child, collection, options)
        : printFolder(name, child, collection, options);
    });

  return content.join("");
}

function printFolder(
  name: string,
  tree: Tree,
  collection: Collection<string>,
  options: CMSContent<string>,
) {
  return `<li>
      <details open class="accordion">
        <summary>${name}</summary>
        <ul>
          ${folder({ options, collection, tree })}
        </ul>
      </details>
      <div class="list-actions">
        <a
          href="${
    getPath(options.basePath, "collection", collection.name, "create")
  }?folder=${tree.path}"
          title="Create new item inside this folder"
          class="buttonIcon"
        >
          <u-icon name="plus-circle"></u-icon>
        </a>
      </div>
    </li>`;
}

function printFile(
  name: string,
  path: string,
  collection: Collection<string>,
  options: CMSContent<string>,
) {
  return `
  <li>
    <a
      href="${
    getPath(options.basePath, "collection", collection.name, "edit", path)
  }"
      class="list-item"
      title="${name}"
    >
      <u-icon name="file"></u-icon>
      <div class="list-item-header">
        <strong>${name}</strong>
      </div>
    </a>
  </li>`;
}
