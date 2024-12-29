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
      this.value = this.value ? format(new Date(this.value)) : format();
      this.isNew = false;

      super.init();

      this.addEventListener("input", this.inputHandler);
      this.closest("form").addEventListener("submit", this.submitHandler);
    }

    get inputAttributes() {
      return { type: "datetime-local", class: "input" };
    }

    get currentValue() {
      return this.querySelector("input[type='datetime-local']").value;
    }
  },
);

// Get the value in the format "YYYY-MM-DDTHH:MM"
function format(date = new Date()) {
  return toLocal(date).toISOString().slice(0, 16);
}
