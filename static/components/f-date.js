import { toLocal } from "./utils.js";
import { Input } from "./f-text.js";

customElements.define(
  "f-date",
  class extends Input {
    get inputAttributes() {
      return { type: "date", class: "input" };
    }

    init() {
      if (this.value) {
        this.value = format(new Date(this.value));
      }

      super.init();
    }
  },
);

// Get the value in the format "YYYY-MM-DD"
function format(date = new Date()) {
  return toLocal(date).toISOString().split("T")[0];
}
