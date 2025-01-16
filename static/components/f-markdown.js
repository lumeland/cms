import { asset, fileType, labelify, oninvalid, url, view } from "./utils.js";
import { Component } from "./component.js";
import { init } from "../libs/markdown.js";
import dom from "dom";

customElements.define(
  "f-markdown",
  class extends Component {
    init() {
      this.classList.add("field");
      const { schema, value, isNew, namePrefix } = this;
      const name = `${namePrefix}.${schema.name}`;
      const id = `field_${name}`;

      view(this);
      dom("label", { for: `field_${namePrefix}.0`, html: schema.label }, this);

      if (schema.description) {
        dom(
          "div",
          { class: "field-description", html: schema.description },
          this,
        );
      }

      const textarea = dom("textarea", {
        id,
        name,
        value: isNew ? schema.value : value,
        hidden: true,
        oninvalid,
      }, this);

      const shadow = this.attachShadow({ mode: "open" });
      shadow.innerHTML = `
      <link rel="stylesheet" href="${asset("styles", "code.css")}">
      <slot></slot>
      `;

      const helpers = dom("div", { class: "tools is-sticky" }, this);

      for (const name of schema.details?.upload || []) {
        dom("button", {
          class: "button is-secondary",
          type: "button",
          onclick() {
            dom("u-modal", {
              data: { src: url("uploads", name) },
            }, document.body);
          },
          html: `<u-icon name="image-square-fill"></u-icon> ${labelify(name)}`,
        }, helpers);
      }

      const code = dom("div", { class: "code" }, shadow);
      const md = init(code, textarea, pasteLink);
      let tools;

      tools = dom("div", { class: "tools-group" }, helpers);
      [
        [md.makeBold, "text-b"],
        [md.makeItalic, "text-italic"],
        [md.makeStrikethrough, "text-strikethrough"],
      ].forEach(([fn, icon]) => {
        dom("button", {
          class: "buttonIcon",
          type: "button",
          html: `<u-icon name="${icon}"></u-icon>`,
          onclick() {
            fn(md.editor);
          },
        }, tools);
      });

      tools = dom("div", { class: "tools-group" }, helpers);
      [
        [md.makeH1, "text-h-one"],
        [md.makeH2, "text-h-two"],
        [md.makeH3, "text-h-three"],
        [md.makeH4, "text-h-four"],
      ].forEach(([fn, icon]) => {
        dom("button", {
          class: "buttonIcon",
          type: "button",
          html: `<u-icon name="${icon}"></u-icon>`,
          onclick() {
            fn(md.editor);
          },
        }, tools);
      });

      tools = dom("div", { class: "tools-group" }, helpers);
      dom("button", {
        class: "buttonIcon",
        type: "button",
        onclick() {
          const url = prompt("URL to link to:");

          if (url) {
            md.insertLink(md.editor, url);
          }
        },
        html: `<u-icon name="link-simple"></u-icon>`,
      }, tools);

      const helpUrl = "https://www.markdownguide.org/basic-syntax/";
      dom("a", {
        class: "buttonIcon",
        href: helpUrl,
        target: "_blank",
        html: `<u-icon name="question"></u-icon>`,
      }, tools);

      this.editor = md.editor;
    }

    get currentValue() {
      return this.editor.state.doc.toString();
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
