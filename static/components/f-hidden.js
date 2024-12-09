import { Component } from "./component.js";
import dom from "dom";

customElements.define(
  "f-hidden",
  class extends Component {
    init() {
      const { schema, value, namePrefix, isNew } = this;
      const name = `${namePrefix}.${schema.name}`;

      dom("input", {
        type: "hidden",
        name,
        value: isNew ? schema.value : value,
      }, this);
    }
  },
);
