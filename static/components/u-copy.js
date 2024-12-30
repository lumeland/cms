import { Component } from "./component.js";
import dom from "dom";

customElements.define(
  "u-copy",
  class Copy extends Component {
    init() {
      const icon = dom("u-icon", { name: "link-simple" });

      dom("button", {
        type: "button",
        class: "buttonIcon",
        html: icon,
        onclick: async () => {
          const text = this.getAttribute("text");
          await navigator.clipboard.writeText(text);
          icon.setAttribute("name", "check");
          const tooltip = dom("div", {
            class: "tooltip",
            html: "URL copied!",
          }, this);
          setTimeout(() => {
            icon.setAttribute("name", "link-simple");
            tooltip.remove();
          }, 2000);
        },
      }, this);
    }
  },
);
