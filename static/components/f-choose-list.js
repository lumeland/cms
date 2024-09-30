import { dom, push, view } from "./utils.js";
import { Component } from "./component.js";

customElements.define(
  "f-choose-list",
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

      function addOption(value, isNew = false) {
        const field = schema.fields.find((f) => f.name === value.type);
        if (!field) {
          throw new Error(`Unknown field type: ${value.type}`);
        }

        const open = field.attributes?.open ?? isNew;
        ++index;

        push(
          div,
          field.tag,
          {
            schema: {
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
            namePrefix,
            value,
            isNew,
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

      const footer = push(this, "footer", {
        class: "field-footer ly-rowStack",
      });

      const select = push(footer, "select", {
        class: "select",
        onchange: () => {
          if (select.value) {
            addOption({ type: select.value }, true);
            select.value = "";
          }
        },
      });

      push(select, "option", { value: "" }, "Add new...");
      push(select, "hr");

      for (const field of schema.fields) {
        push(
          select,
          "option",
          { value: field.name },
          field.label ?? field.name,
        );
      }
    }
  },
);
