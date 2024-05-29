import proxy from "../server/proxy.ts";

Deno.serve({
  handler: proxy({
    args: ["run", "-A", "--unstable-kv", "demo/serve.ts"],
  }),
});
