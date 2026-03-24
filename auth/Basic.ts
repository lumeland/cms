import type { AuthProvider, UserConfiguration } from "../types.ts";

/** Basic auth provider */
export class Basic implements AuthProvider {
  static create(): Basic {
    return new Basic();
  }

  getUsername(
    request: Request,
    users: Map<string, UserConfiguration>,
  ): string | undefined {
    const match = request.headers.get("authorization")?.match(/^Basic\s+(.*)$/);

    if (!match) {
      return;
    }

    const [user, password] = atob(match[1]).split(":");

    for (const [name, config] of users.entries()) {
      if (user === name && password == config.password) {
        return name;
      }
    }
  }

  login(): Response {
    return new Response("Unauthorized", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Secure Area"',
      },
    });
  }

  logout(): Response {
    return new Response("Logged out", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Secure Area"',
      },
    });
  }
}
