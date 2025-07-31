import {
  getFieldName,
  oninvalid,
  pushOptions,
  updateField,
  view,
} from "./utils.js";
import { Component } from "./component.js";
import dom from "dom";

customElements.define(
  "f-select",
  class extends Component {
    init() {
      this.classList.add("field");
      const { schema, value, isNew } = this;
      const name = getFieldName(this);
      const id = `field_${name}`;

      view(this);
      dom("label", { for: id, html: schema.label }, this);

      dom(
        "div",
        { class: "field-description", html: schema.description },
        this,
      );

      const select = dom("select", {
        ...schema.attributes,
        id,
        name,
        class: "select is-narrow",
        oninvalid,
      }, this);

      pushOptions(select, schema.options);
      select.value = (isNew ? value ?? schema.value : value) ?? "";
    }

    get currentValue() {
      return this.querySelector("select")?.value;
    }

    update(schema, value) {
      const input = this.querySelector("select");
      input.value = value ?? null;
      updateField(this, schema, input);
    }
  },
);
