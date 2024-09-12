import { toLocal } from "./utils.js";
import { Input } from "./f-text.js";

customElements.define(
  "f-readonly_current_datetime",
  class extends Input {
    init() {
      super.init();

      // Force the input to be readonly
      this.querySelector("input").readOnly = true;
    }

    submitHandler = () => {
      this.querySelector("input").value = format(new Date());
    }

    connectedCallback() {
      super.connectedCallback();

      // On submit, the value should be the current datetime
      this.closest("form").addEventListener("submit", this.submitHandler);
    }

    disconnectedCallback() {
      this.closest("form").removeEventListener("submit", this.submitHandler);
    }

    get inputAttributes() {
      return { type: "datetime-local", class: "input" };
    }

    get value() {
      const value = super.value;

      if (value) {
        return format(new Date(value));
      }
      return format(new Date());
    }
  },
);

// Get the value in the format "YYYY-MM-DDTHH:MM"
function format(date = new Date()) {
  return toLocal(date).toISOString().slice(0, 16);
}
