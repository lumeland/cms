import { Field } from "./field.js";
import { push, url } from "./utils.js";

customElements.define(
  "f-file",
  class extends Field {
    init() {
      this.classList.add("field");
      const { schema, value, namePrefix } = this;
      const name = `${namePrefix}.${schema.name}`;
      const id = `field_${name}`;

      push(this, "label", { for: id }, schema.label);

      if (schema.description) {
        push(this, "div", { class: "field-description" }, schema.description);
      }

      const divValue = push(this, "div", { class: "field-value" });
      const curr = push(divValue, "input", {
        name: `${name}.current`,
        type: "text",
        value,
        class: "input is-narrow",
      });

      push(divValue, "button", {
        class: "buttonIcon",
        type: "button",
        onclick() {
          if (curr.value) {
            let filename = curr.value.startsWith(schema.publicPath || "")
              ? curr.value.substring(schema.publicPath.length)
              : curr.value;
            if (filename.startsWith("/")) {
              filename = filename.substring(1);
            }

            push(document.body, "u-modal", {
              src: url("uploads", schema.uploads, "file", filename),
            });
          } else {
            push(document.body, "u-modal", {
              src: url("uploads", schema.uploads),
            });
          }
        },
      }, '<u-icon name="magnifying-glass"></u-icon>');

      push(this, "input", {
        ...schema.attributes,
        type: "file",
        id,
        name: `${name}.uploaded`,
        class: "inputFile",
      });
    }
  },
);
