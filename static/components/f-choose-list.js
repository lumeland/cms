import { view } from "./utils.js";
import { Component } from "./component.js";
import dom from "dom";

customElements.define(
  "f-choose-list",
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
        dom("div", {
          class: "field-description",
          html: schema.description,
        }, this);
      }

      const div = dom("div", { class: "fieldset" }, this);
      let index = 0;

      function addOption(value, isNew = false) {
        const field = schema.fields.find((f) => f.name === value.type);
        if (!field) {
          throw new Error(`Unknown field type: ${value.type}`);
        }

        const open = field.attributes?.open ?? isNew;
        ++index;

        dom(field.tag, {
          ".schema": {
            ...field,
            attributes: { ...field.attributes, open },
            name: index,
            label: field.label || field.name,
            fields: [
              {
                name: "type",
                tag: "f-hidden",
                value: value.type,
              },
              ...field.fields,
            ],
          },
          ".namePrefix": namePrefix,
          ".isNew": isNew,
          value: value,
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

      const footer = dom("footer", {
        class: "field-footer ly-rowStack",
      }, this);

      const select = dom("select", {
        class: "select",
        onchange: () => {
          if (select.value) {
            addOption({ type: select.value }, true);
            select.value = "";
          }
        },
      }, footer);

      dom("option", {
        value: "",
        text: "Add new...",
      }, select);

      dom("hr", select);

      for (const field of schema.fields) {
        dom("option", {
          value: field.name,
          html: field.label ?? field.name,
        }, select);
      }
    }
  },
);
