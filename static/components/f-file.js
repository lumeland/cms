import { Component } from "./component.js";
import { oninvalid, url, view } from "./utils.js";
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

      if (schema.description) {
        dom(
          "div",
          { class: "field-description", html: schema.description },
          this,
        );
      }

      const divValue = dom("div", { class: "field-value" }, this);
      const curr = dom("input", {
        name: `${name}.current`,
        type: "text",
        value: isNew ? schema.value : value,
        class: "input is-narrow",
      }, divValue);

      dom("button", {
        class: "buttonIcon",
        type: "button",
        html: '<u-icon name="magnifying-glass"></u-icon>',
        onclick() {
          const uploads = schema.uploads.split(":").shift();

          if (curr.value && !curr.value.match(/^https?:\/\//)) {
            let filename = curr.value.startsWith(schema.publicPath || "")
              ? curr.value.substring(schema.publicPath.length)
              : curr.value;
            if (filename.startsWith("/")) {
              filename = filename.substring(1);
            }

            dom("u-modal", {
              data: { src: url("uploads", uploads, "file", filename) },
            }, document.body);
          } else {
            dom("u-modal", {
              data: { src: url("uploads", uploads) },
            }, document.body);
          }
        },
      }, divValue);

      const upload = dom("u-upload", this);

      dom("input", {
        ...schema.attributes,
        type: "file",
        id,
        name: `${name}.uploaded`,
        class: "inputFile",
        oninvalid,
      }, upload);
    }

    get currentValue() {
      return this.querySelector("input[type='text']")?.value;
    }
  },
);
