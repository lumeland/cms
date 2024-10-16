import { dom, labelify, push, view } from "./utils.js";
import { Component } from "./component.js";

customElements.define(
  "f-object-list",
  class extends Component {
    init() {
      this.classList.add("field");
      const { schema, value, isNew } = this;
      const namePrefix = `${this.namePrefix}.${schema.name}`;
      let open = true;

      view(this);
      push(this, "label", {
        for: `field_${namePrefix}.0`,
        onclick: () => {
          open = !open;
          this.querySelectorAll("details.accordion").forEach((el) =>
            el.open = open
          );
        },
      }, schema.label);

      if (schema.description) {
        push(this, "div", { class: "field-description" }, schema.description);
      }

      const div = push(this, "div", { class: "fieldset" });
      let index = 0;

      function addOption(value) {
        const firstKey = schema.fields[0].name;
        const label = (typeof value === "object" && value[firstKey]) ||
          `${schema.label} Item ${index}`;
        const attributes = schema.attributes || {};
        attributes.open ??= !value;

        push(
          div,
          "f-object",
          {
            schema: { ...schema, attributes, name: index++, label },
            namePrefix,
            value,
          },
          dom("button", {
            type: "button",
            class: "buttonIcon",
            slot: "buttons",
            onclick() {
              if (confirm("Are you sure you want to delete this item?")) {
                this.parentElement.remove();
              }
            },
          }, '<u-icon name="trash"></u-icon>'),
          dom("u-draggable", { slot: "buttons" }),
        );
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
        `Add ${labelify(schema.label)}`,
      );
    }
  },
);
