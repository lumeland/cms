import { Input } from "./f-text.js";

customElements.define(
  "f-time",
  class extends Input {
    get inputAttributes() {
      return { type: "time", class: "input" };
    }
  },
);
