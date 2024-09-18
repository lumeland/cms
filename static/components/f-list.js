import { Component } from "./component.js";
import { push, pushOptions } from "./utils.js";

customElements.define(
  "f-list",
  class extends Component {
    init() {
      this.classList.add("field");

      const { schema, value, isNew } = this;
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
        const item = push(div, "div", { class: "ly-rowStack is-narrow" });
        const input = push(item, "input", {
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

        push(item, "button", {
          type: "button",
          class: "buttonIcon",
          onclick() {
            item.remove();
          },
        }, '<u-icon name="trash"></u-icon>');
        push(item, "u-draggable");
      }

      for (const v of (isNew ? schema.value : value) ?? []) {
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
