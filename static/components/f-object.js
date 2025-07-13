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
          column-gap: 4px;
          position: absolute;
          right: 4px;
          top: 4px;
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

      dom("div", {
        class: "accordion-description",
        html: schema.description,
      }, summary);

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

    get currentValue() {
      const values = {};
      for (const field of this.querySelector(".fieldset").children) {
        values[field.schema.name] = field.currentValue;
      }
      return values;
    }

    update(schema, value) {
      this.querySelector(".accordion-title").innerHTML = schema.label ?? "";
      this.querySelector(".accordion-description").innerHTML =
        schema.description ??
          "";
      const items = Array.from(this.querySelector(".fieldset").children);

      for (const field of schema.fields) {
        items.shift()?.update(field, value?.[field.name]);
      }
    }
  },
);
