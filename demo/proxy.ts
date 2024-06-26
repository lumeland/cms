import proxy from "../server/proxy.ts";

export default proxy({
  serve: "demo/dev.ts",
  basePath: "",
  auth: {
    method: "basic",
    users: {
      "admin": "admin",
    },
  },
});
