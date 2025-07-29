import { options } from "./utils.js";
import { Component } from "./component.js";
import dom from "dom";

customElements.define(
  "u-pagepreview",
  class Modal extends Component {
    static get observedAttributes() {
      return ["data-url"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (name === "data-url" && oldValue !== newValue) {
        const { iframe } = this;
        if (iframe) {
          iframe.src = newValue;
        }
      }
    }

    init() {
      const { url } = this.dataset;

      if (!url) {
        return;
      }

      const dialog = dom("dialog", {
        class: "modal is-preview",
      }, document.body);

      this.iframe = dom("iframe", {
        class: "modal-content",
        src: url,
      }, dialog);

      const mq = matchMedia("(max-width:1100px)");

      let icon;
      const button = dom("button", {
        class: "buttonIcon is-secondary",
        type: "button",
        "aria-pressed": "true",
        onclick: () => {
          if (dialog.open) {
            dialog.close();
            options.set("preview", false);
            icon.setAttribute("name", "eye-slash");
            button.setAttribute("aria-pressed", "false");
          } else if (!mq.matches) {
            dialog.show();
            options.set("preview", true);
            icon.setAttribute("name", "eye");
            button.setAttribute("aria-pressed", "true");
          }
        },
      }, this);

      if (options.get("preview") !== false) {
        icon = dom("u-icon", { name: "eye" }, button);
        button.dispatchEvent(new Event("click"));
      } else {
        icon = dom("u-icon", { name: "eye-slash" }, button);
        button.setAttribute("aria-pressed", "false");
      }

      mq.addEventListener("change", (ev) => {
        if (ev.matches) {
          dialog.close();
          button.hidden = true;
        } else {
          dialog.show();
          button.hidden = false;
        }
      });
    }
  },
);
