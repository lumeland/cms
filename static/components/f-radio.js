import { labelify, push } from "./utils.js";
import { Component } from "./component.js";

customElements.define(
  "f-radio",
  class extends Component {
    init() {
      this.classList.add("field");
      const { schema, value, namePrefix, isNew } = this;
      const name = `${namePrefix}.${schema.name}`;
      const id = `field_${name}`;

      push(this, "span", { class: "field-label" }, schema.label);
      const ul = push(this, "ul", { class: "field-check-list" });

      for (const [key, option] of schema.options.entries()) {
        const optionId = `${id}_${key}`;
        const li = push(ul, "li", { class: "field-check" });

        if (typeof option === "string") {
          push(li, "input", {
            type: "radio",
            id: optionId,
            name,
            value: option,
            class: "radio",
          });
          push(
            li,
            "label",
            { for: optionId, class: "is-secondary" },
            labelify(option),
          );
        } else {
          const { label, ...attrs } = option;
          push(li, "input", {
            type: "radio",
            ...attrs,
            id: optionId,
            name,
            value: option,
          });
          push(
            li,
            "label",
            { for: optionId, class: "is-secondary" },
            labelify(label),
          );
        }
      }

      const form = this.closest("form");
      form[name].value = isNew ? schema.value : value;

      if (schema.description) {
        push(this, "div", { class: "field-description" }, schema.description);
      }
    }
  },
);
