import { toLocal, push } from "./utils.js";
import { Input } from "./f-text.js";

customElements.define(
  "f-current_datetime",
  class extends Input {
    inputHandler = () => {
      this.removeEventListener("input", this.inputHandler);
      // When the user inputs, the value will not be modified before submitting
      this.closest("form").removeEventListener("submit", this.submitHandler);
      // Also, the previous value will be shown
      if (super.value) {
        push(this, "div", { class: "field-description" }, `Was: ${new Date(super.value).toLocaleString()}`);
      }
    }

    submitHandler = () => {
      this.querySelector("input").value = format(new Date());
    }

    connectedCallback() {
      super.connectedCallback();

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
  },
);

// Get the value in the format "YYYY-MM-DDTHH:MM"
function format(date = new Date()) {
  return toLocal(date).toISOString().slice(0, 16);
}
