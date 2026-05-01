import { Component } from "./component.js";
import dom from "dom";

customElements.define(
  "u-pagepreview",
  class Modal extends Component {
    #document;
    #isClosed = false;

    static get observedAttributes() {
      return ["data-url"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (name === "data-url" && oldValue !== newValue) {
        this.init();
      }
    }

    init() {
      const { url } = this.dataset;

      if (!url || this.#isClosed) {
        return;
      }

      const iframe = this.querySelector("iframe");

      if (iframe) {
        iframe.src = url;
        return;
      }

      this.#document = new Promise((resolve) => {
        dom("iframe", {
          class: "pagepreview",
          src: url,
          onload() {
            resolve(this.contentDocument);
          },
        }, this);
      });
    }

    set closed(value) {
      this.#isClosed = value;

      if (value) {
        this.innerText = "";
      } else {
        this.init();
      }
    }

    get closed() {
      return this.#isClosed;
    }

    async highlight(selector) {
      const doc = await this.#document;
      const element = doc?.querySelector(selector);
      if (!element) {
        return false;
      }
      const container = this.iframe.parentElement;

      container.style.zIndex = 12;

      // Create the div that will highlight the element
      const div = dom("div", {
        class: "pagepreview-mask",
      }, container);

      // Scroll to the element
      element.scrollIntoView({ behavior: "instant", block: "center" });

      // Set the position and size of the mask
      const rect = element.getBoundingClientRect();
      const offset = 4;

      div.style.setProperty(
        "--position",
        `${rect.left - offset / 2}px ${rect.top - offset / 2}px`,
      );
      div.style.setProperty(
        "--size",
        `${rect.width + offset}px ${rect.height + offset}px`,
      );

      // Remove the mask after a while
      setTimeout(() => {
        div.remove();
        container.style.zIndex = null;
      }, 3000);
    }
  },
);
