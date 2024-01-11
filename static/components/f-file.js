import { Field } from "./field.js";
import { push } from "./utils.js";

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

      const link = push(divValue, "a", {
        class: "buttonIcon",
        target: "_blank",
        hidden: true,
      }, '<u-icon name="arrow-square-out"></u-icon>');

      function updateLink() {
        if (curr.value) {
          let filename = value.startsWith(schema.publicPath || "")
            ? curr.value.substring(schema.publicPath.length)
            : curr.value;
          if (filename.startsWith("/")) {
            filename = filename.substring(1);
          }
          link.href = `/files/${schema.storage}/file/${filename}`;
          link.hidden = false;
        } else {
          link.hidden = true;
        }
      }
      updateLink();

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
