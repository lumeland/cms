import { fileType } from "./utils.js";
import { Component } from "./component.js";

customElements.define(
  "u-preview",
  class Preview extends Component {
    init() {
      const src = this.getAttribute("src");

      switch (fileType(src)) {
        case "image":
          this.innerHTML = `<img src="${src}" alt="Preview" />`;
          break;

        case "video":
          this.innerHTML = `<video src="${src}" controls></video>`;
          break;

        case "audio":
          this.innerHTML = `<audio src="${src}" controls></audio>`;
          break;

        case "pdf":
          this.innerHTML = `<iframe src="${src}" title="Preview"></iframe>`;
          break;

        default:
          this.innerHTML = `<p>Cannot preview</p>`;
          break;
      }
    }
  },
);
