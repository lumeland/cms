import app from "./dev.ts";

Deno.serve({
  handler: app.init().fetch,
  port: 3000,
});
