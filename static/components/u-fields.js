import { Component } from "./component.js";
import dom from "dom";

customElements.define(
  "u-fields",
  class Fields extends Component {
    init() {
      const isNew = this.dataset.new === "true";
      const { fields, value } = this.#parseData(
        this.dataset.fields,
        this.dataset.value,
      );

      dom(fields.tag, {
        ".schema": fields,
        ".isNew": isNew,
        value: value?.[fields.name] ?? null,
      }, this);
    }

    update(rawFields, rawValue) {
      const { fields, value } = this.#parseData(rawFields, rawValue);
      const field = this.firstElementChild;
      field.update(fields, value[fields.name]);
    }

    #parseData(fields = "null", value = "null") {
      fields = JSON.parse(fields);
      value = JSON.parse(value);

      return { fields, value };
    }
  },
);
