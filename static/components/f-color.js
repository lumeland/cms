import { push } from "./utils.js";
import { Component } from "./component.js";

customElements.define(
  "f-color",
  class extends Component {
    init() {
      this.classList.add("field");
      const { schema, value, namePrefix, isNew } = this;
      const name = `${namePrefix}.${schema.name}`;
      const id = `field_${name}`;

      push(this, "label", { for: id }, schema.label);

      if (schema.description) {
        push(this, "div", { class: "field-description" }, schema.description);
      }

      const div = push(this, "div", { class: "ly-rowStack" });
      const input = push(div, "input", {
        class: "input",
        type: "color",
        id,
        name,
        value: isNew ? schema.value : value,
      });
      const text = push(div, "input", {
        class: "input is-narrow",
        type: "text",
        value: input.value,
      });

      text.addEventListener("input", () => input.value = text.value);
      input.addEventListener("input", () => text.value = input.value);
    }
  },
);
