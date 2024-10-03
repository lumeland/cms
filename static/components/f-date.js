import { toLocal } from "./utils.js";
import { Input } from "./f-datetime.js";

customElements.define(
  "f-date",
  class extends Input {
    get inputAttributes() {
      return { type: "date" };
    }

    // Get the value in the format "YYYY-MM-DD"
    format(date) {
      return toLocal(new Date(date)).toISOString().split("T")[0];
    }
  },
);
