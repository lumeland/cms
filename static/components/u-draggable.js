import { Component } from "./component.js";

customElements.define(
  "u-draggable",
  class Draggable extends Component {
    get draggables() {
      return Array.from(this.parentElement.children)
        .filter((child) => child instanceof Draggable);
    }

    init() {
      const button = document.createElement("button");
      button.type = "button";
      button.classList.add("buttonIcon");
      button.innerHTML = "<u-icon name='dots-six-vertical'></u-icon>";
      this.prepend(button);

      button.addEventListener("mousedown", () => {
        this.draggables.forEach((child) => child.draggable = true);
      });

      button.addEventListener("mouseup", () => {
        this.draggables.forEach((child) => child.draggable = false);
      });

      this.addEventListener("dragstart", () => {
        this.draggables.forEach((child) => {
          if (child !== this) {
            child.classList.add("is-drag-hint");
          } else {
            child.classList.add("is-dragging");
          }
        });
      });

      this.addEventListener("dragend", () => {
        this.draggables.forEach((child) => {
          child.classList.remove("is-drag-hint", "is-dragging", "is-drag-over");
          child.draggable = false;
        });
      });

      this.addEventListener("dragenter", () => {
        if (this.classList.contains("is-dragging")) {
          return;
        }
        this.classList.add("is-drag-over");

        const dragging = this.draggables.find((child) =>
          child.classList.contains("is-dragging")
        );

        if (
          dragging.compareDocumentPosition(this) ===
            Node.DOCUMENT_POSITION_FOLLOWING
        ) {
          this.classList.add("is-drag-over-after");
        } else {
          this.classList.add("is-drag-over-before");
        }
      });

      this.addEventListener("dragleave", () => {
        this.classList.remove("is-drag-over");
        this.classList.remove("is-drag-over-before");
        this.classList.remove("is-drag-over-after");
      });

      this.addEventListener("dragover", (e) => {
        e.preventDefault();
      });

      this.addEventListener("drop", (e) => {
        e.preventDefault();
        if (this.classList.contains("is-dragging")) {
          return;
        }

        const dragging = this.draggables.find((child) =>
          child.classList.contains("is-dragging")
        );

        if (
          dragging.compareDocumentPosition(this) ===
            Node.DOCUMENT_POSITION_FOLLOWING
        ) {
          this.insertAdjacentElement("afterend", dragging);
        } else {
          this.insertAdjacentElement("beforebegin", dragging);
        }
        this.classList.remove("is-drag-over");
        this.classList.remove("is-drag-over-before");
        this.classList.remove("is-drag-over-after");
      });
    }
  },
);
