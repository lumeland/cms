import { getFieldName, initField } from "./utils.js";
import { Component } from "./component.js";
import dom from "dom";

customElements.define(
  "f-file-list",
  class extends Component {
    init() {
      this.classList.add("field");
      const { schema, value, isNew } = this;
      const namePrefix = getFieldName(this);
      let open = true;

      initField(this);
      dom("label", {
        for: `field_${namePrefix}.0`,
        class: "field-label",
        onclick: () => {
          open = !open;
          this.querySelectorAll("details.accordion").forEach((el) =>
            el.open = open
          );
        },
        html: schema.label,
      }, this);

      dom(
        "div",
        { class: "field-description", html: schema.description },
        this,
      );

      const div = dom("div", { class: "fieldset" }, this);
      let index = 0;
      const firstKey = schema.fields[0].name;

      function createOption(value, isNew = false) {
        const label = (typeof value === "object" && value[firstKey]) ||
          "New item";
        const attributes = schema.attributes || {};
        attributes.open ??= isNew;

        const item = dom("f-object", {
          ".schema": { ...schema, attributes, name: index++, label },
          ".namePrefix": namePrefix,
          value,
          html: [
            dom("button", {
              type: "button",
              class: "buttonIcon",
              slot: "buttons",
              html: '<u-icon name="trash"></u-icon>',
              title: "Delete",
              onclick() {
                if (confirm("Are you sure you want to delete this item?")) {
                  this.parentElement.remove();
                }
              },
            }),
            dom("button", {
              type: "button",
              class: "buttonIcon",
              slot: "buttons",
              html: '<u-icon name="copy"></u-icon>',
              title: "Duplicate",
              onclick() {
                item.after(createOption(item.currentValue));
              },
            }),
            dom("u-draggable", { slot: "buttons" }),
          ],
        });

        return item;
      }

      for (const v of (isNew ? value ?? schema.value : value) ?? []) {
        div.append(createOption(v));
      }

      const footer = dom("footer", { class: "field-footer" }, this);
      const fileField = schema.fields.find((f) => f.type === "file");

      const btn = dom("label", {
        class: "button is-secondary",
        html: [
          '<u-icon name="plus-circle"></u-icon>',
          `Add files to ${schema.label}`,
        ],
      }, footer);

      dom("input", {
        type: "file",
        multiple: true,
        style: "display: none",
        onchange() {
          for (const file of this.files) {
            div.append(createOption({ [fileField.name]: file }, true));
          }
          this.value = null;
        },
      }, btn);
    }

    get currentValue() {
      const values = [];

      for (const field of this.querySelector(".fieldset").children) {
        values.push(field.currentValue);
      }

      return values;
    }

    update(schema, values) {
      this.querySelector(".field-label").innerHTML = schema.label;
      this.querySelector(".field-description").innerHTML = schema.description ??
        "";
      const items = Array.from(this.querySelector(".fieldset").children);
      const firstKey = schema.fields[0].name;

      for (const value of values) {
        const label = value[firstKey];
        items.shift()?.update({
          type: "object",
          label,
          fields: schema.fields,
        }, value);
      }
    }
  },
);
