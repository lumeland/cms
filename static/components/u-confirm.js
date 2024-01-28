import { Component } from "./component.js";

customElements.define(
  "u-confirm",
  class Preview extends Component {
    init() {
      const trigger = this.querySelector("button, a");

      trigger.addEventListener("click", (event) => {
        if (!confirm(this.dataset.message)) {
          event.preventDefault();
        }
      });
    }
  },
);
