import { push } from "./utils.js";
import { Field } from "./field.js";

customElements.define(
  "f-object-list",
  class extends Field {
    init() {
      this.classList.add("field");

      const { schema, value } = this;
      const namePrefix = `${this.namePrefix}.${schema.name}`;

      push(this, "label", { for: `field_${namePrefix}.0` }, schema.label);

      if (schema.description) {
        push(this, "div", { class: "field-description" }, schema.description);
      }

      const div = push(this, "div", { class: "fieldset" });
      let index = 0;

      function addOption(value) {
        const el = push(div, "u-draggable");

        push(el, "f-object", {
          schema: { ...schema, name: index++ },
          namePrefix,
          value,
        });

        push(el, "button", {
          type: "button",
          class: "buttonIcon",
          onclick() {
            this.closest("u-draggable").remove();
          },
        }, '<u-icon name="trash"></u-icon>');
      }
      for (const v of value ?? []) {
        addOption(v);
      }

      const footer = push(this, "footer", { class: "field-footer" });

      push(
        footer,
        "button",
        {
          type: "button",
          onclick: () => addOption(),
          class: "button is-secondary",
        },
        '<u-icon name="plus-circle"></u-icon>',
        `Add ${schema.label}`,
      );
    }
  },
);
