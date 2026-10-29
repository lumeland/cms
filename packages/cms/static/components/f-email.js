import { Input } from "./f-text.js";

customElements.define(
  "f-email",
  class extends Input {
    get inputAttributes() {
      return { type: "email", class: "input is-narrow" };
    }
  },
);
