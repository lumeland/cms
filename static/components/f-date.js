import { toLocal } from "./utils.js";
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

    // Get the value in the format "YYYY-MM-DD"
    format(date) {
      if (!(date instanceof Date)) {
        date = new Date(date);
      }
      return toLocal(date).toISOString().split("T")[0];
    }
  },
);
