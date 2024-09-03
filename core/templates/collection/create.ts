import { escape } from "../../../deps/std.ts";
import { getPath } from "../../utils/path.ts";
import { prepareField } from "../../utils/data.ts";
import breadcrumb from "../breadcrumb.ts";

import type Collection from "../../collection.ts";
import type { CMSContent, Version } from "../../../types.ts";

interface Props {
  options: CMSContent;
  collection: Collection;
  version?: Version;
  folder?: string;
}

export default async function template(
  { options, collection, version, folder }: Props,
) {
  const { basePath } = options;
  const fields = await Promise.all(collection.fields.map(async (field) => `
    <${field.tag}
      data-nameprefix="changes"
      data-field="${escape(JSON.stringify(await prepareField(field)))}"
    >
    </${field.tag}>
  `));

  return `
${
    breadcrumb(options, version, [
      collection.name,
      getPath(basePath, "collection", collection.name),
    ], "New file")
  }

<header class="header">
  <h1 class="header-title">
    Creating new file
    <label class="header-file">
      ${folder || ""}
      <input
        class="input is-inline"
        id="_id"
        type="text"
        name="_id"
        placeholder="Name your file…"
        form="form-create"
        aria-label="File name"
        ${collection.nameField ? "" : "required autofocus"}
      >
    </label>
  </h1>
</header>
<form
  action="${getPath(basePath, "collection", collection.name, "create")}"
  method="post"
  class="form"
  enctype="multipart/form-data"
  id="form-create"
>
  <input type="hidden" name="_prefix" value="${folder || ""}">
  ${fields.join("")}
  <footer class="footer ly-rowStack">
    <button class="button is-primary" type="submit">Create</button>
  </footer>
</form>
  `;
}
