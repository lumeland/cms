import { Input } from "./f-text.js";

customElements.define(
  "f-url",
  class extends Input {
    get inputAttributes() {
      return { type: "url", class: "input" };
    }
  },
);
