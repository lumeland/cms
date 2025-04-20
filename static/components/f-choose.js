import { view } from "./utils.js";
import { Component } from "./component.js";
import dom from "dom";

customElements.define(
  "f-choose",
  class extends Component {
    init() {
      this.classList.add("field");
      const { namePrefix, schema, value } = this;
      let open = true;

      view(this);
      dom("label", {
        for: `field_${namePrefix}.${schema.name}`,
        onclick: () => {
          open = !open;
          this.querySelectorAll("details.accordion").forEach((el) =>
            el.open = open
          );
        },
        html: schema.label,
      }, this);

      if (schema.description) {
        dom("div", {
          class: "field-description",
          html: schema.description,
        }, this);
      }

      const div = dom("div", { class: "field-content" }, this);

      function createOption(type) {
        const field = schema.fields.find((f) => f.name === type);
        if (!field) {
          throw new Error(`Unknown field type: ${type}`);
        }

        const item = dom(field.tag, {
          ".schema": {
            ...field,
            name: schema.name,
            attributes: { ...field.attributes, open: true },
            label: field.label || field.name,
            fields: [
              {
                name: "type",
                tag: "f-hidden",
                value: type,
              },
              ...field.fields,
            ],
          },
          ".namePrefix": namePrefix,
          ".isNew": true,
          value: { ...value, type },
        });

        return item;
      }

      const footer = dom("footer", {
        class: "field-footer ly-rowStack",
      }, this);

      const select = dom("select", {
        class: "select",
        onchange: () => {
          div.innerHTML = "";

          if (select.value) {
            div.append(createOption(select.value));
          }
        },
      }, footer);

      dom("option", {
        value: "",
        text: "None",
      }, select);

      dom("hr", select);

      for (const field of schema.fields) {
        dom("option", {
          value: field.name,
          html: field.label ?? field.name,
        }, select);
      }

      select.value = value?.type ?? "";
      if (select.value) {
        div.append(createOption(select.value));
      }
    }

    get currentValue() {
      return this.querySelector(".field-content").firstChild?.currentValue ??
        null;
    }
  },
);
