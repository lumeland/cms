import { getPath } from "../utils/path.ts";
import breadcrumb from "./breadcrumb.ts";

import type { CMSContent, SiteInfo, Versioning } from "../../types.ts";
import type Document from "../document.ts";
import type Collection from "../collection.ts";
import type Upload from "../upload.ts";

interface Props {
  options: CMSContent;
  collections: Record<string, Collection>;
  documents: Record<string, Document>;
  uploads: Record<string, Upload>;
  versioning?: Versioning;
  site: SiteInfo;
}

export default async function template(
  { options, collections, documents, uploads, versioning, site }: Props,
) {
  const { basePath } = options;
  const url = site.url
    ? `<p><a href="${site.url}" target="_blank">
      ${site.url} ↗
    </a></p>`
    : "";

  return `
${breadcrumb(options, await versioning?.current())}

<header class="header">
  <h1 class="header-title">
  ${site.name}
  </h1>
  <div class="header-description">
    ${site.description ?? ""}
    ${url}
  </div>
</header>

<ul class="list">
  ${
    Object.values(collections).map((collection) => `
  <li>
    <a href="${
      getPath(basePath, "collection", collection.name)
    }" class="list-item">
      <u-icon name="folder-fill"></u-icon>
      <div class="list-item-header">
        <strong>${collection.label}</strong>
        ${collection.description ? `<p>${collection.description}</p>` : ""}
      </div>
    </a>
  </li>`).join("")
  }

  ${
    Object.values(documents).map((document) => `
  <li>
    <a
      href="${getPath(basePath, "document", document.name)}"
      class="list-item"
      title="${document.label}"
    >
      <u-icon name="file"></u-icon>
      <div class="list-item-header">
        <strong>${document.label}</strong>
        ${document.description ? `<p>${document.description}</p>` : ""}
      </div>
    </a>
  </li>`).join("")
  }

  ${
    Object.values(uploads).map((upload) => `
  <li>
    <a href="${getPath(basePath, "uploads", upload.name)}" class="list-item">
      <u-icon name="image-square-fill"></u-icon>
      <div class="list-item-header">
        <strong>${upload.label}</strong>
        ${upload.description ? `<p>${upload.description}</p>` : ""}
      </div>
    </a>
  </li>`).join("")
  }

</ul>

${site.body ? `<div class="body">${site.body}</div>` : ""}

${versioning && await versions(options, versioning) || ""}
`;
}

async function versions(options: CMSContent, versioning: Versioning) {
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
          getPath(options.basePath, "versions")
        }">
            <input type="hidden" name="action" value="change">
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
      <form method="post" action="${getPath(options.basePath, "versions")}">
        <input type="hidden" name="action" value="delete">
        <input type="hidden" name="name" value="${version.name}">
        <button class="buttonIcon" aria-label="Delete">
          <u-icon name="trash"></u-icon>
        </button>
      </form>
    </u-confirm>` || ""
    }

    <form method="post" action="${getPath(options.basePath, "versions")}">
      <input type="hidden" name="action" value="publish">
      <input type="hidden" name="name" value="${version.name}">
      <button class="button is-secondary">
        ${
      version.isProduction
        ? `<u-icon name="arrows-clockwise"></u-icon> Sync`
        : `<u-icon name="rocket-launch"></u-icon> Publish`
    }
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
    action="${getPath(options.basePath, "versions")}"
  >
    <input type="hidden" name="action" value="create">
    <div class="field">
      <label for="version-name">Name of the new version</label>
      <input
        id="version-name"
        class="input"
        type="text"
        required
        autofocus
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
