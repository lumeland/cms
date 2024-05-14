import { Component } from "./component.js";

customElements.define(
  "u-draggable",
  class Draggable extends Component {
    get draggables() {
      return Array.from(this.parentElement.parentElement.children);
    }

    init() {
      const button = document.createElement("button");
      button.type = "button";
      button.classList.add("buttonIcon");
      button.innerHTML = "<u-icon name='dots-six-vertical'></u-icon>";
      this.prepend(button);

      const item = this.parentElement;

      button.addEventListener("mousedown", () => {
        this.draggables.forEach((child) => child.draggable = true);
      });

      button.addEventListener("mouseup", () => {
        this.draggables.forEach((child) => child.draggable = false);
      });

      item.addEventListener("dragstart", () => {
        this.draggables.forEach((child) => {
          if (child !== item) {
            child.classList.add("is-drag-hint");
          } else {
            child.classList.add("is-dragging");
          }
        });
      });

      item.addEventListener("dragend", () => {
        this.draggables.forEach((child) => {
          child.classList.remove("is-drag-hint", "is-dragging", "is-drag-over");
          child.draggable = false;
        });
      });

      item.addEventListener("dragenter", () => {
        if (item.classList.contains("is-dragging")) {
          return;
        }
        item.classList.add("is-drag-over");

        const dragging = this.draggables.find((child) =>
          child.classList.contains("is-dragging")
        );

        if (
          dragging.compareDocumentPosition(item) ===
            Node.DOCUMENT_POSITION_FOLLOWING
        ) {
          item.classList.add("is-drag-over-after");
        } else {
          item.classList.add("is-drag-over-before");
        }
      });

      item.addEventListener("dragleave", () => {
        item.classList.remove("is-drag-over");
        item.classList.remove("is-drag-over-before");
        item.classList.remove("is-drag-over-after");
      });

      item.addEventListener("dragover", (e) => {
        e.preventDefault();
      });

      item.addEventListener("drop", (e) => {
        e.preventDefault();
        if (item.classList.contains("is-dragging")) {
          return;
        }

        const dragging = this.draggables.find((child) =>
          child.classList.contains("is-dragging")
        );

        if (
          dragging.compareDocumentPosition(item) ===
            Node.DOCUMENT_POSITION_FOLLOWING
        ) {
          item.insertAdjacentElement("afterend", dragging);
        } else {
          item.insertAdjacentElement("beforebegin", dragging);
        }
        item.classList.remove("is-drag-over");
        item.classList.remove("is-drag-over-before");
        item.classList.remove("is-drag-over-after");
      });
    }
  },
);
