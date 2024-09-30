import { Component } from "./component.js";
import { push, view } from "./utils.js";

customElements.define(
  "f-textarea",
  class extends Component {
    init() {
      this.classList.add("field");
      const { schema, value, namePrefix, isNew } = this;
      const name = `${namePrefix}.${schema.name}`;
      const id = `field_${name}`;

      view(this);
      push(this, "label", { for: id }, schema.label);

      if (schema.description) {
        push(this, "div", { class: "field-description" }, schema.description);
      }

      const autogrow = push(this, "div", { class: "input-autogrow" });
      push(autogrow, "textarea", {
        ...schema.attributes,
        id,
        name,
        value: isNew ? schema.value : value,
        class: "input",
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
