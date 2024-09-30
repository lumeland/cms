import { push, pushOptions } from "./utils.js";
import { Component } from "./component.js";

customElements.define(
  "f-select",
  class extends Component {
    init() {
      this.classList.add("field");
      const { schema, value, namePrefix, isNew } = this;
      schema.view && this.setAttribute("data-view", schema.view);
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
      select.value = (isNew ? schema.value : value) ?? "";
    }
  },
);
