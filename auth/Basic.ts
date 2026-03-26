import { deleteCookie, getCookies, setCookie } from "../deps/std.ts";
import type { AuthProvider, UserConfiguration } from "../types.ts";

/** Basic auth provider */
export class Basic implements AuthProvider {
  #headerName = "Authorization";
  #challengeHeader = ["WWW-Authenticate", 'Basic realm="Secure Area"'];
  #cookieAttributes: Parameters<typeof deleteCookie>[2] = {
    httpOnly: true,
    partitioned: true,
    path: "/",
    secure: true,
  };

  static create(): Basic {
    return new Basic();
  }

  getUsername(
    headers: Headers,
    users: Map<string, UserConfiguration>,
  ): string | undefined {
    const credentials = this.#parseCredentials(headers.get(this.#headerName)) ||
      this.#parseCredentials(
        decodeURIComponent(getCookies(headers)[this.#headerName] ?? ""),
      );

    if (!credentials) {
      return;
    }

    const [user, password] = credentials;

    for (const [name, config] of users.entries()) {
      if (user === name && password == config.password) {
        return name;
      }
    }
  }

  login(request: Request) {
    const value = request.headers.get(this.#headerName);
    const credentials = this.#parseCredentials(value);

    if (!credentials) {
      return new Response("Unauthorized", {
        status: 401,
        headers: [this.#challengeHeader],
      });
    }

    // Credentials are not validated here. Validation is deferred to getUsername().

    const requestUrl = new URL(request.url);

    const unsafeRedirect = requestUrl.searchParams.get("redirect_uri");
    let safeRedirect;
    if (unsafeRedirect) {
      try {
        const redirectUrl = new URL(unsafeRedirect);
        if (this.#isSameOrigin(requestUrl, redirectUrl)) {
          safeRedirect = redirectUrl.pathname + redirectUrl.search +
            redirectUrl.hash;
        }
      } catch { /* empty */ }
    }

    const location = safeRedirect ??
      (requestUrl.pathname.replace("/auth/login", "") || "/");

    const headers = new Headers({ location });

    setCookie(headers, {
      ...this.#cookieAttributes,
      name: this.#headerName,
      value: encodeURIComponent(value!),
    });

    return new Response(null, {
      headers,
      status: 302,
    });
  }

  logout() {
    const headers = new Headers([this.#challengeHeader]);
    deleteCookie(headers, this.#headerName, this.#cookieAttributes);
    return new Response("Logged out", {
      headers,
      status: 401,
    });
  }

  fetch() {
    return new Response("Not found", { status: 404 });
  }

  #isSameOrigin(url: URL, another: URL): boolean {
    return url.origin === another.origin;
  }

  #parseCredentials(value?: string | null): [string, string] | undefined {
    const match = value?.match(/^Basic\s+(.*)$/);

    if (!match) {
      return;
    }

    const [user, ...passwordParts] = atob(match[1]).split(":");
    return [user, passwordParts.join(":")];
  }
}
