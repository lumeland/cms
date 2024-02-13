import { labelify, push, url } from "./utils.js";
import { Field } from "./field.js";
import { init } from "../libs/markdown.js";

customElements.define(
  "f-markdown",
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

      const helpers = push(this, "div", { class: "tools" });
      for (const name of Object.keys(schema.cmsContent.uploads || {})) {
        push(helpers, "button", {
          class: "button is-secondary",
          type: "button",
          onclick() {
            push(document.body, "u-modal", {
              data: {
                src: url("uploads", name),
                name: `${name}.markdown`,
              },
            });
          },
        }, `<u-icon name="image-square-fill"></u-icon> ${labelify(name)}`);
      }

      const code = push(this, "div", { class: "code" });
      const md = init(code, textarea.value);
      let tools;

      tools = push(helpers, "div", { class: "tools-group" });
      [
        [md.makeBold, "text-b"],
        [md.makeItalic, "text-italic"],
        [md.makeStrikethrough, "text-strikethrough"],
      ].forEach(([fn, icon]) => {
        push(tools, "button", {
          class: "buttonIcon",
          type: "button",
          onclick() {
            fn(md.editor);
          },
        }, `<u-icon name="${icon}"></u-icon>`);
      });

      tools = push(helpers, "div", { class: "tools-group" });
      [
        [md.makeH1, "text-h-one"],
        [md.makeH2, "text-h-two"],
        [md.makeH3, "text-h-three"],
        [md.makeH4, "text-h-four"],
        [md.makeH5, "text-h-five"],
        [md.makeH6, "text-h-six"],
      ].forEach(([fn, icon]) => {
        push(tools, "button", {
          class: "buttonIcon",
          type: "button",
          onclick() {
            fn(md.editor);
          },
        }, `<u-icon name="${icon}"></u-icon>`);
      });

      tools = push(helpers, "div", { class: "tools-group" });
      push(tools, "button", {
        class: "buttonIcon",
        type: "button",
        onclick() {
          const url = prompt("URL to link to:");

          if (url) {
            md.insertLink(md.editor, url);
          }
        },
      }, `<u-icon name="link-simple"></u-icon>`);

      const helpUrl = "https://www.markdownguide.org/basic-syntax/";
      push(tools, "a", {
        class: "buttonIcon",
        href: helpUrl,
        target: "_blank",
      }, `<u-icon name="question"></u-icon>`);

      this.editor = md.editor;
      textarea.form.addEventListener("submit", () => {
        textarea.value = editor.state.doc.toString();
      });
    }
  },
);
