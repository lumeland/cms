import { createServer } from "node:http";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

import type { IncomingMessage, ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";

export interface HTTPServerOptions {
  port?: number;
  hostname?: string;
  signal?: AbortSignal;
  handler: (request: Request) => Promise<Response>;
}

/** Start a new HTTP server */
export function serve(options: HTTPServerOptions): void {
  const {
    handler,
    port = 8000,
    hostname = "0.0.0.0",
    signal,
  } = options;

  const server = createServer(async (req, res) => {
    try {
      const request = toRequest(req, res, port);
      const response = await handler(request);
      await sendResponse(response, res);
    } catch (error) {
      console.error(error);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end("Internal Server Error");
      } else {
        res.destroy();
      }
    }
  });

  function shutdown() {
    server.close();
    server.closeAllConnections();
  }
  if (signal) {
    if (signal.aborted) shutdown();
    else signal.addEventListener("abort", shutdown, { once: true });
  }

  server.listen(port, hostname, () => {
    const info = server.address() as AddressInfo;
    console.log("HTTP server started:", `http://localhost:${info.port}`);
  });
}

function toRequest(req: IncomingMessage, res: ServerResponse, port: number): Request {
  const protocol = "http";
  const host = req.headers.host ?? `localhost:${port}`;
  const url = new URL(req.url ?? "/", `${protocol}://${host}`);
  const headers = new Headers();

  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) headers.append(key, v);
    } else {
      headers.set(key, value);
    }
  }

  const controller = new AbortController();
  res.on("close", () => {
    if (!res.writableFinished) controller.abort();
  });
  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  return new Request(url, {
    method: req.method,
    headers,
    body: hasBody ? (Readable.toWeb(req) as ReadableStream) : null,
    signal: controller.signal,
    // @ts-expect-error required by Node (undici) when sending a stream body
    duplex: "half",
  });
}

async function sendResponse(response: Response, res: ServerResponse): Promise<void> {
  res.statusCode = response.status;
  if (response.statusText) {
    res.statusMessage = response.statusText;
  }

  for (const [key, value] of response.headers) {
    if (key.toLowerCase() === "set-cookie") {
      res.setHeader(key, response.headers.getSetCookie());
      continue;
    }
    res.setHeader(key, value);
  }

  if (!response.body) {
    res.end();
    return;
  }

  await pipeline(Readable.fromWeb(response.body as any), res);
}
