import { Component } from "./component.js";
import { push } from "./utils.js";

customElements.define(
  "f-hidden",
  class extends Component {
    init() {
      const { schema, value, namePrefix, isNew } = this;
      const name = `${namePrefix}.${schema.name}`;

      push(this, "input", {
        type: "hidden",
        name,
        value: isNew ? schema.value : value,
      });
    }
  },
);
