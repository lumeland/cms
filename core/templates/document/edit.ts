import { escape } from "../../../deps/std.ts";
import { getPath } from "../../utils/path.ts";
import { prepareField } from "../../utils/data.ts";
import breadcrumb from "../breadcrumb.ts";

import type Document from "../../document.ts";
import type { CMSContent, Version } from "../../../types.ts";

interface Props {
  options: CMSContent;
  document: Document;
  version?: Version;
}

export default async function template(
  { options, document, version }: Props,
) {
  const data = await document.read(true);
  const fields = await Promise.all(document.fields.map(async (field) => `
    <${field.tag}
      data-nameprefix="changes"
      data-value="${escape(JSON.stringify(data[field.name] ?? null))}"
      data-field="${escape(JSON.stringify(await prepareField(field)))}"
    >
    </${field.tag}>
  `));

  return `
${breadcrumb(options, version, document.name)}

<u-form>
  <header class="header">
    <h1 class="header-title">Editing ${document.name}</h1>
  </header>
  <form
    action="${getPath(options.basePath, "document", document.name)}"
    method="post"
    class="form"
    enctype="multipart/form-data"
  >
    ${fields.join("")}

    <footer class="footer ly-rowStack is-responsive">
      <button class="button is-primary" type="submit">Save changes</button>
      <u-pagepreview class="ly-rowStack" data-url="${
    document.url || ""
  }" data-src="${document.src}"></u-pagepreview>
    </footer>
  </form>
</u-form>
`;
}
