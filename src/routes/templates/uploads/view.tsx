import { getUrl } from "../../../utils/string.ts";
import { format } from "std/fmt/bytes.ts";

interface Props {
  file: string;
  publicPath: string;
  type: string;
  size: number;
  collection: string;
}

export default function Template(
  { type, file, collection, size, publicPath }: Props,
) {
  const src = getUrl("uploads", collection, "raw", file);

  return (
    <>
      <header class="header">
        <nav class="header-nav">
          <a href={getUrl("uploads", collection)} class="button is-link">
            <u-icon name="arrow-left"></u-icon>
            All uploads
          </a>
        </nav>
        <h1 class="header-title">
          Details of &nbsp;&nbsp;
          <input
            class="input is-narrow is-inline"
            id="_id"
            type="text"
            name="_id"
            value={file}
            placeholder="Rename the file…"
            form="form-edit"
            aria-label="File name"
            required
          />
        </h1>
        <dl class="header-description">
          <dt>Public path:</dt>
          <dd>
            {publicPath} <u-copy text={publicPath}></u-copy>
          </dd>
          <dt>Type:</dt>
          <dd>{type}</dd>
          <dt>Size:</dt>
          <dd>{format(size)}</dd>
        </dl>
      </header>

      <form
        method="post"
        class="form"
        enctype="multipart/form-data"
        id="form-edit"
      >
        <div class="field">
          <input
            aria-label="Update"
            id="new-file"
            type="file"
            name="file"
            class="inputFile"
          />
        </div>
        <footer class="footer ly-rowStack">
          <button class="button is-primary" type="submit">
            <u-icon name="check" />
            Update file
          </button>
          <button
            class="button is-secondary"
            formAction={getUrl("uploads", collection, "delete", file)}
            data-confirm="Are you sure?"
          >
            <u-icon name="trash" />
            Delete
          </button>
        </footer>
      </form>

      <figure class="preview">
        <u-preview class="preview-media" src={src} />
        <figcaption class="preview-caption">
          <a href={src} download={file} class="button is-secondary">
            <u-icon name="download-simple" />
            Download file
          </a>
        </figcaption>
      </figure>
    </>
  );
}

interface PreviewProps {
  type: string;
  src: string;
}

function Preview({ type, src }: PreviewProps) {
  if (type.startsWith("image/")) {
    return <img src={src} alt="Preview" />;
  }

  return <p>Cannot preview</p>;
}
