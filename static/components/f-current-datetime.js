import { toLocal } from "./utils.js";
import { Input } from "./f-text.js";

customElements.define(
  "f-current-datetime",
  class extends Input {
    inputHandler = () => {
      this.removeEventListener("input", this.inputHandler);
      // When the user inputs, the value will not be modified before submitting
      this.closest("form").removeEventListener("submit", this.submitHandler);
    };

    submitHandler = () => {
      this.querySelector("input").value = format(new Date());
    };

    init() {
      super.init();

      this.addEventListener("input", this.inputHandler);
      this.closest("form").addEventListener("submit", this.submitHandler);
    }

    disconnectedCallback() {
      this.removeEventListener("input", this.inputHandler);
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

    set value(value) {
      super.value = value;
    }
  },
);

// Get the value in the format "YYYY-MM-DDTHH:MM"
function format(date = new Date()) {
  return toLocal(date).toISOString().slice(0, 16);
}
