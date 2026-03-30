import type { AuthProvider, AuthProviderOptions } from "../types.ts";

/** Basic auth provider */
export class Basic implements AuthProvider {
  #challengeHeader = ["WWW-Authenticate", 'Basic realm="Secure Area"'];

  options: AuthProviderOptions | undefined;

  static create(): Basic {
    return new Basic();
  }

  init(options: AuthProviderOptions) {
    this.options = options;
  }

  login(request: Request) {
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

  logout() {
    return new Response("Logged out", {
      headers: [this.#challengeHeader],
      status: 401,
    });
  }

  fetch() {
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

  #assertOptions(): asserts this is { options: AuthProviderOptions } {
    if (!this.options) {
      throw new Error("AuthProvider not initialized");
    }
  }
}
