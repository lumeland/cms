import { getUrl } from "../../../utils/string.ts";

interface Props {
  collection: string;
  files: string[];
}

export default function Template({ collection, files }: Props) {
  return (
    <>
      <header class="header">
        <a href="/" class="button is-link">
          <u-icon name="arrow-left"></u-icon>
          Back
        </a>
        <h1 class="header-title">Content of {collection}</h1>
        <u-filter
          class="header-filter"
          data-placeholder={`Filter ${collection}`}
          data-selector="#list > li"
        >
        </u-filter>
      </header>

      <ul id="list" class="list">
        {files.map((file) => (
          <li>
            <a
              href={getUrl("files", collection, "file", file)}
              class="list-item"
            >
              <u-icon name="image-square-fill"></u-icon>
              {file}
            </a>
          </li>
        ))}
      </ul>

      <form
        method="post"
        class="footer ly-rowStack"
        enctype="multipart/form-data"
      >
        <input
          aria-label="Add file"
          id="new-file"
          type="file"
          name="file"
          required
          class="inputFile"
        />
        <button class="button is-primary" type="submit">
          <u-icon name="upload-simple" />
          Upload file
        </button>
      </form>
    </>
  );
}
