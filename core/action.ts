export interface ActionOptions {
  icon?: string;
  name: string;
  label?: string;
  description?: string;
  action: () => unknown;
}

export default class Action {
  icon: string;
  name: string;
  label: string;
  description?: string;
  action: () => unknown;

  constructor(options: ActionOptions) {
    this.icon = options.icon || "lightning";
    this.name = options.name;
    this.label = options.label || options.name;
    this.description = options.description;
    this.action = options.action;
  }

  run() {
    return this.action();
  }
}
