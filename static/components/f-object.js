import { Component } from "./component.js";
import { push } from "./utils.js";

customElements.define(
  "f-object",
  class extends Component {
    init() {
      this.classList.add("field", "is-group");
      const { schema, value, isNew } = this;
      schema.view && this.setAttribute("data-view", schema.view);
      const namePrefix = `${this.namePrefix}.${schema.name}`;
      const details = push(this, "details", {
        class: "accordion",
        ...schema.attributes,
      });
      const summary = push(details, "summary", { slot: "content" });

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

      push(
        summary,
        "strong",
        { class: "accordion-title" },
        schema.label,
      );

      if (schema.description) {
        push(
          summary,
          "div",
          { class: "accordion-description" },
          schema.description,
        );
      }

      const div = push(details, "div", {
        class: "accordion-body fieldset is-separated",
      });

      for (const field of schema.fields) {
        push(div, field.tag, {
          schema: field,
          namePrefix,
          value: value?.[field.name] ?? null,
          isNew,
        });
      }
    }
  },
);
