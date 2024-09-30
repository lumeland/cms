import { asset, push, view } from "./utils.js";
import { Component } from "./component.js";
import { init } from "../libs/gutenberg.js";

const styleLink = document.createElement("link");
styleLink.rel = "stylesheet";
styleLink.href = import.meta.resolve("../styles/block-editor.css");
document.head.appendChild(styleLink);

customElements.define(
  "f-blocks",
  class extends Component {
    init() {
      this.classList.add("field");
      const { schema, value, namePrefix, isNew } = this;
      const name = `${namePrefix}.${schema.name}`;
      const id = `field_${name}`;

      view(this);
      push(this, "label", { for: `field_${namePrefix}.0` }, schema.label);

      if (schema.description) {
        push(this, "div", { class: "field-description" }, schema.description);
      }

      const textarea = push(this, "textarea", {
        id,
        name,
        value: isNew ? schema.value : value,
        hidden: true,
      });

      const code = push(this, "div", { class: "block-editor" });
      init(code, textarea, [
        asset("styles", "variables.css"),
        asset("styles", "reset.css"),
        asset("styles", "block-editor.css"),
      ], "max(100vh - 10em, 500px)");
    }
  },
);
