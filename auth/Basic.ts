import type { AuthProvider } from "../types.ts";

/** Basic auth provider */
export class Basic implements AuthProvider {
  #challengeHeader = ["WWW-Authenticate", 'Basic realm="Secure Area"'];

  options: Parameters<AuthProvider["init"]>[0] | undefined;

  static create(): Basic {
    return new Basic();
  }

  init(options: NonNullable<Basic["options"]>) {
    this.options = options;
  }

  async login(request: Request) {
    this.#assertOptions();

    const value = request.headers.get("authorization");
    const credentials = this.#parseCredentials(value);

    if (credentials) {
      const [user, password] = credentials;

      for (const [name, config] of this.options.users) {
        if (user === name && password == config.password) {
          return name;
        }
      }
    }

    return new Response("Unauthorized", {
      status: 401,
      headers: [this.#challengeHeader],
    });
  }

  async logout(_request: Request) {
    return new Response("Logged out", {
      headers: [this.#challengeHeader],
      status: 401,
    });
  }

  async fetch(_request: Request) {
    return new Response("Not found", { status: 404 });
  }

  #parseCredentials(
    value?: string | null,
  ): [string, string] | undefined {
    const match = value?.match(/^Basic\s+(.*)$/);

    if (!match) {
      return;
    }

    const [user, ...passwordParts] = atob(match[1]).split(":");
    return [user, passwordParts.join(":")];
  }

  #assertOptions(): asserts this is { options: NonNullable<Basic["options"]> } {
    if (!this.options) {
      throw new Error("AuthProvider not initialized");
    }
  }
}
