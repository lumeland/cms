import { describe, it, expect } from "vitest";
import { getRelativePath } from "../../../core/utils/path.ts";

describe("getRelativePath", () => {
  it("resolves", () => {
    expect(getRelativePath("/data/foobar", "/data/foobar/asset.jpg")).toBe("./asset.jpg");
    expect(getRelativePath("/data/foobar/", "/data/foobar/asset.jpg")).toBe("./asset.jpg");
    expect(getRelativePath("/data/foobar", "/data/baz/asset.jpg")).toBe("../baz/asset.jpg");
    expect(getRelativePath("/data/foobar/", "/data/baz/asset.jpg")).toBe("../baz/asset.jpg");
    expect(getRelativePath("/data/foobar", "/data/foobar/.env")).toBe("./.env");
    expect(getRelativePath("/data/foobar/", "/data/foobar/.env")).toBe("./.env");
    expect(getRelativePath("/data/foobar", "/data/foobar/../foobar/file")).toBe("./file");
  });
});
