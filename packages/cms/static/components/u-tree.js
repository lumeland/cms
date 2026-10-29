import { Component } from "./component.js";

customElements.define(
  "u-tree",
  class Views extends Component {
    state = {};

    init() {
      try {
        const state = JSON.parse(localStorage.getItem("tree"));
        this.state = state[this.dataset.name] ?? {};
      } catch {
        // Ignore
      }

      this.querySelectorAll("details").forEach((details) => {
        const key = Array.from(getParentDetails(details)).join("/");

        if (this.state[key]) {
          details.open = true;
        }

        details.addEventListener("toggle", () => {
          this.state[key] = details.open;
          this.save();
        });
      });
    }

    save() {
      let state = {};
      try {
        state = JSON.parse(localStorage.getItem("tree")) ?? {};
      } catch {
        // Ignore
      }
      state[this.dataset.name] = this.state;
      localStorage.setItem("tree", JSON.stringify(state));
    }
  },
);

function* getParentDetails(parent) {
  while (parent.tagName === "DETAILS") {
    yield parent.querySelector("summary")?.innerText;
    parent = parent.parentElement.closest("details, u-tree");
  }
}
