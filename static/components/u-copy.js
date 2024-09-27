import { dom, push } from "./utils.js";
import { Component } from "./component.js";

customElements.define(
  "u-copy",
  class Preview extends Component {
    init() {
      const icon = dom("u-icon", { name: "link-simple" });

      push(this, "button", {
        type: "button",
        class: "buttonIcon",
        onclick: async () => {
          const text = this.getAttribute("text");
          await navigator.clipboard.writeText(text);
          icon.setAttribute("name", "check");
          const tooltip = push(this, "div", {
            class: "tooltip",
          }, "URL copied!");
          setTimeout(() => {
            icon.setAttribute("name", "link-simple");
            tooltip.remove();
          }, 2000);
        },
      }, icon);
    }
  },
);
