import { Component } from "./component.js";

export class Field extends Component {
  #schema;
  #value;
  #namePrefix;

  set schema(schema) {
    this.#schema = schema;
  }

  get schema() {
    if (!this.#schema) {
      this.#schema = JSON.parse(this.dataset.field ?? "null");
    }
    return this.#schema;
  }

  set value(value) {
    this.#value = value;
  }

  get value() {
    if (!this.#value) {
      this.#value = JSON.parse(this.dataset.value ?? "null");
    }
    return this.#value;
  }

  set namePrefix(prefix) {
    this.#namePrefix = prefix;
  }

  get namePrefix() {
    if (!this.#namePrefix) {
      this.#namePrefix = this.dataset.nameprefix ?? "";
    }
    return this.#namePrefix;
  }
}
