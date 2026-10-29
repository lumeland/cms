export class Component extends HTMLElement {
  #initialized = false;

  connectedCallback() {
    if (!this.#initialized) {
      this.#initialized = true;
      this.init();
    }
  }

  init() {
    throw new Error("Not implemented");
  }
}
