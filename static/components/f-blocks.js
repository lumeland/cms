import { asset, view } from "./utils.js";
import { Component } from "./component.js";
import { init } from "../libs/gutenberg.js";
import dom from "dom";

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

      dom("label", {
        for: `field_${namePrefix}.0`,
        html: schema.label,
      }, this);

      if (schema.description) {
        dom("div", {
          class: "field-description",
          html: schema.description,
        }, this);
      }

      const textarea = dom("textarea", {
        id,
        name,
        value: isNew ? schema.value : value,
        hidden: true,
      }, this);

      const code = dom("div", { class: "block-editor" }, this);
      init(code, textarea, [
        asset("styles", "variables.css"),
        asset("styles", "reset.css"),
        asset("styles", "block-editor.css"),
      ], "max(100vh - 10em, 500px)");
    }
  },
);
