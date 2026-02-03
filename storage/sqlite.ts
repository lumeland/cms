import type { Data, Entry, EntrySource, Storage } from "../types.ts";
import { DatabaseSync, type SQLOutputValue } from "node:sqlite";

export interface Options {
  db: DatabaseSync;
  tableName?: string;
}

/**
 * This storage allow to manage data from a SQLite database.
 */
export class Sqlite implements Storage {
  #db: DatabaseSync;
  #tableName?: string;
  #fieldName?: string;

  static create(path: string | DatabaseSync = ":memory:") {
    const db = typeof path === "string" ? new DatabaseSync(path) : path;
    return new Sqlite({ db });
  }

  constructor(options: Options) {
    this.#db = options.db;
    const match = options.tableName?.match(/^(\w+)\((\w+)\)?$/);

    if (match) {
      const [, tableName, fieldName] = match;
      this.#tableName = tableName;
      this.#fieldName = fieldName;
    } else {
      this.#tableName = options.tableName;
      this.#fieldName = "id";
    }
  }

  name(name?: string): string {
    if (!name) {
      const query = `SELECT max(id) as max_id FROM ${this.tableName}`;
      const result = this.#db.prepare(query).get();
      const maxId = (result?.max_id as number | undefined) ?? 0;
      return `${maxId + 1}`;
    }

    return name;
  }

  get tableName() {
    if (!this.#tableName) {
      throw new Error("Table name is not specified.");
    }
    return this.#tableName;
  }

  get fieldName() {
    if (!this.#fieldName) {
      throw new Error("Field name is not specified.");
    }
    return this.#fieldName;
  }

  get db() {
    return this.#db;
  }

  async *[Symbol.asyncIterator](): AsyncGenerator<EntrySource> {
    const query = `SELECT id, ${this.fieldName} FROM ${this.tableName}`;
    const stmt = this.#db.prepare(query);

    for (const row of stmt.iterate()) {
      yield this.source(`${row.id}_${row[this.fieldName]}`);
    }
  }

  source(name: string): EntrySource {
    const id = this.#getIdFromName(name);
    const path = `${this.tableName}/${id}`;

    return {
      name,
      path,
      src: path,
    };
  }

  #getIdFromName(name: string): string {
    const [id] = name.split("_");
    return id.trim();
  }

  directory(name: string): Storage {
    return new Sqlite({
      db: this.#db,
      tableName: name,
    });
  }

  get(name: string): Entry {
    return new SqliteEntry(this.source(name), this);
  }

  delete(name: string) {
    const id = this.#getIdFromName(name);
    const query = `DELETE FROM ${this.tableName} WHERE id = ?`;
    const stmt = this.#db.prepare(query);
    stmt.run(id);
  }

  rename(name: string, newName: string): void {
    const id = this.#getIdFromName(name);
    const newId = this.#getIdFromName(newName);
    const query = `UPDATE ${this.tableName} SET id = ? WHERE id = ?`;
    const stmt = this.#db.prepare(query);
    stmt.run(newId, id);
  }
}

export class SqliteEntry implements Entry {
  source: EntrySource;
  #storage: Sqlite;

  constructor(source: EntrySource, storage: Sqlite) {
    this.source = source;
    this.#storage = storage;
  }

  get storage(): Storage {
    return this.#storage;
  }

  #getTableAndId(): [string, string] {
    const { src } = this.source;
    const [table, id] = src.split("/");
    return [table.trim(), id.trim()];
  }

  readText(): string {
    const data = this.readData();
    return JSON.stringify(data, null, 2);
  }

  writeText(content: string): void {
    const data = JSON.parse(content) as Data;
    this.writeData(data);
  }

  readData(): Data {
    const [table, id] = this.#getTableAndId();
    const query = `SELECT * FROM ${table} WHERE id = ?`;
    const stmt = this.#storage.db.prepare(query);
    const row = stmt.get(id);
    if (!row) {
      throw new Error(`Item not found: ${this.source.path}`);
    }
    return Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key, unserialize(value)]),
    );
  }
  writeData(content: Data): void {
    const [table, id] = this.#getTableAndId();
    const keys = Object.keys(content).join(", ");
    const values = Object.values(content).map(serialize);
    const placeholders = values.map(() => "?").join(", ");

    const query =
      `INSERT OR REPLACE INTO ${table} (id, ${keys}) VALUES (?, ${placeholders})`;
    const stmt = this.#storage.db.prepare(query);
    stmt.run(id, ...values);
  }

  readFile(): Promise<File> {
    throw new Error("Binary files not allowed in Sqlite storage");
  }

  writeFile(): Promise<void> {
    throw new Error("Binary files not allowed in Sqlite storage");
  }
}

const objectConstructor = {}.constructor;

function serialize(value: unknown): SQLOutputValue {
  switch (typeof value) {
    case "string":
    case "number":
    case "bigint":
      return value;
    case "boolean":
      return value ? 1 : 0;
    default:
      if (value === null || value === undefined) {
        return null;
      }

      if (
        Array.isArray(value) ||
        (typeof value === "object" && value.constructor === objectConstructor)
      ) {
        return JSON.stringify(value);
      }

      return String(value);
  }
}

const MAYBE_JSON = /^[\[{"].*[\]}"]$/;

function unserialize(value: SQLOutputValue): unknown {
  if (typeof value !== "string" || !MAYBE_JSON.test(value)) {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
