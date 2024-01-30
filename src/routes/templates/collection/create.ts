import { escape } from "std/html/entities.ts";
import { getPath } from "../../../utils/path.ts";
import breadcrumb from "../breadcrumb.ts";

import type { ResolvedField, Version } from "../../../types.ts";

interface Props {
  collection: string;
  fields: ResolvedField[];
  version?: Version;
}

export default function template({ collection, fields, version }: Props) {
  return `
${
    breadcrumb(version, [
      collection,
      getPath("collection", collection),
    ], "New file")
  }

<header class="header">
  <h1 class="header-title">
    Creating new file
    <input
      class="input is-inline"
      id="_id"
      type="text"
      name="_id"
      placeholder="Name your file…"
      form="form-create"
      aria-label="File name"
      required
      autofocus
    >
  </h1>
</header>
<form
  action="${getPath("collection", collection, "create")}"
  method="post"
  class="form"
  enctype="multipart/form-data"
  id="form-create"
>
  ${
    fields.map((field) => `
      <${field.tag}
        data-nameprefix="changes"
        data-field="${escape(JSON.stringify(field))}"
      >
      </${field.tag}>
    `).join("")
  }
  <footer class="footer ly-rowStack">
    <button class="button is-primary" type="submit">Create</button>
  </footer>
</form>
  `;
}
