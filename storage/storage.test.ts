import { Memory } from "./memory.ts";
import { Fs } from "./fs.ts";
import { S3 } from "./s3.ts";

import { S3Client } from "jsr:@bradenmacdonald/s3-lite-client@^0.9.4";
import { assertEquals, assertRejects, assertThrows } from "jsr:@std/assert@0.224.0";

import type { Storage } from "../types.ts";

interface StorageFactory {
  name: string;
  create: () => Promise<Storage> | Storage;
  /** Whether readText throws sync (Memory) or rejects async (Fs) */
  throwsSync: boolean;
}

const factories: StorageFactory[] = [
  {
    name: "Memory",
    create: () => new Memory(),
    throwsSync: true,
  },
  {
    name: "Fs",
    create: async () => {
      const dir = await Deno.makeTempDir({ prefix: "fs_storage_test_" });
      return new Fs({ root: dir });
    },
    throwsSync: false,
  },
  {
    name: "S3",
    create: async () => {
      const prefix = `test-${Date.now()}-${Math.random().toString(36).slice(2)}/`;
      const client = new S3Client({
        endPoint: "http://localhost:9000",
        region: "dev-region",
        bucket: "dev-bucket",
        accessKey: "AKIA_DEV",
        secretKey: "secretkey",
      });
      return new S3({ client, prefix });
    },
    throwsSync: false,
  },
];

for (const factory of factories) {
  Deno.test(`${factory.name}: writeText/readText`, async () => {
    const storage = await factory.create();
    const entry = storage.get("foo.json");
    await entry.writeText('{"a":1}');
    const text = await entry.readText();
    assertEquals(text, '{"a":1}');
  });

  Deno.test(`${factory.name}: writeData/readData`, async () => {
    const storage = await factory.create();
    const entry = storage.get("bar.json");
    await entry.writeData({ b: 2 });
    const data = await entry.readData();
    assertEquals(data, { b: 2 });
  });

  Deno.test(`${factory.name}: writeFile/readFile`, async () => {
    const storage = await factory.create();
    const entry = storage.get("baz.txt");
    const file = new File(["hello"], "baz.txt", { type: "text/plain" });
    await entry.writeFile(file);
    const readFile = await entry.readFile();
    assertEquals(await readFile.text(), "hello");
    assertEquals(readFile.name, "baz.txt");
  });

  Deno.test(`${factory.name}: delete`, async () => {
    const storage = await factory.create();
    const entry = storage.get("del.json");
    await entry.writeText("bye");
    await storage.delete("del.json");
    if (factory.throwsSync) {
      assertThrows(() => entry.readText());
    } else {
      await assertRejects(() => entry.readText());
    }
  });

  Deno.test(`${factory.name}: rename`, async () => {
    const storage = await factory.create();
    const entry = storage.get("old.json");
    await entry.writeText("rename");
    await storage.rename("old.json", "new.json");
    const newEntry = storage.get("new.json");
    assertEquals(await newEntry.readText(), "rename");
    if (factory.throwsSync) {
      assertThrows(() => entry.readText());
    } else {
      await assertRejects(() => entry.readText());
    }
  });

  Deno.test(`${factory.name}: directory`, async () => {
    const storage = await factory.create();
    const dir = storage.directory("subdir/");
    const entry = dir.get("file.json");
    await entry.writeText("dirfile");
    assertEquals(await entry.readText(), "dirfile");
    // Should be accessible from parent storage
    const parentEntry = storage.get("subdir/file.json");
    assertEquals(await parentEntry.readText(), "dirfile");
  });

  Deno.test(`${factory.name}: name() adds extension if needed`, async () => {
    // For Fs we need a temp dir, for Memory we don't
    const storage = factory.name === "Memory"
      ? new Memory({ path: "**/*.json" })
      : new Fs({ root: await Deno.makeTempDir(), path: "**/*.json" });
    const name = storage.name("test");
    assertEquals(name, "test.json");
  });

  Deno.test(`${factory.name}: async iterator yields entries`, async () => {
    const storage = await factory.create();
    await storage.get("a.json").writeText("1");
    await storage.get("b.json").writeText("2");
    const names = [];
    for await (const entry of storage) {
      names.push(entry.name);
    }
    names.sort();
    assertEquals(names, ["a.json", "b.json"]);
  });
}
