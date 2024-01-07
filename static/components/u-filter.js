import { push } from "./utils.js";
import { Component } from "./component.js";

customElements.define(
  "u-filter",
  class Icon extends Component {
    init() {
      let results;

      const value = new URLSearchParams(location.hash.substring(1)).get(
        "filter",
      );

      const input = push(this, "input", {
        type: "search",
        class: "input",
        placeholder: this.dataset.placeholder,
        value,
        onfocus: () => {
          results = Array.from(
            document.querySelectorAll(this.dataset.selector),
          ).map((result) => [
            result,
            tokenize(result.textContent),
          ]);
        },
        oninput() {
          const value = tokenize(this.value);
          results.forEach(([node, content]) => {
            node.hidden = !content.includes(value);
          });
          history.replaceState({}, "", `#filter=${value}`);
        },
      });

      if (value) {
        input.dispatchEvent(new Event("focus"));
        input.dispatchEvent(new Event("input"));
      }
    }
  },
);

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/\W/g, "");
}
