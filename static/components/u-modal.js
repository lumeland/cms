import { Component } from "./component.js";
import dom from "dom";

customElements.define(
  "u-modal",
  class Modal extends Component {
    init() {
      const { src } = this.dataset;

      const dialog = dom("dialog", {
        class: "modal is-aside",
        onclose: () => this.remove(),
        onclick: closeOnClickOutside,
      }, this);

      dom("button", {
        class: "buttonIcon modal-close",
        onclick: () => dialog.close(),
        html: "<u-icon name='x'></u-icon>",
      }, dialog);

      if (src) {
        dom("iframe", { class: "modal-content", src }, dialog);
      }

      dialog.showModal();
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
