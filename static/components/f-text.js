import { Field } from "./field.js";
import { push, pushOptions } from "./utils.js";

export class Input extends Field {
  get inputAttributes() {
    return { type: "text", class: "input" };
  }

  init() {
    this.classList.add("field");
    const { schema, value, namePrefix } = this;
    const name = `${namePrefix}.${schema.name}`;
    const id = `field_${name}`;

    push(this, "label", { for: id }, schema.label);

    if (schema.description) {
      push(this, "div", { class: "field-description" }, schema.description);
    }

    const input = push(this, "input", {
      id,
      name,
      value,
      ...this.inputAttributes,
    });

    if (schema.options) {
      const dataListId = `${id}_datalist`;
      const datalist = push(this, "datalist", { id: dataListId });
      pushOptions(datalist, schema.options);
      input.setAttribute("list", dataListId);
      input.setAttribute("autocomplete", "off");
    }
  }
}

customElements.define("f-text", Input);
