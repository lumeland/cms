import { Component } from "./component.js";
import dom from "dom";
import {
  CropperCanvas,
  CropperCrosshair,
  CropperGrid,
  CropperHandle,
  CropperImage,
} from "cropper";

CropperCanvas.$define();
CropperImage.$define();
CropperHandle.$define();
CropperGrid.$define();
CropperCrosshair.$define();

customElements.define(
  "u-cropper",
  class Cropper extends Component {
    init() {
      const src = this.getAttribute("data-src");
      const image = new Image();
      image.src = src;
      image.onload = () => {
        this.render(image);
      };
    }

    render(img) {
      const helpers = dom("div", { class: "tools is-sticky" }, this);
      const tools = dom("div", { class: "tools-group" }, helpers);
      const image = dom("cropper-image", {
        src: img.src,
        rotatable: true,
        scalable: true,
        translatable: true,
      });
      const canvas = dom("cropper-canvas", {
        background: true,
        style: {
          width: `min(100%, ${img.width}px)`,
          "aspect-ratio": img.width / img.height,
          margin: "auto",
        },
        "theme-color": "var(--color-primary)",
        scaleStep: 0,
        html: [
          image,
          dom("cropper-shade", { "theme-color": "#0003" }),
          dom("cropper-handle", { action: "select", plain: true }),
        ],
      }, this);

      const selection = dom("cropper-selection", {
        "initial-coverage": 0.9,
        movable: true,
        resizable: true,
        onchange: (event) => {
          const cropperCanvasRect = canvas.getBoundingClientRect();
          const cropperImageRect = image.getBoundingClientRect();
          const maxSelection = {
            x: cropperImageRect.left - cropperCanvasRect.left,
            y: cropperImageRect.top - cropperCanvasRect.top,
            width: cropperImageRect.width,
            height: cropperImageRect.height,
          };

          event.detail.x = 1000;

          if (!inSelection(event.detail, maxSelection)) {
            event.preventDefault();
          }
        },
        html: [
          dom("cropper-grid", {
            covered: true,
          }),
          dom("cropper-crosshair", { centered: true }),
          dom("cropper-handle", {
            action: "move",
            "theme-color": "#FFF3",
            style: {
              outline: "solid 1px var(--color-primary)",
              "box-shadow": "0 0 10px #0006",
            },
          }),
          dom("cropper-handle", {
            action: "n-resize",
            "theme-color": "var(--color-primary)",
          }),
          dom("cropper-handle", {
            action: "e-resize",
            "theme-color": "var(--color-primary)",
          }),
          dom("cropper-handle", {
            action: "s-resize",
            "theme-color": "var(--color-primary)",
          }),
          dom("cropper-handle", {
            action: "w-resize",
            "theme-color": "var(--color-primary)",
          }),
          dom("cropper-handle", {
            action: "ne-resize",
            "theme-color": "var(--color-primary)",
          }),
          dom("cropper-handle", {
            action: "se-resize",
            "theme-color": "var(--color-primary)",
          }),
          dom("cropper-handle", {
            action: "sw-resize",
            "theme-color": "var(--color-primary)",
          }),
          dom("cropper-handle", {
            action: "nw-resize",
            "theme-color": "var(--color-primary)",
          }),
        ],
      }, canvas);

      const form = this.closest("form");
      form.addEventListener("submit", () => {
        const cropperImageRect = image.getBoundingClientRect();
        const scale = img.width / cropperImageRect.width;

        form["x"].value = selection.x * scale;
        form["y"].value = selection.y * scale;
        form["width"].value = selection.width * scale;
        form["height"].value = selection.height * scale;
      });

      dom("button", {
        type: "button",
        class: "buttonIcon",
        title: "Square",
        onclick: () => {
          const min = Math.min(selection.width, selection.height);
          selection.$change(selection.x, selection.y, min, min);
        },
        html: "<u-icon name='square'></u-icon>",
      }, tools);
      dom("button", {
        type: "button",
        class: "buttonIcon",
        title: "Center",
        onclick: () => {
          selection.$center();
        },
        html: "<u-icon name='plus'></u-icon>",
      }, tools);
    }
  },
);

function inSelection(selection, maxSelection) {
  return (
    selection.x >= maxSelection.x &&
    selection.y >= maxSelection.y &&
    (selection.x + selection.width) <= (maxSelection.x + maxSelection.width) &&
    (selection.y + selection.height) <= (maxSelection.y + maxSelection.height)
  );
}
