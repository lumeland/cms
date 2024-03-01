import { options, push, url } from "./utils.js";
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

      let iframe, lastUrl;

      const reload = (url) => {
        if (!iframe) {
          iframe = this.initUI(url);
        }

        if (lastUrl === url) {
          iframe?.contentDocument.location.reload();
        } else if (lastUrl) {
          iframe.src = url;
        }

        lastUrl = url;
      };

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

    initUI(url) {
      const dialog = push(document.body, "dialog", {
        class: "modal is-preview",
      });
      const iframe = push(dialog, "iframe", {
        class: "modal-content",
        src: url,
      });

      const mq = matchMedia("(max-width:1100px)");

      let icon;
      const button = push(this, "button", {
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
      });

      if (options.get("preview") !== false) {
        icon = push(button, "u-icon", { name: "eye" });
        button.dispatchEvent(new Event("click"));
      } else {
        icon = push(button, "u-icon", { name: "eye-slash" });
        button.setAttribute("aria-pressed", "false");
      }

      push(this, "a", {
        class: "button is-link",
        href: url,
        target: "_blank",
        rel: "noopener",
      }, "<u-icon name=arrow-square-out></u-icon> Open");

      mq.addEventListener("change", (ev) => {
        if (ev.matches) {
          dialog.close();
          button.hidden = true;
        } else {
          dialog.show();
          button.hidden = false;
        }
      });

      return iframe;
    }
  },
);
