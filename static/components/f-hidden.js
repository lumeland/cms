import { Component } from "./component.js";
import { getFieldName } from "./utils.js";
import dom from "dom";

customElements.define(
  "f-hidden",
  class extends Component {
    init() {
      const { schema, value, isNew } = this;
      const name = getFieldName(this);

      dom("input", {
        type: "hidden",
        name,
        value: isNew ? value ?? schema.value : value,
      }, this);
    }

    get currentValue() {
      return this.querySelector("input")?.value;
    }

    update(_schema, value) {
      const input = this.querySelector("input");
      input.value = value ?? null;
    }
  },
);
