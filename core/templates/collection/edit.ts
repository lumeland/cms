import { escape } from "../../../deps/std.ts";
import { getPath } from "../../utils/path.ts";
import { prepareField } from "../../utils/data.ts";
import breadcrumb from "../breadcrumb.ts";

import type Collection from "../../collection.ts";
import type Document from "../../document.ts";
import type { CMSContent, Version } from "../../../types.ts";

interface Props {
  options: CMSContent;
  collection: Collection;
  document: Document;
  version?: Version;
}

export default async function template(
  { options, collection, document, version }: Props,
) {
  const data = await document.read();
  const fields = await Promise.all(document.fields.map(async (field) => `
  <${field.tag}
    data-nameprefix="changes"
    data-value="${escape(JSON.stringify(data[field.name] ?? null))}"
    data-field="${escape(JSON.stringify(await prepareField(field)))}"
  >
  </${field.tag}>
`));

  const { basePath } = options;

  return `
${
    breadcrumb(options, version, [
      collection.name,
      getPath(basePath, "collection", collection.name),
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
        ${
    collection.permissions.create && collection.permissions.delete
      ? ""
      : "readonly"
  }
        required
      >
    </h1>
  </header>
  <form
    action="${
    getPath(basePath, "collection", collection.name, "edit", document.name)
  }"
    method="post"
    class="form"
    enctype="multipart/form-data"
    id="form-edit"
  >
    ${fields.join("")}

    <footer class="footer ly-rowStack is-responsive">
      <button class="button is-primary" type="submit">
        <u-icon name="check"></u-icon>
        Save changes
      </button>
      ${
    collection.permissions.create
      ? `
      <u-confirm data-message="Duplicate this file?">
        <button
          class="button is-secondary"
          type="submit"
          formAction="${
        getPath(
          options.basePath,
          "collection",
          collection.name,
          "duplicate",
          document.name,
        )
      }"
        >
          <u-icon name="files"></u-icon>
          Duplicate
        </button>
      </u-confirm>
      `
      : ""
  }
      ${
    collection.permissions.delete
      ? `
      <u-confirm data-message="Are you sure?">
        <button
          class="button is-secondary"
          type="submit"
          formAction="${
        getPath(
          options.basePath,
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
      `
      : ""
  }
      <u-pagepreview class="ly-rowStack" data-url="${
    document.url || ""
  }" data-src="${document.src}"></u-pagepreview>
    </footer>
  </form>
</u-form>
  `;
}
