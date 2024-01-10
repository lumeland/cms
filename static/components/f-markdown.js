import { push } from "./utils.js";
import { Field } from "./field.js";
import { init } from "../libs/markdown.js";

customElements.define(
  "f-markdown",
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
        id,
        name,
        value,
        hidden: true,
      });

      const code = push(this, "div", { class: "code" });
      const view = init(code, textarea.value);

      textarea.form.addEventListener("submit", () => {
        textarea.value = view.state.doc.toString();
      });
    }
  },
);
