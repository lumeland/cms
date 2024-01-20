import { fileType, push, url } from "./utils.js";
import { Component } from "./component.js";

const cache = new Map();

customElements.define(
  "u-icon",
  class Icon extends Component {
    static get observedAttributes() {
      return ["name"];
    }

    static fetch(name) {
      if (cache.has(name)) {
        return cache.get(name);
      }

      const code = fetch(url("icons", `${name}.svg`))
        .then((res) => res.text());

      cache.set(name, code);
      return doce;
    }

    async init() {
      this.innerHTML = await Icon.fetch(this.getAttribute("name"));
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (name === "name" && oldValue !== newValue) {
        this.init();
      }
    }
  },
);

customElements.define(
  "u-icon-file",
  class Icon extends Component {
    init() {
      const path = this.getAttribute("path");
      switch (fileType(path)) {
        case "image":
          push(this, "u-icon", { name: "image-square-fill" });
          break;

        case "video":
          push(this, "u-icon", { name: "video-fill" });
          break;

        case "audio":
          push(this, "u-icon", { name: "headphones-fill" });
          break;

        case "pdf":
          push(this, "u-icon", { name: "file-pdf-fill" });
          break;

        default:
          push(this, "u-icon", { name: "file" });
          break;
      }
    }
  },
);
