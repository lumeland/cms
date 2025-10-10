import { Component } from "./component.js";
import dom from "dom";

customElements.define(
  "u-busy",
  class Busy extends Component {
    init() {
      const button = this.querySelector("button");
      const { message = "Please wait..." } = this.dataset;
      this.classList.add("ly-none");

      button.form.addEventListener("submit", () => {
        document.querySelectorAll("dialog[open]").forEach((dialog) =>
          dialog.close()
        );
        dom("dialog", {
          class: "u-busy",
          html: `<p>${message}</p>`,
        }, document.body).showModal();
      });
    }
  },
);
