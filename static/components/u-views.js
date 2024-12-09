import { initialViews, labelify } from "./utils.js";
import { Component } from "./component.js";
import dom from "dom";

customElements.define(
  "u-views",
  class Views extends Component {
    init() {
      const { views, target, state } = this.dataset;
      this.classList.add("tools");
      const targetElement = document.getElementById(target);
      const group = dom("div", { class: "tools-group" }, this);

      if (!targetElement || !views) {
        return;
      }

      if (initialViews.size === 0 && state) {
        for (const view of JSON.parse(state)) {
          initialViews.add(view);
        }

        history.replaceState(
          null,
          "",
          `#${Array.from(initialViews).join(",")}`,
        );
      }

      const visibleViews = new Set();

      for (const view of JSON.parse(views)) {
        const visible = initialViews.has(view);
        const button = dom("button", {
          type: "button",
          class: "button is-secondary",
          "aria-pressed": String(visible),
          html: labelify(view),
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
        }, group);
      }
    }

    update(target, views) {
      target.querySelectorAll("[data-view]").forEach((element) => {
        const view = element.dataset.view;
        element.hidden = !view || !views.has(view);
      });

      const visible = Array.from(views).join(",");
      history.replaceState(
        null,
        "",
        visible ? `#${visible}` : location.pathname,
      );
    }
  },
);
