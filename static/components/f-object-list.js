import { labelify, view } from "./utils.js";
import { Component } from "./component.js";
import dom from "dom";

customElements.define(
  "f-object-list",
  class extends Component {
    init() {
      this.classList.add("field");
      const { schema, value, isNew } = this;
      const namePrefix = `${this.namePrefix}.${schema.name}`;
      let open = true;

      view(this);
      dom("label", {
        for: `field_${namePrefix}.0`,
        onclick: () => {
          open = !open;
          this.querySelectorAll("details.accordion").forEach((el) =>
            el.open = open
          );
        },
        html: schema.label,
      }, this);

      if (schema.description) {
        dom(
          "div",
          { class: "field-description", html: schema.description },
          this,
        );
      }

      const div = dom("div", { class: "fieldset" }, this);
      let index = 0;

      function addOption(value) {
        const firstKey = schema.fields[0].name;
        const label = (typeof value === "object" && value[firstKey]) ||
          `${schema.label} Item ${index}`;
        const attributes = schema.attributes || {};
        attributes.open ??= !value;

        dom("f-object", {
          ".schema": { ...schema, attributes, name: index++, label },
          ".namePrefix": namePrefix,
          value,
          html: [
            dom("button", {
              type: "button",
              class: "buttonIcon",
              slot: "buttons",
              html: '<u-icon name="trash"></u-icon>',
              onclick() {
                if (confirm("Are you sure you want to delete this item?")) {
                  this.parentElement.remove();
                }
              },
            }),
            dom("u-draggable", { slot: "buttons" }),
          ],
        }, div);
      }

      for (const v of (isNew ? schema.value : value) ?? []) {
        addOption(v);
      }

      const footer = dom("footer", { class: "field-footer" }, this);

      dom("button", {
        type: "button",
        onclick: () => addOption(),
        class: "button is-secondary",
        html: [
          '<u-icon name="plus-circle"></u-icon>',
          `Add ${labelify(schema.label)}`,
        ],
      }, footer);
    }
  },
);
