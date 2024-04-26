import { resolve } from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    target: "esnext",
    lib: {
      entry: resolve(__dirname, "src/main.js"),
      name: "Blocks",
      filename: "gutenberg.js",
      formats: ["es"],
    },
  },
  plugins: [react()],
  define: {
    "process.env.IS_GUTENBERG_PLUGIN": JSON.stringify(false),
    "process.env.NODE_ENV": "'production'",
  },
});
