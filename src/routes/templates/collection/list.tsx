import { labelify } from "../../../utils/string.ts";
import { getPath } from "../../../utils/path.ts";
import { EntryMetadata } from "../../../types.ts";

interface Props {
  collection: string;
  documents: EntryMetadata[];
}

export default function Template({ collection, documents }: Props) {
  return (
    <>
      <nav aria-label="You are here:">
        <ul class="breadcrumb">
          <li>
            <a href={getPath()}>Home</a>
          </li>
          <li>
            <a>{collection}</a>
          </li>
        </ul>
      </nav>
      <header class="header">
        <h1 class="header-title">Content of {collection}</h1>
        <u-filter
          class="header-filter"
          data-placeholder={`Filter ${collection}`}
          data-selector="#list > li"
        >
        </u-filter>
      </header>

      <ul id="list" class="list">
        {documents.map(({ id }) => (
          <li>
            <a
              href={getPath("collection", collection, "edit", id)}
              class="list-item"
              title={id}
            >
              <u-icon name="file"></u-icon>
              {labelify(id)}
            </a>
          </li>
        ))}
      </ul>

      <footer class="ly-rowStack footer">
        <a
          href={getPath("collection", collection, "create")}
          class="button is-primary"
        >
          <u-icon name="plus-circle"></u-icon>
          Create new
        </a>
      </footer>
    </>
  );
}
