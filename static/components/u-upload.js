import { Component } from "./component.js";
import dom from "dom";

customElements.define(
  "u-upload",
  class Preview extends Component {
    init() {
      this.prepend(dom("button", {
        class: "buttonIcon is-secondary",
        title: "Paste image from clipboard",
        type: "button",
        html: "<u-icon name='clipboard'></u-icon>",
        onclick: async () => {
          const fileInput = this.querySelector("input[type=file]");

          if (!fileInput) {
            return;
          }

          try {
            const content = await navigator.clipboard.read();

            for (const item of content) {
              // Check if the clipboard item is an image
              if (item.types.includes("image/png")) {
                const blob = await item.getType("image/png");
                let name = prompt(
                  "Enter a name for the image",
                  "clipboard.png",
                );
                if (!name.endsWith(".png")) {
                  name += ".png";
                }
                name.replaceAll(" ", "-");
                const file = new File([blob], name, {
                  type: "image/png",
                });
                const transfer = new DataTransfer();
                transfer.items.add(file);
                fileInput.files = transfer.files;
                fileInput.dispatchEvent(new Event("change"));
                break;
              }
              // Check if the clipboard item is a url
              if (item.types.includes("text/plain")) {
                const url = await (await item.getType("text/plain")).text();
                if (URL.canParse(url)) {
                  const response = await fetch(url);
                  if (!response.ok) {
                    alert("Failed to fetch image the URL." + url);
                    return;
                  }
                  const blob = await response.blob();
                  const name = url
                    .split("/")
                    .pop()
                    .replaceAll(" ", "-")
                    .toLowerCase();
                  const file = new File([blob], name, {
                    type: "image/png",
                  });
                  const transfer = new DataTransfer();
                  transfer.items.add(file);
                  fileInput.files = transfer.files;
                  fileInput.dispatchEvent(new Event("change"));
                  break;
                }
              }
            }
          } catch {
            alert(
              "Failed to read clipboard. Copy an image or URL and try again.",
            );
          }
        },
      }));
    }
  },
);
