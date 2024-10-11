import {
  asset,
  fileType,
  labelify,
  oninvalid,
  push,
  url,
  view,
} from "./utils.js";
import { Component } from "./component.js";
import { init } from "../libs/markdown.js";

customElements.define(
  "f-markdown",
  class extends Component {
    init() {
      this.classList.add("field");
      const { schema, value, isNew, namePrefix } = this;
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
        oninvalid,
      });

      const shadow = this.attachShadow({ mode: "open" });
      shadow.innerHTML = `
      <link rel="stylesheet" href="${asset("styles", "code.css")}">
      <slot></slot>
      `;

      const helpers = push(this, "div", { class: "tools is-sticky" });

      for (const name of schema.details?.uploads || []) {
        push(helpers, "button", {
          class: "button is-secondary",
          type: "button",
          onclick() {
            push(document.body, "u-modal", {
              data: { src: url("uploads", name) },
            });
          },
        }, `<u-icon name="image-square-fill"></u-icon> ${labelify(name)}`);
      }

      const code = push(shadow, "div", { class: "code" });
      const md = init(code, textarea, pasteLink);
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
    }
  },
);

function pasteLink(url, selectedText = "") {
  switch (fileType(url)) {
    case "image":
      return `![${selectedText || "Image"}](${url})`;

    case "video":
      return `<video src="${url}" controls>${selectedText}</video>`;

    case "audio":
      return `<audio src="${url}" controls>${selectedText}</audio>`;

    default:
      return `[${selectedText || "Link"}](${url})`;
  }
}
