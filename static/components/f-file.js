import { Component } from "./component.js";
import { oninvalid, push, url, view } from "./utils.js";

customElements.define(
  "f-file",
  class extends Component {
    init() {
      this.classList.add("field");
      const { schema, value, namePrefix, isNew } = this;
      const name = `${namePrefix}.${schema.name}`;
      const id = `field_${name}`;

      view(this);
      push(this, "label", { for: id }, schema.label);

      if (schema.description) {
        push(this, "div", { class: "field-description" }, schema.description);
      }

      const divValue = push(this, "div", { class: "field-value" });
      const curr = push(divValue, "input", {
        name: `${name}.current`,
        type: "text",
        value: isNew ? schema.value : value,
        class: "input is-narrow",
      });

      push(divValue, "button", {
        class: "buttonIcon",
        type: "button",
        onclick() {
          const uploads = schema.uploads.split(":").shift();

          if (curr.value && !curr.value.match(/^https?:\/\//)) {
            let filename = curr.value.startsWith(schema.publicPath || "")
              ? curr.value.substring(schema.publicPath.length)
              : curr.value;
            if (filename.startsWith("/")) {
              filename = filename.substring(1);
            }

            push(document.body, "u-modal", {
              data: { src: url("uploads", uploads, "file", filename) },
            });
          } else {
            push(document.body, "u-modal", {
              data: { src: url("uploads", uploads) },
            });
          }
        },
      }, '<u-icon name="magnifying-glass"></u-icon>');

      const upload = push(this, "u-upload");

      push(upload, "input", {
        ...schema.attributes,
        type: "file",
        id,
        name: `${name}.uploaded`,
        class: "inputFile",
        oninvalid,
      });
    }
  },
);
