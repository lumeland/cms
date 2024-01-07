import { Component } from "./component.js";

const cache = new Map();

customElements.define(
  "u-icon",
  class Icon extends Component {
    static async fetch(name) {
      if (cache.has(name)) {
        return cache.get(name);
      }
      const res = await fetch(`/icons/${name}.svg`);
      const text = await res.text();
      cache.set(name, text);
      return text;
    }

    async init() {
      this.innerHTML = await Icon.fetch(this.getAttribute("name"));
    }
  },
);
