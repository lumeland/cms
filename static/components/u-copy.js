import { dom, push } from "./utils.js";
import { Component } from "./component.js";

customElements.define(
  "u-copy",
  class Preview extends Component {
    init() {
      const icon = dom("u-icon", { name: "copy" });

      push(this, "button", {
        type: "button",
        class: "buttonIcon",
        onclick: async () => {
          const text = this.getAttribute("text");
          await navigator.clipboard.writeText(text);
          icon.setAttribute("name", "check");
          const tooltip = push(this, "div", {
            role: "tooltip",
          }, "Copied to clipboard!");
          setTimeout(() => {
            icon.setAttribute("name", "copy");
            tooltip.remove();
          }, 2000);
        },
      }, icon);
    }
  },
);
