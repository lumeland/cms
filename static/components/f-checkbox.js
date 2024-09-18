import { push } from "./utils.js";
import { Component } from "./component.js";

customElements.define(
  "f-checkbox",
  class extends Component {
    init() {
      this.classList.add("field");
      const { schema, value, namePrefix, isNew } = this;
      const name = `${namePrefix}.${schema.name}`;
      const id = `field_${name}`;
      const div = push(this, "div", { class: "field-check" });
      push(div, "input", { name, type: "hidden", value: false });
      push(div, "input", {
        ...schema.attributes,
        id,
        name,
        value: true,
        checked: (isNew ? schema.value : value) ?? undefined,
        type: "checkbox",
        class: "checkbox",
      });
      push(div, "label", { for: id }, schema.label);

      if (schema.description) {
        push(this, "div", { class: "field-description" }, schema.description);
      }
    }
  },
);
