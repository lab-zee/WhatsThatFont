export class ModelError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ModelError";
  }
}

export class ModelTimeoutError extends Error {
  constructor() {
    super("Model call exceeded the configured timeout.");
    this.name = "ModelTimeoutError";
  }
}
