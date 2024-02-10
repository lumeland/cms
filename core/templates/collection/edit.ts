import { escape } from "../../../deps/std.ts";
import { getPath } from "../../utils/path.ts";
import breadcrumb from "../breadcrumb.ts";

import type Collection from "../../collection.ts";
import type Document from "../../document.ts";
import type { Version } from "../../../types.ts";

interface Props {
  collection: Collection;
  document: Document;
  version?: Version;
}

export default async function template(
  { collection, document, version }: Props,
) {
  const data = await document.read();

  return `
<u-pagepreview data-src="${document.src}"></u-pagepreview>
${
    breadcrumb(version, [
      collection.name,
      getPath("collection", collection.name),
    ], "Editing file")
  }

<u-form>
  <header class="header">
    <h1 class="header-title">
      Editing file
      <input
        class="input is-inline"
        id="_id"
        type="text"
        name="_id"
        value="${document.name}"
        placeholder="Rename the file…"
        form="form-edit"
        aria-label="File name"
        required
      >
    </h1>
  </header>
  <form
    action="${getPath("collection", collection.name, "edit", document.name)}"
    method="post"
    class="form"
    enctype="multipart/form-data"
    id="form-edit"
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
      <button class="button is-primary" type="submit">
        <u-icon name="check"></u-icon>
        Save changes
      </button>
      <u-confirm data-message="Are you sure?">
        <button
          class="button is-secondary"
          type="submit"
          formAction="${
    getPath(
      "collection",
      collection.name,
      "delete",
      document.name,
    )
  }"
        >
          <u-icon name="trash"></u-icon>
          Delete
        </button>
      </u-confirm>
    </footer>
  </form>
</u-form>
  `;
}
