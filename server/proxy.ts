import { Options as GitOptions } from "../core/git.ts";

export interface Options {
  port?: number;
  path?: string;
  serve: string;
  git?: GitOptions | boolean;
  auth?: AuthOptions;
  env?: Record<string, string>;
}

export interface AuthOptions {
  method: "basic";
  users: Record<string, string>;
}

export const defaults = {
  port: 3000,
  path: "",
  serve: "_cms.serve.ts",
  git: false,
};

export default function serve(userOptions?: Options) {
  return {
    fetch: proxy(userOptions),
  };
}

export function proxy(userOptions?: Options): Deno.ServeHandler {
  const options = { ...defaults, ...userOptions };
  const { port, path, serve, git, env } = options;

  let process: Deno.ChildProcess | undefined;
  let ws: WebSocket | undefined;
  const sockets = new Set<WebSocket>();

  return async function (request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Basic authentication
    if (options.auth) {
      const { method, users } = options.auth;
      if (method === "basic") {
        if (!handleBasicAuthentication(request, users)) {
          return new Response("Unauthorized", {
            status: 401,
            headers: { "www-authenticate": 'Basic realm="Secure Area"' },
          });
        }
      }
    }

    // Git actions
    if (url.pathname === `${path}/_git`) {
      const formData = await request.formData();

      try {
        closeServer();
        const { handleForm } = await import("./actions/git.ts");
        await handleForm(formData);
      } catch (error) {
        const message = Deno.inspect(error);
        return new Response(message, { status: 500 });
      }

      const redirect = url.searchParams.get("redirect") || url.origin + path;
      return Response.redirect(redirect, 303);
    }

    if (!process) {
      await startServer();
    }

    // Forward the request to the server
    url.port = port.toString();

    const headers = new Headers(request.headers);
    headers.set("host", url.host);
    headers.set("origin", url.origin);
    headers.set("x-lume-cms-proxy", "true");

    if (headers.get("upgrade") === "websocket") {
      return proxyWebSocket(request);
    }
    const response = await fetch(url, {
      redirect: "manual",
      headers,
      method: request.method,
      body: request.body,
    });

    return response;
  };

  // Start the server
  async function startServer() {
    console.log("Starting proxy server");
    const envVars = { ...env };

    if (git) {
      envVars["LUMECMS_GIT"] = JSON.stringify(git === true ? {} : git);
    }

    const command = new Deno.Command(Deno.execPath(), {
      args: ["serve", "--allow-all", "--unstable-kv", `--port=${port}`, serve],
      env: envVars,
    });

    process = command.spawn();
    ws = await startWebSocket();
  }

  // Close the server
  function closeServer() {
    process?.kill();
    ws?.close();
    process = undefined;
    ws = undefined;
    sockets.clear();
  }

  // Start the WebSocket server
  async function startWebSocket(): Promise<WebSocket> {
    let timeout = 0;

    while (true) {
      try {
        const ws = new WebSocket(`ws://localhost:${port}${path}/_socket`);

        ws.onmessage = (event) => {
          for (const socket of sockets) {
            socket.send(event.data);
          }
        };

        return await new Promise((resolve, reject) => {
          ws.onopen = () => resolve(ws);
          ws.onerror = reject;
        });
      } catch {
        timeout += 1000;
        await new Promise((resolve) => setTimeout(resolve, timeout));
      }
    }
  }

  // Proxy the WebSocket connection
  function proxyWebSocket(request: Request) {
    const { socket, response } = Deno.upgradeWebSocket(request);

    socket.onmessage = (event) => {
      ws?.send(event.data);
    };

    socket.onopen = () => {
      sockets.add(socket);
    };

    socket.onclose = () => {
      sockets.delete(socket);
    };

    return response;
  }
}

function handleBasicAuthentication(
  request: Request,
  users: Record<string, string>,
): boolean {
  const auth = request.headers.get("authorization");
  if (!auth) {
    return false;
  }

  const [type, credentials] = auth.split(" ");
  if (type.toLowerCase() !== "basic") {
    return false;
  }

  const [username, password] = atob(credentials).split(":");
  if (!users[username] || users[username] !== password) {
    return false;
  }

  return true;
}
