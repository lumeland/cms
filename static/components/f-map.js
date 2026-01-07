import { Component } from "./component.js";
import { getFieldName, initField, pushOptions } from "./utils.js";
import dom from "dom";

customElements.define(
  "f-map",
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

      let datalist;

      if (schema.options) {
        const dataListId = `${namePrefix}_datalist`;
        datalist = dom("datalist", { id: dataListId }, this);
        pushOptions(datalist, schema.options);
      }

      const div = dom("div", { class: "fieldset" }, this);
      let index = 0;

      function addOption([key, value] = ["", ""]) {
        const name = `${namePrefix}.${index++}`;
        const item = dom("div", { class: "ly-rowStack is-narrow" }, div);
        dom("input", {
          type: "text",
          class: "input is-narrow",
          id: `field_${name}`,
          name: `${name}.key`,
          value: key,
        }, item);
        const input = dom("input", {
          type: "text",
          class: "input is-narrow",
          id: `field_${name}`,
          name: `${name}.value`,
          value,
        }, item);

        if (datalist) {
          input.setAttribute("list", datalist.id);
          input.setAttribute("autocomplete", "off");
        }

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

      const options = (isNew ? value ?? schema.value : value) ?? {};
      for (const v of Object.entries(options)) {
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
      const values = {};
      for (const fields of this.querySelectorAll(".fieldset > div")) {
        const inputs = fields.querySelectorAll("input");
        const key = inputs[0].value;
        const value = inputs[1].value;
        if (key) {
          values[key] = value;
        }
      }
      return values;
    }

    update(schema) {
      this.querySelector(".field-description").innerHTML = schema.description ??
        "";
    }
  },
);
