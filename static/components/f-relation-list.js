import { Component } from "./component.js";
import { getFieldName, initField, pushOptions } from "./utils.js";
import dom from "dom";

customElements.define(
  "f-relation-list",
  class extends Component {
    init() {
      this.classList.add("field");
      const { schema, value, isNew } = this;
      const namePrefix = getFieldName(this);

      initField(this);
      dom("label", { for: `field_${namePrefix}.0`, html: schema.label }, this);

      dom(
        "div",
        { class: "field-description", html: schema.description },
        this,
      );

      const div = dom("div", { class: "fieldset" }, this);
      let index = 0;

      function addOption(value) {
        const name = `${namePrefix}.${index++}`;
        const item = dom("div", { class: "ly-rowStack is-narrow" }, div);
        const select = dom("select", {
          class: "select is-narrow",
          id: `field_${name}`,
          name,
        }, item);
        dom("option", { value: "", html: "--" }, select);
        pushOptions(select, schema.options);
        select.value = value ?? "";

        dom("button", {
          type: "button",
          class: "buttonIcon",
          onclick() {
            item.remove();
          },
          html: '<u-icon name="trash"></u-icon>',
        }, item);
        dom("u-draggable", item);
      }

      for (const v of (isNew ? value ?? schema.value : value) ?? []) {
        addOption(v);
      }

      const footer = dom("footer", { class: "field-footer" }, this);

      dom("button", {
        type: "button",
        onclick: () => addOption(),
        class: "button is-secondary",
        html: [
          '<u-icon name="plus-circle"></u-icon>',
          `Add ${schema.label}`,
        ],
      }, footer);
    }

    get currentValue() {
      return Array.from(this.querySelectorAll("select")).map((select) =>
        select.value
      );
    }

    update(schema) {
      this.querySelector(".field-description").innerHTML = schema.description ??
        "";
    }
  },
);
