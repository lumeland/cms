import { oninvalid, pushOptions, view } from "./utils.js";
import { Component } from "./component.js";
import dom from "dom";

customElements.define(
  "f-select",
  class extends Component {
    init() {
      this.classList.add("field");
      const { schema, value, namePrefix, isNew } = this;
      const name = `${namePrefix}.${schema.name}`;
      const id = `field_${name}`;

      view(this);
      dom("label", { for: id, html: schema.label }, this);

      if (schema.description) {
        dom(
          "div",
          { class: "field-description", html: schema.description },
          this,
        );
      }

      const select = dom("select", {
        ...schema.attributes,
        id,
        name,
        class: "select is-narrow",
        oninvalid,
      }, this);

      pushOptions(select, schema.options);
      select.value = (isNew ? schema.value : value) ?? "";
    }

    get currentValue() {
      return this.querySelector("select")?.value;
    }
  },
);
