import { getUrl, labelify } from "../../../utils/string.ts";

interface Props {
  collection: string;
  documents: string[];
}

export default function Template({ collection, documents }: Props) {
  return (
    <>
      <header class="header">
        <nav class="header-nav">
          <a href="/" class="button is-link">
            <u-icon name="arrow-left"></u-icon>
            Back
          </a>
        </nav>
        <h1 class="header-title">Content of {collection}</h1>
        <u-filter
          class="header-filter"
          data-placeholder={`Filter ${collection}`}
          data-selector="#list > li"
        >
        </u-filter>
      </header>

      <ul id="list" class="list">
        {documents.map((document) => (
          <li>
            <a
              href={getUrl("collection", collection, "edit", document)}
              class="list-item"
              title={document}
            >
              <u-icon name="file"></u-icon>
              {labelify(document)}
            </a>
          </li>
        ))}
      </ul>

      <footer class="ly-rowStack footer">
        <a
          href={getUrl("collection", collection, "create")}
          class="button is-primary"
        >
          <u-icon name="plus-circle"></u-icon>
          Create new
        </a>
      </footer>
    </>
  );
}
