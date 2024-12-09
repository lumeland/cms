import { oninvalid, view } from "./utils.js";
import { Component } from "./component.js";
import dom from "dom";

customElements.define(
  "f-checkbox",
  class extends Component {
    init() {
      this.classList.add("field");
      const { schema, value, namePrefix, isNew } = this;
      const name = `${namePrefix}.${schema.name}`;
      const id = `field_${name}`;
      const div = dom("div", { class: "field-check" }, this);
      view(this);
      dom("input", { name, type: "hidden", value: false }, div);
      dom("input", {
        ...schema.attributes,
        id,
        name,
        value: true,
        oninvalid,
        checked: (isNew ? schema.value : value) ?? undefined,
        type: "checkbox",
        class: "checkbox",
      }, div);

      dom("label", {
        for: id,
        html: schema.label,
      }, div);

      if (schema.description) {
        dom("div", {
          class: "field-description",
          html: schema.description,
        }, this);
      }
    }
  },
);
