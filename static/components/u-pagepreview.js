import { Component } from "./component.js";
import dom from "dom";

customElements.define(
  "u-pagepreview",
  class Modal extends Component {
    #document;

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

      this.#document = new Promise((resolve) => {
        this.iframe = dom("iframe", {
          class: "pagepreview",
          src: url,
          onload() {
            resolve(this.contentDocument);
          },
        }, div);
      });
    }

    async highlight(selector) {
      const doc = await this.#document;
      const element = doc?.querySelector(selector);
      if (!element) {
        return;
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
