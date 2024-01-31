import { push } from "./utils.js";
import { Component } from "./component.js";

customElements.define(
  "u-modal",
  class Modal extends Component {
    init() {
      const { src, name } = this.dataset;

      const dialog = push(this, "dialog", {
        class: "modal is-aside",
        onclose: () => this.remove(),
        onclick: closeOnClickOutside,
      });

      push(dialog, "button", {
        class: "buttonIcon modal-close",
        onclick: () => dialog.close(),
      }, "<u-icon name='x'></u-icon>");

      if (src) {
        push(dialog, "iframe", { class: "modal-content", src, name });
      }

      dialog.showModal();
    }
  },
);

customElements.define(
  "u-modal-trigger",
  class Modal extends Component {
    init() {
      const button = this.querySelector("button");
      const { target } = this.dataset;
      if (!target) {
        throw new Error("No target found");
      }
      const modal = document.getElementById(target);

      if (modal?.tagName !== "DIALOG") {
        throw new Error(`No modal found with id '${target}'`);
      }

      modal.addEventListener("click", closeOnClickOutside);

      button.addEventListener("click", () => {
        modal.showModal();
      });

      push(modal, "button", {
        class: "buttonIcon modal-close",
        onclick: () => modal.close(),
      }, "<u-icon name='x'></u-icon>");
    }
  },
);

function closeOnClickOutside(e) {
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
}
