import { Component } from "./component.js";
import dom from "dom";

customElements.define(
  "u-fields",
  class Fields extends Component {
    init() {
      const namePrefix = "changes";
      const isNew = this.dataset.new === "true";
      const { fields, value } = this.#parseData(
        this.dataset.fields,
        this.dataset.value,
      );

      for (const field of fields) {
        dom(field.tag, {
          ".schema": field,
          ".namePrefix": namePrefix,
          ".isNew": isNew,
          value: value?.[field.name] ?? null,
        }, this);
      }
    }

    update(rawFields, rawValue) {
      const { fields, value } = this.#parseData(rawFields, rawValue);
      const items = Array.from(this.children);
      for (const field of fields) {
        items.shift()?.update(field, value?.[field.name]);
      }
    }

    #parseData(fields = "null", value = "null") {
      fields = JSON.parse(fields);
      value = JSON.parse(value);

      if (
        Array.isArray(value) && fields.length === 1 && fields[0].name === "[]"
      ) {
        value = { [fields[0].name]: value };
      }
      return { fields, value };
    }
  },
);
