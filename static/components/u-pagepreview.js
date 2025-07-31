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
      const div = dom("div", {
        class: "pagepreview",
      }, document.body);

      this.iframe = dom("iframe", {
        class: "pagepreview",
        src: url,
      }, div);
    }
  },
);
