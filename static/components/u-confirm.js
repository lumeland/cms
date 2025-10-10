import { Component } from "./component.js";

customElements.define(
  "u-confirm",
  class Confirm extends Component {
    init() {
      const trigger = this.querySelector("button, a");
      this.classList.add("ly-none");

      trigger.addEventListener("click", (event) => {
        if (!confirm(this.dataset.message)) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      });
    }
  },
);
