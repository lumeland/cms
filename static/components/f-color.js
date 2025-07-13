import { oninvalid, updateField, view } from "./utils.js";
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

      dom("div", {
        class: "field-description",
        html: schema.description,
      }, this);

      const div = dom("div", { class: "ly-rowStack" }, this);
      const input = dom("input", {
        class: "input",
        type: "color",
        id,
        name,
        value: isNew ? value ?? schema.value : value,
        oninvalid,
      }, div);
      const text = dom("input", {
        class: "input is-narrow",
        type: "text",
        value: input.value,
      }, div);

      input.addEventListener("input", () => text.value = input.value);
      text.addEventListener("input", () => input.value = text.value);
    }

    get currentValue() {
      return this.querySelector("input[type=color]")?.value;
    }

    update(schema, value) {
      const inputs = this.querySelectorAll("input");
      inputs.forEach((input) => input.value = value ?? null);
      updateField(this, schema, inputs[0]);
    }
  },
);
