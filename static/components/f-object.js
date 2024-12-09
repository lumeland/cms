import { Component } from "./component.js";
import { view } from "./utils.js";
import dom from "dom";

customElements.define(
  "f-object",
  class extends Component {
    init() {
      this.classList.add("field", "is-group");
      const { schema, value, isNew } = this;
      view(this);
      const namePrefix = `${this.namePrefix}.${schema.name}`;
      const details = dom("details", {
        class: "accordion",
        "oncms:invalid": () => details.open = true,
        ...schema.attributes,
      }, this);

      const summary = dom("summary", { slot: "content" }, details);

      const shadow = this.attachShadow({ mode: "open" });
      shadow.innerHTML = `
      <style>
        .root {
          position: relative;
        }
        .buttons {
          display: flex;
          column-gap: 0.5em;
          position: absolute;
          right: 0;
          top: 0;
        }
      </style>
      <div class="root">
        <slot></slot>
        <div class="buttons"><slot name="buttons"></slot></div>
      </div>
      `;

      dom("strong", {
        class: "accordion-title",
        html: schema.label,
      }, summary);

      if (schema.description) {
        dom("div", {
          class: "accordion-description",
          html: schema.description,
        }, summary);
      }

      const div = dom("div", {
        class: "accordion-body fieldset is-separated",
      }, details);

      for (const field of schema.fields) {
        dom(field.tag, {
          ".schema": field,
          ".namePrefix": namePrefix,
          ".isNew": isNew,
          value: value?.[field.name] ?? null,
        }, div);
      }
    }
  },
);
