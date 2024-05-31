import proxy from "../server/proxy.ts";

Deno.serve({
  handler: proxy({
    serve: "demo/dev.ts",
  }),
});
