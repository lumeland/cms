import { initialViews, labelify, push } from "./utils.js";
import { Component } from "./component.js";

customElements.define(
  "u-views",
  class Views extends Component {
    init() {
      const { views, target } = this.dataset;
      this.classList.add("tools");
      const targetElement = document.getElementById(target);

      if (!targetElement || !views) {
        return;
      }

      const visibleViews = new Set();

      for (const view of JSON.parse(views)) {
        const visible = initialViews.has(view);
        const button = push(this, "button", {
          type: "button",
          class: "button is-secondary",
          "aria-pressed": String(visible),
          onclick: () => {
            const pressed = button.getAttribute("aria-pressed") === "true";
            button.setAttribute("aria-pressed", String(!pressed));
            if (pressed) {
              visibleViews.delete(view);
            } else {
              visibleViews.add(view);
            }
            this.update(targetElement, visibleViews);
          },
        }, labelify(view));
      }
    }

    update(target, views) {
      target.querySelectorAll("[data-view]").forEach((element) => {
        const view = element.dataset.view;
        element.hidden = !view || !views.has(view);
      });

      const visible = Array.from(views).join(",");
      history.replaceState(null, "", `#${visible}`);
    }
  },
);
