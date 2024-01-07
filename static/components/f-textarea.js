import { Field } from "./field.js";
import { push } from "./utils.js";

customElements.define(
  "f-textarea",
  class extends Field {
    get inputAttributes() {
      return { class: "input" };
    }

    get input() {
      return this.querySelector("textarea");
    }

    init() {
      this.classList.add("field");
      const { schema, value, namePrefix } = this;
      const name = `${namePrefix}.${schema.name}`;
      const id = `field_${name}`;

      push(this, "label", { for: id }, schema.label);

      if (schema.description) {
        push(this, "div", { class: "field-description" }, schema.description);
      }

      const autogrow = push(this, "div", { class: "input-autogrow" });
      push(autogrow, "textarea", {
        id,
        name,
        value,
        ...this.inputAttributes,
        oninput() {
          this.parentNode.dataset.replicatedValue = this.value;
        },
        onfocus() {
          this.parentNode.dataset.replicatedValue = this.value;
        },
      });
    }
  },
);
