import { push, url } from "./utils.js";
import { Component } from "./component.js";

customElements.define(
  "u-pagepreview",
  class Modal extends Component {
    static get observedAttributes() {
      return ["data-src"];
    }

    init() {
      const { src } = this.dataset;

      if (!src) {
        this.innerHTML = "";
        return;
      }

      let iframe;

      function update(src) {
        if (!iframe) {
          const dialog = push(document.body, "dialog", {
            class: "modal is-preview",
          });
          iframe = push(dialog, "iframe", { class: "modal-content", src });
          dialog.show();
        }
        if (src) {
          iframe.src = src;
        } else {
          iframe.contentDocument.location.reload();
        }
      }

      const protocol = document.location.protocol === "https:"
        ? "wss://"
        : "ws://";
      const ws = new WebSocket(
        protocol + document.location.host + url("_socket"),
      );

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: "open", src }));
      };

      ws.onmessage = (e) => {
        const data = JSON.parse(e.data);

        if (data.type === "open" && data.src === src) {
          update(data.url);
        } else if (data.type === "updated") {
          update(data.url);
        }
      };
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (name !== "data-src") {
        return;
      }

      if (!oldValue || oldValue === newValue) {
        return;
      }

      this.init();
    }
  },
);
