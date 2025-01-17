import { escape } from "../../../deps/std.ts";
import { getPath } from "../../utils/path.ts";
import { getViews, prepareField } from "../../utils/data.ts";
import breadcrumb from "../breadcrumb.ts";

import type Collection from "../../collection.ts";
import type { CMSContent, Version } from "../../../types.ts";

interface Props {
  options: CMSContent;
  collection: Collection;
  version?: Version;
  folder?: string;
  defaults: Record<string, unknown>;
}

export default async function template(
  { options, collection, version, folder, defaults }: Props,
) {
  const { basePath } = options;
  const fields = await Promise.all(
    collection.fields.map((field) => prepareField(field, options)),
  );

  const views = new Set();
  collection.fields.forEach((field) => getViews(field, views));

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
        value="${defaults._id || ""}"
        placeholder="Name your file…"
        form="form-create"
        aria-label="File name"
        ${collection.documentName ? "" : "required autofocus"}
      >
    </label>
  </h1>
</header>
${
    views.size
      ? `<u-views data-target="form-create" data-state="${
        escape(JSON.stringify(collection.views || []))
      }" data-views="${
        escape(JSON.stringify(Array.from(views)))
      }"><strong class="field-label">View:</strong></u-views>`
      : ""
  }
<form
  action="${getPath(basePath, "collection", collection.name, "create")}"
  method="post"
  class="form"
  enctype="multipart/form-data"
  id="form-create"
>
  <input type="hidden" name="_prefix" value="${folder || ""}">
  <u-fields data-fields="${escape(JSON.stringify(fields))}" data-value="${
    escape(JSON.stringify(defaults))
  }"></u-fields>
  <footer class="footer ly-rowStack">
    <button class="button is-primary" type="submit">Create</button>
  </footer>
</form>
  `;
}
