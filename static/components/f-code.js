import { asset, oninvalid, updateField, view } from "./utils.js";
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
        for: id,
        html: schema.label,
      }, this);

      dom("div", {
        class: "field-description",
        html: schema.description,
      }, this);

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

    update(schema, value) {
      const input = this.querySelector("textarea");
      if (input.value !== value) {
        input.value = value ?? null;
        const editor = this.editor;
        editor.dispatch({
          changes: {
            from: 0,
            to: editor.state.doc.length,
            insert: value ?? "",
          },
          selection: {
            anchor: 0,
          },
        });
      }
      updateField(this, schema, input);
    }
  },
);
