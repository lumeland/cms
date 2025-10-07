import { Input } from "./f-datetime.js";

customElements.define(
  "f-date",
  class extends Input {
    get inputAttributes() {
      return { type: "date" };
    }

    get nowButtonLabel() {
      return "Today";
    }

    format(value) {
      return value?.slice(0, 10);
    }
  },
);
