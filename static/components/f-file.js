import { Component } from "./component.js";
import { oninvalid, updateField, url, view } from "./utils.js";
import dom from "dom";

customElements.define(
  "f-file",
  class extends Component {
    init() {
      this.classList.add("field");
      const { schema, value, namePrefix, isNew } = this;
      const name = `${namePrefix}.${schema.name}`;
      const id = `field_${name}`;

      view(this);
      dom("label", { for: id, html: schema.label }, this);

      dom(
        "div",
        { class: "field-description", html: schema.description },
        this,
      );

      const divValue = dom("div", { class: "field-value" }, this);
      const currValue = isNew ? value ?? schema.value : value;
      const curr = dom("input", {
        name: `${name}.current`,
        type: "text",
        value: typeof currValue === "string" ? currValue : null,
        class: "input is-narrow",
      }, divValue);

      dom("button", {
        class: "buttonIcon",
        type: "button",
        html: '<u-icon name="magnifying-glass"></u-icon>',
        onclick() {
          const upload = schema.upload.split(":").shift();

          if (curr.value && !curr.value.match(/^https?:\/\//)) {
            let filename = curr.value.startsWith(schema.publicPath || "")
              ? curr.value.substring(schema.publicPath.length)
              : curr.value;
            if (filename.startsWith("/")) {
              filename = filename.substring(1);
            }

            dom("u-modal", {
              data: { src: url("uploads", upload, filename, "edit") },
            }, document.body);
          } else {
            dom("u-modal", {
              data: { src: url("uploads", upload) },
            }, document.body);
          }
        },
      }, divValue);

      const upload = dom("u-upload", this);

      const input = dom("input", {
        ...schema.attributes,
        type: "file",
        id,
        name: `${name}.uploaded`,
        class: "inputFile",
        oninvalid,
      }, upload);

      if (currValue instanceof File) {
        setValue(currValue, input);
      }
    }

    get currentValue() {
      return this.querySelector("input[type='text']")?.value;
    }

    update(schema, value) {
      const textInput = this.querySelector("input[type='text']");
      const fileInput = this.querySelector("input[type='file']");
      fileInput.value = null;
      textInput.value = value ?? null;
      updateField(this, schema, fileInput);
    }
  },
);

function setValue(file, input) {
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  const fileList = dataTransfer.files;
  input.files = fileList;
}
