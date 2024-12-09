import { Component } from "./component.js";
import { oninvalid, view } from "./utils.js";
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

      if (schema.description) {
        dom(
          "div",
          { class: "field-description", html: schema.description },
          this,
        );
      }

      const autogrow = dom("div", { class: "input-autogrow" }, this);
      dom("textarea", {
        ...schema.attributes,
        id,
        name,
        value: isNew ? schema.value : value,
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
  },
);
