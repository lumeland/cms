import { labelify } from "../../utils/string.ts";
import { getPath } from "../../utils/path.ts";
import breadcrumb from "../breadcrumb.ts";

import type Collection from "../../collection.ts";
import type { Version } from "../../../types.ts";

interface Props {
  collection: Collection;
  version?: Version;
}

export default async function template({ collection, version }: Props) {
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
  ${
    (await Array.fromAsync(collection)).map(({ name }) => `
    <li>
      <a
        href="${getPath("collection", collection.name, "edit", name)}"
        class="list-item"
        title="${name}"
      >
        <u-icon name="file"></u-icon>
        ${labelify(name)}
      </a>
    </li>`).join("")
  }
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
