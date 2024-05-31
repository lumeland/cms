import { Options as GitOptions } from "../core/git.ts";

export interface Options {
  port?: number;
  path?: string;
  serve: string;
  git?: GitOptions | boolean;
}

export const defaults: Required<Options> = {
  port: 3000,
  path: "",
  serve: "_cms.serve.ts",
  git: false,
};

export default function proxy(userOptions?: Options): Deno.ServeHandler {
  const options = { ...defaults, ...userOptions };
  const { port, path, serve, git } = options;

  let process: Deno.ChildProcess | undefined;
  let ws: WebSocket | undefined;
  const sockets = new Set<WebSocket>();

  return async function (request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === `${path}/_git`) {
      // Get the request form data
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
    const env: Record<string, string> = {};

    if (git) {
      env["LUMECMS_GIT"] = JSON.stringify(git === true ? {} : git);
    }

    const command = new Deno.Command(Deno.execPath(), {
      args: ["serve", "--allow-all", "--unstable-kv", `--port=${port}`, serve],
      env,
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
        console.log("Waiting for the server to start...");
        await new Promise((resolve) => setTimeout(resolve, 1000));
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
