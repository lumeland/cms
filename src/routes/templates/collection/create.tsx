import { getPath } from "../../../utils/path.ts";

import type { ResolvedField } from "../../../types.ts";

interface Props {
  collection: string;
  fields: ResolvedField[];
}

export default function Template({ collection, fields }: Props) {
  return (
    <>
      <nav aria-label="You are here:">
        <ul class="breadcrumb">
          <li>
            <a href={getPath()}>Home</a>
          </li>
          <li>
            <a href={getPath("collection", collection)}>{collection}</a>
          </li>
          <li>
            <a>New file</a>
          </li>
        </ul>
      </nav>
      <header class="header">
        <h1 class="header-title">
          Creating new file
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
        action={getPath("collection", collection, "create")}
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
