import { push } from "./utils.js";
import { Component } from "./component.js";

customElements.define(
  "u-fields",
  class Form extends Component {
    init() {
      const fields = JSON.parse(this.dataset.fields ?? "null");
      const value = JSON.parse(this.dataset.value ?? "null");
      const namePrefix = "changes";
      const isNew = !("value" in this.dataset);

      for (const field of fields) {
        push(this, field.tag, {
          schema: field,
          namePrefix,
          value: value?.[field.name] ?? null,
          isNew,
        });
      }
    }
  },
);
