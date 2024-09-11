import { toLocal } from "./utils.js";
import { Input } from "./f-text.js";

customElements.define(
  "f-current_datetime",
  class extends Input {
    get inputAttributes() {
      return { type: "datetime-local", class: "input" };
    }

    get value() {
      return format(new Date());
    }
  },
);

// Get the value in the format "YYYY-MM-DDTHH:MM"
function format(date = new Date()) {
  return toLocal(date).toISOString().slice(0, 16);
}
