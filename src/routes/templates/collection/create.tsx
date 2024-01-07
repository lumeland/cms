import type { ResolvedField } from "../../../types.ts";

interface Props {
  collection: string;
  fields: ResolvedField[];
}

export default function Template({ collection, fields }: Props) {
  return (
    <>
      <header class="header">
        <a href={`/collection/${collection}`} class="button is-link">
          <u-icon name="arrow-left"></u-icon>
          Back
        </a>
        <h1 class="header-title">
          Creating new file &nbsp;&nbsp;
          <input
            class="input is-narrow is-inline"
            id="_id"
            type="text"
            name="_id"
            placeholder="Name your file…"
            form="form-create"
            aria-label="File name"
            required
          />
        </h1>
      </header>
      <form
        action={`/collection/${collection}/create`}
        method="post"
        class="form"
        enctype="multipart/form-data"
        id="form-create"
      >
        {fields.map((field) => {
          return (
            <field.tag
              data-nameprefix="changes"
              data-field={JSON.stringify(field)}
            >
            </field.tag>
          );
        })}
        <footer class="footer ly-rowStack">
          <button class="button is-primary" type="submit">Create</button>
        </footer>
      </form>
    </>
  );
}
