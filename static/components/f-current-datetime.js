import { toLocal, updateField } from "./utils.js";
import { Input } from "./f-text.js";

customElements.define(
  "f-current-datetime",
  class extends Input {
    init() {
      this.value = this.value ? format(new Date(this.value)) : format();
      this.isNew = false;

      super.init();

      const input = this.querySelector("input");
      const abortController = new AbortController();

      // Update the value before submitting the form
      input.form.addEventListener(
        "submit",
        () => input.value = format(new Date()),
        { signal: abortController.signal },
      );

      // If the user inputs a new value, don't update the value
      input.addEventListener("input", () => abortController.abort(), {
        once: true,
      });
    }

    get inputAttributes() {
      return { type: "datetime-local", class: "input" };
    }

    get currentValue() {
      return this.querySelector("input[type='datetime-local']").value;
    }

    update(schema, value) {
      const input = this.querySelector("input");
      input.value = value ? format(new Date(value)) : format();
      updateField(this, schema, input);
    }
  },
);

// Get the value in the format "YYYY-MM-DDTHH:MM"
function format(date = new Date()) {
  return toLocal(date).toISOString().slice(0, 16);
}
