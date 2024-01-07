import { Field } from "./field.js";
import { push } from "./utils.js";

customElements.define(
  "f-object",
  class extends Field {
    init() {
      this.classList.add("field", "is-group");
      const { schema, value } = this;
      const namePrefix = `${this.namePrefix}.${schema.name}`;
      const details = push(this, "details", { class: "accordion", open: true });
      const summary = push(details, "summary");

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

      const div = push(details, "div", { class: "accordion-body fieldset" });

      for (const field of schema.fields) {
        push(div, field.tag, {
          schema: field,
          namePrefix,
          value: value?.[field.name] ?? null,
        });
      }
    }
  },
);
