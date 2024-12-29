import { oninvalid, view } from "./utils.js";
import { Component } from "./component.js";
import dom from "dom";

customElements.define(
  "f-color",
  class extends Component {
    init() {
      this.classList.add("field");
      const { schema, value, namePrefix, isNew } = this;
      const name = `${namePrefix}.${schema.name}`;
      const id = `field_${name}`;

      view(this);
      dom("label", {
        for: id,
        html: schema.label,
      }, this);

      if (schema.description) {
        dom("div", {
          class: "field-description",
          html: schema.description,
        }, this);
      }

      const div = dom("div", { class: "ly-rowStack" }, this);
      const input = dom("input", {
        class: "input",
        type: "color",
        id,
        name,
        value: isNew ? schema.value : value,
        oninvalid,
      }, div);
      const text = dom("input", {
        class: "input is-narrow",
        type: "text",
        value: input.value,
      }, div);

      text.addEventListener("input", () => input.value = text.value);
      input.addEventListener("input", () => text.value = input.value);
    }

    get currentValue() {
      return this.querySelector("input[type=color]")?.value;
    }
  },
);
