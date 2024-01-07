import { labelify } from "../../utils/string.ts";

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
        {collections.map((id) => (
          <li>
            <a href={`/collection/${id}`} class="list-item">
              <u-icon name="folder-fill"></u-icon>
              {labelify(id)}
            </a>
          </li>
        ))}
        {documents.map((id) => (
          <li>
            <a href={`/document/${id}`} class="list-item">
              <u-icon name="file"></u-icon>
              {labelify(id)}
            </a>
          </li>
        ))}
        {files.map((id, index) => (
          <li class={index === 0 ? "is-separated" : ""}>
            <a href={`/files/${id}`} class="list-item">
              <u-icon name="image-square-fill"></u-icon>
              {labelify(id)}
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}
