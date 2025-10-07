import { getNow, updateField } from "./utils.js";
import { Input } from "./f-text.js";

customElements.define(
  "f-current-datetime",
  class extends Input {
    init() {
      this.value = formatDatetime(this.value);
      this.isNew = false;

      super.init();

      const input = this.querySelector("input");
      const abortController = new AbortController();

      // Update the value before submitting the form
      input.form.addEventListener(
        "submit",
        () => input.value = formatDatetime(),
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
      input.value = formatDatetime(value);
      updateField(this, schema, input);
    }
  },
);

// Get the value in the format "YYYY-MM-DDTHH:MM"
function formatDatetime(value) {
  if (!value) {
    value = getNow().toISOString();
  }

  return value.slice(0, 16);
}
