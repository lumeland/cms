import { labelify, oninvalid, view } from "./utils.js";
import { Component } from "./component.js";
import dom from "dom";

customElements.define(
  "f-radio",
  class extends Component {
    init() {
      this.classList.add("field");
      const { schema, value, namePrefix, isNew } = this;
      const name = `${namePrefix}.${schema.name}`;
      const id = `field_${name}`;

      view(this);
      dom("span", { class: "field-label", html: schema.label }, this);
      const ul = dom("ul", { class: "field-check-list" }, this);

      for (const [key, option] of schema.options.entries()) {
        const optionId = `${id}_${key}`;
        const li = dom("li", { class: "field-check" }, ul);

        if (typeof option === "string") {
          dom("input", {
            type: "radio",
            id: optionId,
            name,
            value: option,
            class: "radio",
            oninvalid,
          }, li);
          dom("label", {
            for: optionId,
            class: "is-secondary",
            html: labelify(option),
          }, li);
        } else {
          const { label, ...attrs } = option;
          dom("input", {
            type: "radio",
            ...attrs,
            id: optionId,
            name,
            value: option,
            oninvalid,
          }, li);
          dom("label", {
            for: optionId,
            class: "is-secondary",
            html: labelify(label),
          }, li);
        }
      }

      const form = this.closest("form");
      form[name].value = isNew ? value ?? schema.value : value;

      dom("div", {
        class: "field-description",
        html: schema.description,
      }, this);
    }

    get currentValue() {
      return this.querySelector("input:checked")?.value;
    }

    update() {}
  },
);
