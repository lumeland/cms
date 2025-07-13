import { Component } from "./component.js";
import { oninvalid, updateField, view } from "./utils.js";
import dom from "dom";

customElements.define(
  "f-textarea",
  class extends Component {
    init() {
      this.classList.add("field");
      const { schema, value, namePrefix, isNew } = this;
      const name = `${namePrefix}.${schema.name}`;
      const id = `field_${name}`;

      view(this);
      dom("label", { for: id, html: schema.label }, this);

      dom(
        "div",
        { class: "field-description", html: schema.description },
        this,
      );

      const autogrow = dom("div", { class: "input-autogrow" }, this);
      dom("textarea", {
        ...schema.attributes,
        id,
        name,
        value: isNew ? value ?? schema.value : value,
        class: "input",
        oninvalid,
        oninput() {
          this.parentNode.dataset.replicatedValue = this.value;
        },
        onfocus() {
          this.parentNode.dataset.replicatedValue = this.value;
        },
      }, autogrow);
    }

    get currentValue() {
      return this.querySelector("textarea")?.value;
    }

    update(schema, value) {
      const input = this.querySelector("textarea");
      input.value = value ?? null;
      updateField(this, schema, input);
    }
  },
);
