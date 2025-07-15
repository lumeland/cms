export class TransformError extends Error {
  constructor(message) {
    super(message);
    this.name = "TransformError";
  }
}
