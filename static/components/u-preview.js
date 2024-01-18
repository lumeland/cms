import { Component } from "./component.js";

customElements.define(
  "u-preview",
  class Preview extends Component {
    init() {
      const src = this.getAttribute("src");
      const extension = src.split(".").pop().toLowerCase();

      switch (extension) {
        case "jpg":
        case "jpeg":
        case "png":
        case "svg":
        case "gif":
        case "webp":
        case "ico":
          this.innerHTML = `<img src="${src}" alt="Preview" />`;
          break;

        case "mp4":
        case "webm":
        case "mov":
        case "avi":
          this.innerHTML = `<video src="${src}" controls></video>`;
          break;

        case "mp3":
        case "wav":
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
