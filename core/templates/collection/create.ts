import { escape } from "../../../deps/std.ts";
import { getPath } from "../../utils/path.ts";
import { prepareField } from "../../utils/data.ts";
import breadcrumb from "../breadcrumb.ts";

import type Collection from "../../collection.ts";
import type { Version } from "../../../types.ts";
import { Context } from "../../../deps/hono.ts";

interface Props {
  context: Context;
  collection: Collection;
  version?: Version;
}

export default async function template(
  { context, collection, version }: Props,
) {
  const fields = await Promise.all(collection.fields.map(async (field) => `
    <${field.tag}
      data-nameprefix="changes"
      data-field="${escape(JSON.stringify(await prepareField(field)))}"
    >
    </${field.tag}>
  `));

  return `
${
    breadcrumb(context, version, [
      collection.name,
      getPath(context, "collection", collection.name),
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
  action="${getPath(context, "collection", collection.name, "create")}"
  method="post"
  class="form"
  enctype="multipart/form-data"
  id="form-create"
>
  ${fields.join("")}
  <footer class="footer ly-rowStack">
    <button class="button is-primary" type="submit">Create</button>
  </footer>
</form>
  `;
}
