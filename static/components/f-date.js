import { Input } from "./f-text.js";

customElements.define(
  "f-date",
  class extends Input {
    get inputAttributes() {
      return { type: "date", class: "input is-narrow" };
    }
  },
);
