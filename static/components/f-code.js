import {
  asset,
  getFieldName,
  initField,
  oninvalid,
  pushOptions,
  updateField,
} from "./utils.js";
import { Component } from "./component.js";
import { init } from "../libs/code.js";
import dom from "dom";

customElements.define(
  "f-code",
  class extends Component {
    init() {
      this.classList.add("field");
      const { schema, value, isNew } = this;
      const name = getFieldName(this);
      const id = `field_${name}`;

      initField(this);
      dom("label", {
        for: id,
        html: schema.label,
      }, this);

      dom("div", {
        class: "field-description",
        html: schema.description,
      }, this);

      const tools = dom("div", { class: "tools" }, this);

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
      const { editor, changeLanguage, allLanguages } = init(code, textarea);
      this.editor = editor;
      const languageSelector = dom("select", {
        class: "select",
        onchange: (event) => {
          changeLanguage(event.target.value);
        },
      }, tools);
      pushOptions(languageSelector, allLanguages);
      languageSelector.value = schema.attributes?.data?.language ?? "HTML";
      languageSelector.dispatchEvent(new Event("change"));
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
