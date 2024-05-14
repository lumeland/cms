import { push, randomId } from "./utils.js";
import { Component } from "./component.js";

customElements.define(
  "u-popover",
  class Popover extends Component {
    init() {
      const id = randomId();
      let init = false;
      const button = this.querySelector("button");
      button.setAttribute("popovertarget", id);
      const template = this.querySelector("template");

      push(this, "div", {
        id,
        class: "popover",
        popover: "auto",
        onbeforetoggle() {
          if (!init) {
            this.append(template.content.cloneNode(true));
            init = true;
          }
        },
      });
    }
  },
);
