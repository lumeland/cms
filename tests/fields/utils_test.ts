import { assertEquals } from "@std/assert";
import { toAbsolutePaths, toRelativePaths } from "../../fields/utils.ts";

const DOMAIN = "https://lume.land";

Deno.test("toAbsolutePaths: Basic Markdown", () => {
  const input = `
    Check [Link](./pages/about.html)
    And image ![](../assets/logo.png)
  `;
  
  const output = toAbsolutePaths(input, (path) => {
    // Basic logic: Remove dots and prepend domain
    const clean = path.replace(/^\.{1,2}/, "");
    return DOMAIN + clean;
  });

  // Should change matches
  assertEquals(output.includes("](https://lume.land/pages/about.html)"), true);
  assertEquals(output.includes("](https://lume.land/assets/logo.png)"), true);
});

Deno.test("toAbsolutePaths: JSON & Quotes", () => {
  const input = `{ "src": "./data/config.json" }`;
  
  const output = toAbsolutePaths(input, (path) => {
    return "/root" + path.substring(1);
  });

  assertEquals(output, `{ "src": "/root/data/config.json" }`);
});

Deno.test("Ignores Markdown Code Blocks", () => {
  const input = `
    Real image: ![](./real.png)
    
    \`\`\`javascript
    const x = "./fake.png"; // Should not change
    \`\`\`
  `;
  
  const output = toAbsolutePaths(input, (path) => "CHANGED");
  
  // Real one changed
  assertEquals(output.includes("![](CHANGED)"), true);
  // Fake one inside code block UNCHANGED
  assertEquals(output.includes('const x = "./fake.png";'), true);
});

Deno.test("Ignores Inline Code", () => {
  const input = `Run \`cp ./foo.txt ./bar.txt\` in terminal.`;
  const output = toAbsolutePaths(input, () => "CHANGED");
  assertEquals(output, input); // Should be identical
});

Deno.test("Ignores HTML <script> and <pre>", () => {
  const input = `
    <script>
      const path = "./hidden.js";
    </script>
    <pre>Do not click ./link.html</pre>
    But click <a href="./real.html">here</a>
  `;
  
  const output = toAbsolutePaths(input, (p) => "ABS" + p.substring(1));
  
  assertEquals(output.includes('const path = "./hidden.js"'), true);
  assertEquals(output.includes('Do not click ./link.html'), true);
  assertEquals(output.includes('href="ABS/real.html"'), true);
});

Deno.test("Ignores Full URLs (https://)", () => {
  const input = `
    This is local: [Local](./local-page.html)
    This is external: [Domestic Wild](https://www.domestic-wild.com/itinerari-la-pletera-pnmm-cat)
    Another external: <img src="http://example.com/image.png">
  `;

  const output = toAbsolutePaths(input, (path) => "/PREFIX" + path.replace(/^\./, ''));

  // Local path SHOULD change
  assertEquals(output.includes("](/PREFIX/local-page.html)"), true, "Failed to convert local path");

  // External HTTPS link should remain EXACTLY the same
  assertEquals(output.includes("(https://www.domestic-wild.com/itinerari-la-pletera-pnmm-cat)"), true, "Accidentally modified https URL!");

  // External HTTP image should remain EXACTLY the same
  assertEquals(output.includes('"http://example.com/image.png"'), true, "Accidentally modified http URL!");
});

Deno.test("toRelativePaths: Logic Check", () => {
  const input = `Go to [Home](/index.html) or [Rel](./other.html)`;
  
  const output = toRelativePaths(input, (path) => {
    return "." + path; // Simple conversion /index -> ./index
  });
  
  // /index.html should become ./index.html
  assertEquals(output.includes("[Home](./index.html)"), true);
  // ./other.html should remain untouched (it was already relative)
  assertEquals(output.includes("[Rel](./other.html)"), true);
});

Deno.test("Path at start/end of line (No quotes)", () => {
  const input = `
./start.png is at the start.
file is at ./end.json
  `;
  
  const output = toAbsolutePaths(input, () => "/ABS");
  
  assertEquals(output.includes("/ABS is at the start"), true);
  assertEquals(output.includes("file is at /ABS"), true);
});
