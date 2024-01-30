import { labelify } from "../../../utils/string.ts";
import { getPath } from "../../../utils/path.ts";
import breadcrumb from "../breadcrumb.ts";

import type { EntryMetadata, Version } from "../../../types.ts";

interface Props {
  collection: string;
  documents: EntryMetadata[];
  version?: Version;
}

export default function template({ collection, documents, version }: Props) {
  return `
${breadcrumb(version, collection)}

<header class="header is-sticky">
  <h1 class="header-title">Content of ${collection}</h1>
  <u-filter
    class="header-filter"
    data-placeholder="Filter ${collection}"
    data-selector="#list > li"
  >
  </u-filter>
</header>

<ul id="list" class="list">
  ${
    documents.map(({ id }) => `
    <li>
      <a
        href="${getPath("collection", collection, "edit", id)}"
        class="list-item"
        title="${id}"
      >
        <u-icon name="file"></u-icon>
        ${labelify(id)}
      </a>
    </li>`).join("")
  }
</ul>

<footer class="ly-rowStack footer is-responsive">
  <a
    href="${getPath("collection", collection, "create")}"
    class="button is-primary"
  >
    <u-icon name="plus-circle"></u-icon>
    Create new
  </a>
</footer>
  `;
}
