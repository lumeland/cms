import { Component } from "./component.js";

customElements.define(
  "u-action",
  class Action extends Component {
    init() {
      const form = this.querySelector("form");
      const iframe = this.querySelector("iframe");
      const submit = this.querySelector("button");

      form.addEventListener("submit", () => {
        iframe.hidden = false;
        submit.disabled = true;
      });
      
      this.closest("dialog").addEventListener("toggle", () => {
        iframe.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>`;
        submit.disabled = false;
      });
    }
  },
);
