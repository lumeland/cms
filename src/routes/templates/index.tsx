import { getUrl, labelify } from "../../utils/string.ts";

interface Props {
  collections: string[];
  documents: string[];
  files: string[];
}

export default function Template({ collections, documents, files }: Props) {
  return (
    <>
      <header class="header">
        <h1 class="header-title">Welcome</h1>
      </header>

      <ul class="list">
        {collections.map((collection) => (
          <li>
            <a href={getUrl("collection", collection)} class="list-item">
              <u-icon name="folder-fill"></u-icon>
              {labelify(collection)}
            </a>
          </li>
        ))}
        {documents.map((document) => (
          <li>
            <a
              href={getUrl("document", document)}
              class="list-item"
              title={document}
            >
              <u-icon name="file"></u-icon>
              {labelify(document)}
            </a>
          </li>
        ))}
        {files.map((file, index) => (
          <li class={index === 0 ? "is-separated" : ""}>
            <a href={getUrl("files", file)} class="list-item">
              <u-icon name="image-square-fill"></u-icon>
              {labelify(file)}
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}
