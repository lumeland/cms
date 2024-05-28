export interface Options {
  port?: number;
  args?: string[];
}

export const defaults: Required<Options> = {
  port: 3000,
  args: ["run", "--allow-net", "_cms.serve.ts"],
};

export default function proxy(userOptions?: Options): Deno.ServeHandler {
  const options = { ...defaults, ...userOptions };
  let process: Deno.ChildProcess | undefined;

  return async function (request: Request): Promise<Response> {
    if (!process) {
      process = startServer(options.args);
      await waitForServer(options.port);
    }

    // Forward the request to the server
    const url = new URL(request.url);
    url.port = options.port.toString();

    return await fetch(url, {
      redirect: "manual",
      method: request.method,
      headers: request.headers,
      body: request.body,
    });
  };
}

function startServer(args: string[]): Deno.ChildProcess {
  const command = new Deno.Command(Deno.execPath(), { args });
  return command.spawn();
}

async function waitForServer(port: number) {
  while (true) {
    try {
      await fetch(`http://localhost:${port}`);
      break;
    } catch {
      console.log("Waiting for the server to start...");
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}
