import { format } from "std/fmt/bytes.ts";

interface Props {
  file: string;
  type: string;
  size: number;
  collection: string;
}

export default function Template({ type, file, collection, size }: Props) {
  const src = `/files/${collection}/raw/${file}`;

  return (
    <>
      <header class="header">
        <a href={`/files/${collection}`} class="button is-link">
          <u-icon name="arrow-left"></u-icon>
          Back
        </a>
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
        <p class="header-description">
          {type} ({format(size)})
        </p>
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
            formAction={`/files/${collection}/delete/${file}`}
            data-confirm="Are you sure?"
          >
            <u-icon name="trash" />
            Delete
          </button>
        </footer>
      </form>

      <figure class="preview">
        <div class="preview-media">
          <Preview type={type} src={src} />
        </div>
        <figcaption class="preview-caption">
          <a href={src} download class="button is-secondary">
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
