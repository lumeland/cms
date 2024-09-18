import { toLocal } from "./utils.js";
import { Input } from "./f-text.js";

customElements.define(
  "f-datetime",
  class extends Input {
    get inputAttributes() {
      return { type: "datetime-local", class: "input" };
    }

    init() {
      if (this.value) {
        this.value = format(new Date(this.value));
      }

      super.init();
    }
  },
);

function format(date = new Date()) {
  return toLocal(date).toISOString().slice(0, 16);
}
