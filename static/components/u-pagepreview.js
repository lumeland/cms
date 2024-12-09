import { options, url } from "./utils.js";
import { Component } from "./component.js";
import dom from "dom";

customElements.define(
  "u-pagepreview",
  class Modal extends Component {
    static get observedAttributes() {
      return ["data-src"];
    }

    init() {
      const { src, url: initUrl } = this.dataset;

      if (!src) {
        this.innerHTML = "";
        return;
      }

      const socketUrl = new URL(url("_socket"), document.location.origin);
      socketUrl.protocol = document.location.protocol === "https:"
        ? "wss:"
        : "ws:";

      const ws = new WebSocket(socketUrl);

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

      ws.onmessage = (e) => {
        const data = JSON.parse(e.data);

        if (data.type === "reload") {
          reload(data.url);
          return;
        }

        if (data.type === "preview") {
          if (initUrl) {
            reload(initUrl);
            return;
          }
          ws.send(JSON.stringify({ type: "url", src }));
        }
      };

      ws.onopen = () => {
        if (initUrl) {
          reload(initUrl);
          return;
        }
        ws.send(JSON.stringify({ type: "url", src }));
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
      const dialog = dom("dialog", {
        class: "modal is-preview",
      }, document.body);
      const iframe = dom("iframe", {
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

      return iframe;
    }
  },
);
