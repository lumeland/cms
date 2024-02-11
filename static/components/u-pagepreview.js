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

      const protocol = document.location.protocol === "https:"
        ? "wss://"
        : "ws://";
      const ws = new WebSocket(
        protocol + document.location.host + url("_socket"),
      );

      let iframe;
      let lastUrl;

      function reload(url) {
        if (!iframe) {
          const dialog = push(document.body, "dialog", {
            class: "modal is-preview " +
              (matchMedia("(max-width:500px)").matches ? "is-hidden" : ""),
          });
          iframe = push(dialog, "iframe", { class: "modal-content", src: url });
          // deno-lint-ignore prefer-const
          let icon;
          const button = push(dialog, "button", {
            class: "modal-toggle buttonIcon is-primary",
            onclick: () => {
              dialog.classList.toggle("is-hidden");
              icon.setAttribute(
                "name",
                dialog.classList.contains("is-hidden")
                  ? "caret-double-right"
                  : "caret-double-left",
              );
            },
          });
          icon = push(button, "u-icon", {
            name: dialog.classList.contains("is-hidden")
              ? "caret-double-right"
              : "caret-double-left",
          });
          dialog.show();
        }

        if (lastUrl === url) {
          iframe?.contentDocument.location.reload();
        } else if (lastUrl) {
          iframe.src = url;
        }

        lastUrl = url;
      }

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: "url", src }));
      };

      ws.onmessage = (e) => {
        const data = JSON.parse(e.data);

        if (data.type === "reload") {
          reload(data.url);
          return;
        }

        if (data.type === "preview") {
          ws.send(JSON.stringify({ type: "url", src }));
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
