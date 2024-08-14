import { toLocal } from "./utils.js";
import { Input } from "./f-text.js";

customElements.define(
  "f-date",
  class extends Input {
    get inputAttributes() {
      return { type: "date", class: "input" };
    }

    init() {
      super.init();
      const { schema } = this;
      const input = this.querySelector("input");

      switch (schema.mode) {
        case "create":
          if (!input.value) {
            input.value = format();
          }
          break;
        case "update":
          input.value = format();
          break;
      }
    }

    get value() {
      const value = super.value;

      if (value) {
        return format(new Date(value));
      }
      return null;
    }
  },
);

// Get the value in the format "YYYY-MM-DD"
function format(date = new Date()) {
  return toLocal(date).toISOString().split("T")[0];
}
