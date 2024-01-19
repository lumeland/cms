import { push } from "./utils.js";
import { Component } from "./component.js";

customElements.define(
  "u-modal",
  class Modal extends Component {
    init() {
      const dialog = push(this, "dialog", {
        class: "modal",
        onclose: () => this.remove(),
        // Close the modal when clicking outside of it
        onclick(e) {
          if (e.target.tagName !== "DIALOG") {
            return;
          }

          const rect = e.target.getBoundingClientRect();
          const clickedInDialog = rect.top <= e.clientY &&
            e.clientY <= rect.top + rect.height &&
            rect.left <= e.clientX &&
            e.clientX <= rect.left + rect.width;

          if (clickedInDialog === false) {
            e.target.close();
          }
        },
      });

      const src = this.getAttribute("src");

      push(dialog, "button", {
        class: "buttonIcon modal-close",
        onclick: () => dialog.close(),
      }, "<u-icon name='x'></u-icon>");

      if (src) {
        push(dialog, "iframe", { class: "modal-content", src });
      }

      dialog.showModal();
    }
  },
);
