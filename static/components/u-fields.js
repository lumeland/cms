import { Component } from "./component.js";
import dom from "dom";

customElements.define(
  "u-fields",
  class Form extends Component {
    init() {
      const fields = JSON.parse(this.dataset.fields ?? "null");
      let value = JSON.parse(this.dataset.value ?? "null");
      const namePrefix = "changes";
      const isNew = this.dataset.new === "true";

      if (
        Array.isArray(value) && fields.length === 1 && fields[0].name === "[]"
      ) {
        value = { [fields[0].name]: value };
      }

      for (const field of fields) {
        dom(field.tag, {
          ".schema": field,
          ".namePrefix": namePrefix,
          ".isNew": isNew,
          value: value?.[field.name] ?? null,
        }, this);
      }
    }
  },
);
