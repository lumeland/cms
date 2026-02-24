import { assertEquals } from "@std/assert";
import { getRelativePath } from "../../../core/utils/path.ts";
		
Deno.test("getRelativePath", () => {
  assertEquals(getRelativePath("/data/foobar", "/data/foobar/asset.jpg"), "./asset.jpg");
  assertEquals(getRelativePath("/data/foobar/", "/data/foobar/asset.jpg"), "./asset.jpg");
  assertEquals(getRelativePath("/data/foobar", "/data/baz/asset.jpg"), "../baz/asset.jpg");
  assertEquals(getRelativePath("/data/foobar/", "/data/baz/asset.jpg"), "../baz/asset.jpg");
  assertEquals(getRelativePath("/data/foobar", "/data/foobar/.env"), "./.env");
  assertEquals(getRelativePath("/data/foobar/", "/data/foobar/.env"), "./.env");
  assertEquals(getRelativePath("/data/foobar", "/data/foobar/../foobar/file"), "./file");
});
