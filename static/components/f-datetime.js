import { toLocal } from "./utils.js";
import { Input } from "./f-text.js";

customElements.define(
  "f-datetime",
  class extends Input {
    get inputAttributes() {
      return { type: "datetime-local", class: "input" };
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

function format(date = new Date()) {
  return toLocal(date).toISOString().slice(0, 16);
}
