import { Input } from "./f-text.js";

customElements.define(
  "f-datetime",
  class extends Input {
    get inputAttributes() {
      return { type: "datetime-local", class: "input is-narrow" };
    }
  },
);
