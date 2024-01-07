import { push } from "./utils.js";
import { Field } from "./field.js";

customElements.define(
  "f-checkbox",
  class extends Field {
    get inputAttributes() {
      return { type: "checkbox", class: "checkbox" };
    }

    get input() {
      return this.querySelector("input");
    }

    init() {
      this.classList.add("field");
      const { schema, value, namePrefix } = this;
      const name = `${namePrefix}.${schema.name}`;
      const id = `field_${name}`;
      const div = push(this, "div", { class: "field-check" });
      push(div, "input", { name, type: "hidden", value: false });
      push(div, "input", {
        id,
        name,
        value: true,
        checked: value || undefined,
        ...this.inputAttributes,
      });
      push(div, "label", { for: id }, schema.label);

      if (schema.description) {
        push(this, "div", { class: "field-description" }, schema.description);
      }
    }
  },
);
