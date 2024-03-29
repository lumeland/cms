import { Field } from "./field.js";
import { push, pushOptions } from "./utils.js";

customElements.define(
  "f-list",
  class extends Field {
    init() {
      this.classList.add("field");

      const { schema, value } = this;
      const namePrefix = `${this.namePrefix}.${schema.name}`;

      push(this, "label", { for: `field_${namePrefix}.0` }, schema.label);

      let datalist;

      if (schema.options) {
        const dataListId = `${namePrefix}_datalist`;
        datalist = push(this, "datalist", { id: dataListId });
        pushOptions(datalist, schema.options);
      }

      const div = push(this, "div", { class: "fieldset" });
      let index = 0;

      function addOption(value) {
        const name = `${namePrefix}.${index++}`;
        const el = push(div, "u-draggable");

        const input = push(el, "input", {
          type: "text",
          class: "input is-narrow",
          id: `field_${name}`,
          name,
          value,
        });

        if (datalist) {
          input.setAttribute("list", datalist.id);
          input.setAttribute("autocomplete", "off");
        }

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
