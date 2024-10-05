import { oninvalid, push, toLocal, view } from "./utils.js";
import { Component } from "./component.js";

export class Input extends Component {
  get inputAttributes() {
    return { type: "datetime-local" };
  }

  // Get the value in the format "YYYY-MM-DDTHH:MM"
  format(date) {
    return toLocal(new Date(date)).toISOString().slice(0, 16);
  }

  init() {
    this.classList.add("field");
    const { schema, value, namePrefix, isNew } = this;
    const name = `${namePrefix}.${schema.name}`;
    const id = `field_${name}`;

    view(this);
    push(this, "label", { for: id }, schema.label);

    if (schema.description) {
      push(this, "div", { class: "field-description" }, schema.description);
    }

    const input = push(this, "input", {
      type: "hidden",
      name,
      value: isNew ? schema.value : value,
    });

    push(this, "input", {
      ...schema.attributes,
      id,
      value: input.value ? this.format(input.value) : null,
      class: "input",
      ...this.inputAttributes,
      oninvalid,
      oninput() {
        input.value = new Date(this.value).toISOString();
      },
    });
  }
}

customElements.define("f-datetime", Input);
