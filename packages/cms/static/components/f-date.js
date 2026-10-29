import { Input } from "./f-datetime.js";
import { t } from "./utils.js";

customElements.define(
  "f-date",
  class extends Input {
    get inputAttributes() {
      return { type: "date" };
    }

    get nowButtonLabel() {
      return t("date.action.today");
    }

    format(value) {
      return value?.slice(0, 10);
    }
  },
);
