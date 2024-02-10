import { escape } from "../../../deps/std.ts";
import { getPath } from "../../utils/path.ts";
import breadcrumb from "../breadcrumb.ts";

import type Document from "../../document.ts";
import type { Version } from "../../../types.ts";

interface Props {
  document: Document;
  version?: Version;
}

export default async function template(
  { document, version }: Props,
) {
  const data = await document.read();

  return `
<u-pagepreview data-src="${document.src}"></u-pagepreview>
${breadcrumb(version, document.name)}

<u-form>
  <header class="header">
    <h1 class="header-title">Editing ${document.name}</h1>
  </header>
  <form
    action="${getPath("document", document.name)}"
    method="post"
    class="form"
    enctype="multipart/form-data"
  >
    ${
    document.fields.map((field) => `
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
</u-form>
`;
}
