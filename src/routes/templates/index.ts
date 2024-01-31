import { labelify } from "../../utils/string.ts";
import { getPath } from "../../utils/path.ts";
import breadcrumb from "./breadcrumb.ts";

import type { Versioning } from "../../types.ts";

interface Props {
  collections: string[];
  documents: string[];
  uploads: string[];
  versioning?: Versioning;
}

export default async function template(
  { collections, documents, uploads, versioning }: Props,
) {
  return `
${breadcrumb(await versioning?.current())}

<header class="header">
  <h1 class="header-title">
    Lume CMS
  </h1>
</header>

<ul class="list">
  ${
    collections.map((collection) => `
  <li>
    <a href="${getPath("collection", collection)}" class="list-item">
      <u-icon name="folder-fill"></u-icon>
      ${labelify(collection)}
    </a>
  </li>`).join("")
  }

  ${
    documents.map((document) => `
  <li>
    <a
      href="${getPath("document", document)}"
      class="list-item"
      title="${document}"
    >
      <u-icon name="file"></u-icon>
      ${labelify(document)}
    </a>
  </li>`).join("")
  }
      
  ${
    uploads.map((name) => `
  <li>
    <a href="${getPath("uploads", name)}" class="list-item">
      <u-icon name="image-square-fill"></u-icon>
      ${labelify(name)}
    </a>
  </li>`).join("")
  }

</ul>

${versioning && await versions(versioning)}
`;
}

async function versions(versioning: Versioning) {
  return `
<header class="subheader" id="versions">
  <h2>Available versions</h2>
</header>

<ul class="list">
  ${
    (await Array.fromAsync(versioning)).map((version) => `
  <li>
    ${
      version.isCurrent
        ? `<span class="list-item">
            <u-icon class="is-version ${
          version.isProduction ? "is-production" : ""
        }" name="check-circle"></u-icon> ${version.name}
          </span>`
        : `<form class="list-item" method="post" action="${
          getPath("versions", "change")
        }">
            <input type="hidden" name="name" value="${version.name}">
            <button>
              <u-icon name="circle"></u-icon>
              ${version.name}
            </button>
          </form>`
    }

    ${
      !version.isProduction &&
        `<u-confirm data-message="Are you sure?">
      <form method="post" action="${getPath("versions", "delete")}">
        <input type="hidden" name="name" value="${version.name}">
        <button class="buttonIcon" aria-label="Delete">
          <u-icon name="trash"></u-icon>
        </button>
      </form>
    </u-confirm>` || ""
    }

    <form method="post" action="${getPath("versions", "publish")}">
      <input type="hidden" name="name" value="${version.name}">
      <button class="button is-secondary">
      <u-icon name="rocket-launch"></u-icon>
        Publish
      </button>
    </form>
  </li>`).join("")
  }
</ul>

  <u-modal-trigger data-target="modal-new-version">
    <button class="button is-secondary">New version</button>
  </u-modal-trigger>

  <dialog class="modal is-center" id="modal-new-version">
  <form
    method="post"
    action="${getPath("versions", "create")}"
  >
    <div class="field">
      <label for="version-name">Name of the new version</label>
      <input
        id="version-name"
        class="input is-narrow"
        type="text"
        required
        name="name"
      >

      <footer class="field-footer">
        <button class="button is-primary">Create version</button>
      </footer>
    </div>
  </form>
</dialog>
`;
}
