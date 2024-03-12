import { Field } from "./field.js";
import { push } from "./utils.js";

customElements.define(
  "f-hidden",
  class extends Field {
    init() {
      const { schema, value, namePrefix } = this;
      const name = `${namePrefix}.${schema.name}`;

      push(this, "input", {
        type: "hidden",
        name,
        value: value || schema.value,
      });
    }
  },
);
