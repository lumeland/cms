import { toLocal, push } from "./utils.js";
import { Input } from "./f-text.js";

customElements.define(
  "f-current_datetime",
  class extends Input {
    init() {
      super.init();

      // If there is a value, show the previous value
      if (super.value) {
        push(this, "div", { class: "field-description" }, `Was: ${new Date(super.value).toLocaleString()}`);
      }
    }

    inputHandler = () => {
      // When the user inputs, stop updating the value
      this.interval && clearInterval(this.interval) && (this.interval = null);
    }

    connectedCallback() {
      super.connectedCallback();

      // Update the value every second
      this.interval = setInterval(() => {
        this.querySelector("input").value = format();
      }, 1000);

      this.addEventListener("input", this.inputHandler);
    }

    disconnectedCallback() {
      clearInterval(this.interval) && (this.interval = null);
      this.removeEventListener("input", this.inputHandler);
    }

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
