import { getUrl } from "../../../utils/string.ts";
import type { Data, ResolvedField } from "../../../types.ts";

interface Props {
  collection: string;
  document: string;
  fields: ResolvedField[];
  data: Data;
  previewUrl?: string;
}

export default function Template(
  { collection, document, fields, data, previewUrl }: Props,
) {
  return (
    <>
      <header class="header">
        <a href={getUrl("collection", collection)} class="button is-link">
          <u-icon name="arrow-left"></u-icon>
          Back
        </a>
        <h1 class="header-title">
          Editing file &nbsp;&nbsp;
          <input
            class="input is-narrow is-inline"
            id="_id"
            type="text"
            name="_id"
            value={document}
            placeholder="Rename the file…"
            form="form-edit"
            aria-label="File name"
            required
          />
        </h1>
        {previewUrl &&
          (
            <script
              dangerouslySetInnerHTML={{
                __html: `
          window.parent.changePreview("${previewUrl}");
        `,
              }}
            >
            </script>
          )}
      </header>
      <form
        action={getUrl("collection", collection, "edit", document)}
        method="post"
        class="form"
        enctype="multipart/form-data"
        id="form-edit"
      >
        {fields.map((field) => {
          return (
            <field.tag
              data-nameprefix="changes"
              data-value={JSON.stringify(data[field.name] ?? null)}
              data-field={JSON.stringify(field)}
            >
            </field.tag>
          );
        })}
        <footer class="footer ly-rowStack">
          <button class="button is-primary" type="submit">
            <u-icon name="check" />
            Save changes
          </button>
          <button
            class="button is-secondary"
            type="submit"
            formAction={getUrl("collection", collection, "delete", document)}
            data-confirm="Are you sure?"
          >
            <u-icon name="trash" />
            Delete
          </button>
        </footer>
      </form>
    </>
  );
}
