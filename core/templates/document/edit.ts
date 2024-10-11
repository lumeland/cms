import { escape } from "../../../deps/std.ts";
import { getPath } from "../../utils/path.ts";
import { getViews, prepareField } from "../../utils/data.ts";
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
  const fields = await Promise.all(
    document.fields.map((field) => prepareField(field, options)),
  );

  const views = new Set();
  document.fields.forEach((field) => getViews(field, views));

  return `
${breadcrumb(options, version, document.name)}

<u-form>
  <header class="header">
    <h1 class="header-title">Editing ${document.name}</h1>
  </header>
  ${
    document.views
      ? `<u-views data-target="form-edit" data-state="${
        escape(JSON.stringify(document.views || []))
      }" data-views="${
        escape(JSON.stringify(Array.from(views)))
      }"><strong class="field-label">View:</strong></u-views>`
      : ""
  }
  <form
    action="${getPath(options.basePath, "document", document.name)}"
    method="post"
    class="form"
    id="form-edit"
    enctype="multipart/form-data"
  >
    <u-fields data-fields="${escape(JSON.stringify(fields))}" data-value="${
    escape(JSON.stringify(data))
  }"></u-fields>

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
