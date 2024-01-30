import { labelify } from "../../utils/string.ts";
import { getPath } from "../../utils/path.ts";

import type { Versioning } from "../../types.ts";

interface Props {
  collections: string[];
  documents: string[];
  uploads: string[];
  versioning?: Versioning;
}

export default function Template(
  { collections, documents, uploads, versioning }: Props,
) {
  return (
    <>
      <header class="header">
        <h1 class="header-title">
          <svg
            viewBox="0 0 36 49"
            height="40"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g fill="none" fill-rule="evenodd">
              <path
                d="m14.05 0 2.574 1.42 4.759 3.42c.617.648.916 1.326 1.042 2.365.055.452.052.848-.004 1.278a9.466 9.466 0 0 1 1.513-1.83l.169-.156 1.646-1.501v2.228c0 2.338.581 3.886 1.974 5.922l1.577 2.258c1.518 2.324 2.214 4.626 1.975 7.672l1.24-2.249.991 1.101c1.16 1.844 1.097 4.592-.098 8.28l-.075.225 2.47-3.552.186 2.643c.151 6.658-2.392 12.356-6.967 15.867-3.074 2.358-6.334 3.675-11.418 3.606C6.594 48.85-1.4 39.31.205 27.895l.052-.347.8-5.098 1.132 5.035c.015.067.033.135.053.202l.033.101.017.045-.025-.196c-.471-3.942.175-6.488 1.863-9.247l.1-.162.091-.144.163-.253.58-.891.237-.37c.758-1.198 1.215-2.088 1.586-3.186l.056-.167.214-.66c-.864-2.023.101-4.5 1.966-6.057l3.232-1.931c.27-.374.572-.768.907-1.19l.17-.213.545-.674c-.062-.234-.038-1.065.072-2.492Z"
                fill="#FFF"
                fill-rule="nonzero"
              >
              </path>
              <path
                d="M14.199 3.784c-1.485 6.035 6.11 4.932 6.11 13.765 2.484-2.854.479-6.7 4.456-10.325 0 3.028 1.046 4.892 2.23 6.6l.256.364.11.154.22.309.33.463.218.311c1.694 2.451 3.084 5.231 1.492 11.31 1.415-.867 2.432-2.295 3.052-4.283 1.25 1.988.784 5.521-1.401 10.6 1.923-.811 3.051-1.933 3.734-3.505.149 6.572-2.426 11.954-6.735 15.179a270.622 270.622 0 0 0-.512-8.499c-.352-4.58-1.152-7.022-2.77-9.35-1.617-2.328-3.42-3.076-5.955-3.427-2.534-.35-5.042.199-7.815 1.642-2.772 1.444-4.579 4.377-3.782 6.055.797 1.678 3.366 2.76 6.364 2.658 2.997-.1 5.094-1.169 5.87-1.457.775-.29 1.101.64.509.948-.396.205-1.096.57-2.102 1.095.392 2.206.589 4.46.589 6.763 0 2.064-.037 4.347-.11 6.85-.31.01-.624.014-.94.01C7.302 47.874-.528 38.886 1.229 27.7c.261 1.163 1.22 2.53 2.593 3.1-1.534-6.93-.28-9.657 1.333-12.195l.212-.33.216-.33c.829-1.268 1.695-2.575 2.295-4.425-.31 3.12 0 4.855 1.505 6.667.888-2.639 4.163-4.847 2.897-8.093-1.267-3.245-1.146-4.507 1.919-8.311Zm-.039 22.864a.749.749 0 1 1 0 1.498.749.749 0 0 1 0-1.498Zm-3.904-.65a.749.749 0 1 1 0 1.497.749.749 0 0 1 0-1.497Zm.4-19.362c-.814.83-.637 3.25.299 5.375.936 2.124-.299 3.723-1.622 5.69.23-2.618-.01-3.24-1.135-5.254-1.124-2.014.416-4.68 2.458-5.811Zm8.005-2.838c1.905 1.655 2.58 1.82 2.788 3.525.206 1.705-.717 2.496-.348 4.722-3.891-3.196-.838-4.334-2.44-8.247ZM14.383.788c1.369 1.622 2.182 1.197 3.075 3.272.893 2.074-.225 2.545.539 5.04C13.5 5.23 16.29 4.916 14.383.786Z"
                fill="#141B1F"
              >
              </path>
            </g>
          </svg>
          Lume CMS
        </h1>
      </header>

      <ul class="list">
        {collections.map((collection) => (
          <li>
            <a href={getPath("collection", collection)} class="list-item">
              <u-icon name="folder-fill"></u-icon>
              {labelify(collection)}
            </a>
          </li>
        ))}
        {documents.map((document) => (
          <li>
            <a
              href={getPath("document", document)}
              class="list-item"
              title={document}
            >
              <u-icon name="file"></u-icon>
              {labelify(document)}
            </a>
          </li>
        ))}
        {uploads.map((name, index) => (
          <li class={index === 0 ? "is-separated" : ""}>
            <a href={getPath("uploads", name)} class="list-item">
              <u-icon name="image-square-fill"></u-icon>
              {labelify(name)}
            </a>
          </li>
        ))}
      </ul>

      {versioning && <Versions versioning={versioning} />}
    </>
  );
}

interface VersionsProps {
  versioning: Versioning;
}

async function Versions({ versioning }: VersionsProps) {
  return (
    <>
      <h2>Version manager</h2>

      <ul>
        {(await Array.fromAsync(versioning)).map((version) => (
          <li>
            {version.name}
            {version.isCurrent
              ? " (current)"
              : (
                <form method="post" action={getPath("versions", "change")}>
                  <input type="hidden" name="name" value={version.name} />
                  <button class="button is-secondary">Select</button>
                </form>
              )}
            {!version.isProduction && (
              <form method="post" action={getPath("versions", "publish")}>
                <input type="hidden" name="name" value={version.name} />
                <button class="button is-secondary">Publish</button>
              </form>
            )}
          </li>
        ))}
      </ul>
      <form
        method="post"
        action={getPath("versions", "create")}
        class="ly-rowStack"
      >
        <label for="version-name">Name of the version</label>
        <input
          id="version-name"
          class="input is-narrow"
          type="text"
          required
          name="name"
        />
        <button class="button is-primary">New version</button>
      </form>
    </>
  );
}
