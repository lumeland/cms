import { dom, fileType, push } from "./utils.js";
import { Component } from "./component.js";

customElements.define(
  "u-copy",
  class Preview extends Component {
    init() {
      const type = self.name.endsWith(".markdown") ? "markdown" : "url";
      const iconName = type === "markdown" ? "code" : "link-simple";
      const icon = dom("u-icon", {
        name: iconName,
      });

      push(this, "button", {
        type: "button",
        class: "buttonIcon",
        onclick: async () => {
          let text = this.getAttribute("text");
          if (type === "markdown") {
            text = markdownUrl(text);
          }
          await navigator.clipboard.writeText(text);
          icon.setAttribute("name", "check");
          const tooltip = push(this, "div", {
            role: "tooltip",
          }, type === "markdown" ? "Code copied!" : "URL copied!");
          setTimeout(() => {
            icon.setAttribute("name", iconName);
            tooltip.remove();
          }, 2000);
        },
      }, icon);
    }
  },
);

function markdownUrl(value) {
  switch (fileType(value)) {
    case "image":
      return `![Image](${value})`;

    case "video":
      return `<video src="${value}" controls></video>`;

    case "audio":
      return `<audio src="${value}" controls></audio>`;

    default:
      return `[Link](${value})`;
  }
}
