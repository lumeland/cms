import { Input } from "./f-text.js";

customElements.define(
  "f-date",
  class extends Input {
    get inputAttributes() {
      return { type: "date", class: "input is-narrow" };
    }

    get value() {
      let value = super.value;

      if (typeof value === "string") {
        value = new Date(value);
        super.value = value;
      }

      // Get the value in the format "YYYY-MM-DD"
      return value?.toISOString().split("T")[0];
    }
  },
);
