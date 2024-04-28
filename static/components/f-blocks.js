import { asset, push } from "./utils.js";
import { Field } from "./field.js";
import { init } from "../libs/gutenberg.js";

const styleLink = document.createElement("link");
styleLink.rel = "stylesheet";
styleLink.href = import.meta.resolve("../styles/block-editor.css");
document.head.appendChild(styleLink);

customElements.define(
  "f-blocks",
  class extends Field {
    init() {
      this.classList.add("field");
      const { schema, value, namePrefix } = this;
      const name = `${namePrefix}.${schema.name}`;
      const id = `field_${name}`;

      push(this, "label", { for: `field_${namePrefix}.0` }, schema.label);

      if (schema.description) {
        push(this, "div", { class: "field-description" }, schema.description);
      }

      const textarea = push(this, "textarea", {
        id,
        name,
        value,
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
