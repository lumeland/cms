import { escape } from "std/html/entities.ts";
import { getPath } from "../../../utils/path.ts";

import type { Data, ResolvedField } from "../../../types.ts";

interface Props {
  document: string;
  fields: ResolvedField[];
  data: Data;
}

export default function template(
  { document, fields, data }: Props,
) {
  return `
<nav aria-label="You are here:">
  <ul class="breadcrumb">
    <li>
      <a href="${getPath()}">Home</a>
    </li>
    <li>
      <a>${document}</a>
    </li>
  </ul>
</nav>
<header class="header">
  <h1 class="header-title">Editing ${document}</h1>
</header>
<form
  action="${getPath("document", document)}"
  method="post"
  class="form"
  enctype="multipart/form-data"
>
  ${
    fields.map((field) => `
      <${field.tag}
        data-nameprefix="changes"
        data-value="${escape(JSON.stringify(data[field.name] ?? null))}"
        data-field="${escape(JSON.stringify(field))}"
      >
      </${field.tag}>
    `).join("")
  }

  <footer class="footer ly-rowStack is-responsive">
    <button class="button is-primary" type="submit">Save changes</button>
  </footer>
</form>
`;
}
