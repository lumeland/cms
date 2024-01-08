import { getUrl } from "../../../utils/string.ts";
import type { Data, ResolvedField } from "../../../types.ts";

interface Props {
  document: string;
  fields: ResolvedField[];
  data: Data;
  previewUrl?: string;
}

export default function Template(
  { document, fields, data, previewUrl }: Props,
) {
  return (
    <>
      <header class="header">
        <nav class="header-nav">
          <a href="/" class="button is-link">
            <u-icon name="arrow-left"></u-icon>
            Back
          </a>
        </nav>
        <h1 class="header-title">Editing {document}</h1>
      </header>
      <form
        action={getUrl("document", document)}
        method="post"
        class="form"
        enctype="multipart/form-data"
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
          <button class="button is-primary" type="submit">Save changes</button>
          {previewUrl &&
            (
              <a
                class="button is-secondary"
                target="_preview"
                href={previewUrl}
              >
                <u-icon name="arrow-square-out" />
                Preview
              </a>
            )}
        </footer>
      </form>
    </>
  );
}
