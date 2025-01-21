import { asset, oninvalid, view } from "./utils.js";
import { Component } from "./component.js";
import { init } from "../libs/code.js";
import dom from "dom";

customElements.define(
  "f-code",
  class extends Component {
    init() {
      this.classList.add("field");
      const { schema, value, namePrefix, isNew } = this;
      const name = `${namePrefix}.${schema.name}`;
      const id = `field_${name}`;

      view(this);
      dom("label", {
        for: `field_${namePrefix}.0`,
        html: schema.label,
      }, this);

      if (schema.description) {
        dom("div", {
          class: "field-description",
          html: schema.description,
        }, this);
      }

      const textarea = dom("textarea", {
        id,
        name,
        value: isNew ? value ?? schema.value : value,
        hidden: true,
        oninvalid,
      }, this);

      const shadow = this.attachShadow({ mode: "open" });
      shadow.innerHTML = `
      <link rel="stylesheet" href="${asset("styles", "code.css")}">
      <slot></slot>
      `;

      const code = dom("div", { class: "code" }, shadow);
      this.editor = init(code, textarea).editor;
    }

    get currentValue() {
      return this.editor.state.doc.toString();
    }
  },
);
