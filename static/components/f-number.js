import { Input } from "./f-text.js";

customElements.define(
  "f-number",
  class extends Input {
    get inputAttributes() {
      return { type: "number", class: "input is-narrow" };
    }
  },
);
