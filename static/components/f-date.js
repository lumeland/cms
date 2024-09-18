import { toLocal } from "./utils.js";
import { Input } from "./f-text.js";

customElements.define(
  "f-date",
  class extends Input {
    get inputAttributes() {
      return { type: "date", class: "input" };
    }

    get value() {
      const value = super.value;

      if (value) {
        return format(new Date(value));
      }
      return null;
    }

    set value(value) {
      super.value = value;
    }
  },
);

// Get the value in the format "YYYY-MM-DD"
function format(date = new Date()) {
  return toLocal(date).toISOString().split("T")[0];
}
