import { describe, it, expect, TestContext } from "vitest";
import cms from "./cms.ts";
import type Memory from "../storage/memory.ts";

const router = cms.init();
const storage = cms.storages.get("src") as Memory;

describe("CMS test", async (t) => {
  it("Homepage", (t) => runTest(t, "/"));

  it("Document", async (t) => {
    await runTest(t, "/document/Homepage/edit");
    await runTest(t, "/document/Homepage/edit", {
      "root.title": "New title",
      "root.description": "New description",
      "root.content": "New content",
      "root.extra": "body { background: pink; }",
    });
    await runTest(t, "/document/Homepage/edit");
    expect(storage).toMatchSnapshot();
  });

  it("Collection", async (t) => {
    await runTest(t, "/collection/posts");
    await runTest(t, "/collection/posts/create");
    await runTest(t, "/collection/posts/create", {
      _id: "new-post.md",
      "root.title": "New title",
      "root.tags.0": "Tag 1",
      "root.tags.1": "Tag 2",
      "root.tags.2": "Tag 3",
      "root.so_data": "2026-06-21",
      "root.so_datatime": "2026-06-21T18:00",
      "root.color": "#332211",
      "root.cover.current": "/example.png",
      "root.image.title": "Image title",
      "root.image.image.uploaded": new File(["hello world"], "example2.txt", {
        type: "text/plain",
      }),
      "root.content": "post content",
    });
    await runTest(t, "/collection/posts/new-post.md/edit");
    expect(storage).toMatchSnapshot();
    await runTest(t, "/collection/posts/new-post.md/edit", {
      _id: "new-post.md",
      "root.title": "Title modified",
      "root.tags.0": "Tag 1",
      "root.tags.2": "Tag 3",
      "root.so_data": "2026-06-21",
      "root.so_datatime": "2026-06-21T18:00",
      "root.color": "#332211",
      "root.cover": "/example.png",
      "root.image.title": "Image title",
      "root.content": "post content",
    });
    await runTest(t, "/collection/posts/new-post.md/edit");
    expect(storage).toMatchSnapshot();
    await runTest(t, "/collection/posts");
  });

  it("Uploads", async (t) => {
    await runTest(t, "/uploads/my_uploads");
    await runTest(t, "/uploads/my_uploads/create");
    await runTest(t, "/uploads/my_uploads/create", {
      files: new File(["Other"], "example3.txt", { type: "text/plain" }),
    });
    expect(storage).toMatchSnapshot();
    await runTest(t, "/uploads/my_uploads");
    await runTest(t, "/uploads/my_uploads/example3.txt");
    await runTest(t, "/uploads/my_uploads/example3.txt/edit");
    await runTest(t, "/uploads/my_uploads/example3.txt/edit", {
      files: new File(["Modified"], "example3.txt", { type: "text/plain" }),
    });
    await runTest(t, "/uploads/my_uploads/example3.txt");
    await runTest(t, "/uploads/my_uploads/example3.txt/duplicate", {
      name: "example4.txt",
    });
    await runTest(t, "/uploads/my_uploads/example3.txt");
    await runTest(t, "/uploads/my_uploads/example4.txt");
    await runTest(t, "/uploads/my_uploads/example4.txt/move", {
      name: "example5.txt",
    });
    await runTest(t, "/uploads/my_uploads/example5.txt");
    await runTest(t, "/uploads/my_uploads/example5.txt/edit", {
      files: new File(["Edited"], "example3.txt", { type: "text/plain" }),
    });
    await runTest(t, "/uploads/my_uploads/example5.txt");
    await runTest(t, "/uploads/my_uploads/example5.txt/code");
    await runTest(t, "/uploads/my_uploads/example5.txt/delete", {});
    expect(storage).toMatchSnapshot();
  });
});

async function runTest(t: TestContext, url: string, data?: Record<string, string | Blob>) {
  let body: FormData | undefined;
  if (data) {
    body = new FormData();
    for (const [key, value] of Object.entries(data)) {
      body.set(key, value);
    }
  }

  const method = body ? "POST" : "GET";
  const request = new Request(`https://example.com${url}`, { method, body });
  const response = await router.fetch(request);

  if (response.status === 302) {
    return expect(response.headers.get("Location")).toMatchSnapshot();
  }

  if (response.status === 200) {
    return expect(await response.text()).toMatchSnapshot();
  }

  throw new Error(`Response ${response.status}`);
}
