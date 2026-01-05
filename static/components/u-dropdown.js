import { Component } from "./component.js";

customElements.define(
  "u-dropdown",
  class Views extends Component {
    init() {
      this.attachShadow({ mode: "open" });
      const { icon = "dots-three-vertical" } = this.dataset;

      this.shadowRoot.innerHTML = `
        <style>
          :host {
            position: relative;
            display: block;
          }
          .menu-selector {
            display: flex;
            white-space: nowrap;
            flex-direction: column;
          }
          .menu-selector-button {
            background: var(--color-line-light);
            color: var(--color-text);
            border: none;
            padding: 0;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: var(--border-radius);
            cursor: pointer;
            transition-property: color, background;
            transition-duration: var(--animation-duration);

            &[aria-expanded="true"],
            &:hover {
              background: var(--color-line);
            }
          }
          .menu-selector-button svg {
            display: block;
            fill: currentColor;
            width: 24px;
            height: 24px;
          }
          .menu-selector-list:not([hidden]) {
            --padding: 6px;
            position: absolute;
            top: calc(100% + var(--padding));
            right: 0;
            display: flex;
            gap: 0px;
            flex-direction: column;
            padding: var(--padding);
            border-radius: var(--border-radius);
            box-shadow: var(--shadow);
            background: var(--color-line-light);
            width: 200px;
          }
          .menu-selector-header {
            padding: 0.5em;
            font: var(--font-small);
            color: var(--color-dim);
            border-bottom: 1px solid var(--color-line);
          }
        </style>
        <div class="menu-selector" part="dropdown">
          <button aria-label="Options" aria-controls="options-list" class="menu-selector-button" type="button" part="dropdown-button">
            <u-icon name="${icon}"><u-icon>
          </button>
          <div id="options-list" class="menu-selector-list" hidden part="dropdown-links">
            <div class="menu-selector-header"><slot name="header"></slot></div>
            <slot></slot>
          </div>
        </div>
      `;

      const button = this.shadowRoot.querySelector(".menu-selector-button");
      const list = this.shadowRoot.querySelector(".menu-selector-list");

      button.addEventListener("click", (ev) => {
        const expanded = button.ariaExpanded === "true" ? "false" : "true";
        button.ariaExpanded = expanded;
        list.hidden = expanded === "false";
        ev.stopPropagation();
      });

      this.ownerDocument.body.addEventListener("click", () => {
        setTimeout(() => {
          button.ariaExpanded = "false";
          list.hidden = true;
        }, 10);
      });

      this.addEventListener("keydown", (ev) => {
        if (ev.key === "Escape") {
          button.ariaExpanded = "false";
          list.hidden = true;
        }
      });
    }
  },
);
