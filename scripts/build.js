import { cpSync, readFileSync, writeFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync("package.json", "utf-8"));
pkg.exports = {
  ".": {
    types: "./mod.d.ts",
    import: "./mod.js",
  },
  "./*.js": {
    types: "./*.d.ts",
    import: "./*.js",
  },
  "./*.ts": {
    types: "./*.d.ts",
    import: "./*.js",
  },
};

delete pkg.scripts;
delete pkg.devDependencies;
delete pkg.devEngines;
delete pkg.packageManager;
delete pkg.files;

writeFileSync("build/package.json", JSON.stringify(pkg, null, 2));

cpSync("core/templates", "build/core/templates", { recursive: true });
cpSync("static", "build/static", { recursive: true });
cpSync("CHANGELOG.md", "build/CHANGELOG.md", { recursive: true });
cpSync("README.md", "build/README.md", { recursive: true });
