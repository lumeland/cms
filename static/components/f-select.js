import { push, pushOptions } from "./utils.js";
import { Field } from "./field.js";

customElements.define(
  "f-select",
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

      const select = push(this, "select", {
        ...schema.attributes,
        id,
        name,
        class: "select is-narrow",
      });

      pushOptions(select, schema.options);
      select.value = value ?? "";
    }
  },
);
