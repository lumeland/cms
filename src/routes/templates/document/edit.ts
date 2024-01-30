import { escape } from "std/html/entities.ts";
import { getPath } from "../../../utils/path.ts";
import breadcrumb from "../breadcrumb.ts";

import type { Data, ResolvedField, Version } from "../../../types.ts";

interface Props {
  document: string;
  fields: ResolvedField[];
  data: Data;
  version?: Version;
}

export default function template(
  { document, fields, data, version }: Props,
) {
  return `
${breadcrumb(version, document)}

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
