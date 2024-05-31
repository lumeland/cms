import proxy from "../server/proxy.ts";

export default proxy({
  serve: "demo/dev.ts",
  basePath: "",
});
