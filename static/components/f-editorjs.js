import { push } from "./utils.js";
import { Field } from "./field.js";
import { init } from "../libs/editorjs.js";

customElements.define(
  "f-editorjs",
  class extends Field {
    init() {
      this.classList.add("field");
      const { schema, value, namePrefix } = this;
      const name = `${namePrefix}.${schema.name}`;
      const id = `field_${name}`;

      push(this, "label", { for: `field_${namePrefix}.0` }, schema.label);

      if (schema.description) {
        push(this, "div", { class: "field-description" }, schema.description);
      }

      const textarea = push(this, "textarea", {
        ...schema.attributes,
        id,
        name,
        value,
        hidden: true,
      });

      const code = push(this, "div", { class: "code" });
      this.editor = init(code, textarea).editor;
    }
  },
);
