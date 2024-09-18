import { asset, push } from "./utils.js";
import { Component } from "./component.js";
import { init } from "../libs/code.js";

customElements.define(
  "f-code",
  class extends Component {
    init() {
      this.classList.add("field");
      const { schema, value, namePrefix, isNew } = this;
      const name = `${namePrefix}.${schema.name}`;
      const id = `field_${name}`;

      push(this, "label", { for: `field_${namePrefix}.0` }, schema.label);

      if (schema.description) {
        push(this, "div", { class: "field-description" }, schema.description);
      }

      const textarea = push(this, "textarea", {
        id,
        name,
        value: isNew ? schema.value : value,
        hidden: true,
      });

      const shadow = this.attachShadow({ mode: "open" });
      shadow.innerHTML = `
      <link rel="stylesheet" href="${asset("styles", "code.css")}">
      <slot></slot>
      `;

      const code = push(shadow, "div", { class: "code" });
      this.editor = init(code, textarea).editor;
    }
  },
);
