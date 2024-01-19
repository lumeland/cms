import { getUrl } from "../../../utils/string.ts";
import type { Data, ResolvedField } from "../../../types.ts";

interface Props {
  document: string;
  fields: ResolvedField[];
  data: Data;
}

export default function Template(
  { document, fields, data }: Props,
) {
  return (
    <>
      <nav aria-label="You are here:">
        <ul class="breadcrumb">
          <li>
            <a href="/">Home</a>
          </li>
          <li>
            <a>{document}</a>
          </li>
        </ul>
      </nav>
      <header class="header">
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
        </footer>
      </form>
    </>
  );
}
