import { fromFilename } from "./storage/transformers/mod.ts";
import { posix } from "./deps/std.ts";

interface Folder {
  name?: string;
  path: string;
  files: Set<string>;
  folders: Map<string, Folder>;
}

const availableExtensions = [
  ".json",
  ".yaml",
  ".yml",
  ".md",
];

interface CMSConfig {
  collections: Lume.CMS.CollectionOptions[];
}

export default async function generateConfig(root: string, sources: string[]) {
  // Filter sources to only include those with valid extensions
  sources = sources.filter((src) =>
    availableExtensions.some((ext) => src.endsWith(ext))
  );

  const tree = generateTree(sources);
  const config: CMSConfig = {
    collections: [],
  };

  for (const folder of tree.folders.values()) {
    const collection = await createCollection(root, folder);
    if (collection) {
      config.collections.push(collection);
    }
  }

  return config;
}

function generateTree(sources: string[]): Folder {
  const root: Folder = { path: "/", files: new Set(), folders: new Map() };

  for (const source of sources) {
    let folder = root;

    const directories = source.split("/");
    const file = directories.pop(); // Get the last part as the file name

    for (const directory of directories) {
      if (!directory) continue;
      const subfolder = folder.folders.get(directory) ?? {
        name: directory,
        path: posix.join(folder.path, directory),
        files: new Set(),
        folders: new Map(),
      };
      folder.folders.set(directory, subfolder);
      folder = subfolder;
    }

    if (file) {
      folder.files.add(file);
    }
  }

  return root;
}

async function createCollection(
  root: string,
  folder: Folder,
): Promise<Lume.CMS.CollectionOptions | undefined> {
  const { name, files, folders } = folder;
  // A folder is considered a collection if it's not root, it has files and no subfolders
  if (!name || !files.size || folders.size) {
    return;
  }

  // Get the most common file extension in the folder
  const extensions = new Map<string, number>();
  let ext = "";

  for (const file of files) {
    const fileExt = posix.extname(file);
    let count = extensions.get(fileExt) ?? 0;
    count++;
    extensions.set(fileExt, count);
    if (!ext || count > (extensions.get(ext) ?? 0)) {
      ext = fileExt;
    }
  }

  const fields: Lume.CMS.Field[] = [];

  for (const file of files) {
    if (!file.endsWith(ext)) {
      continue;
    }
    await addFields(posix.join(root, folder.path, file), fields);
  }

  const store = `src:${folder.path}/*${ext}`;

  return {
    name,
    store,
    fields,
  };
}

async function addFields(
  path: string,
  fields: Lume.CMS.Field[],
): Promise<void> {
  const data = await loadFile(path);

  for (const [key, value] of Object.entries(data)) {
    const field = getField(key, value);
    if (!field) continue;

    if (typeof field === "string" && !fields.includes(field)) {
      fields.push(field);
      continue;
    }
    if (
      typeof field === "object" &&
      !fields.some((f) => typeof f === "object" && f.name === field.name)
    ) {
      fields.push(field);
    }
  }
}

async function loadFile(path: string): Promise<Record<string, unknown>> {
  const transformer = fromFilename(path);
  const content = await Deno.readTextFile(path);
  return content ? await transformer.toData(content) : {};
}

function getField(name: string, value: unknown): Lume.CMS.Field | undefined {
  if (typeof value === "string") {
    if (name === "content") {
      return `${name}: markdown`;
    }
    return `${name}: text`;
  }

  if (typeof value === "number") {
    return `${name}: number`;
  }

  if (typeof value === "boolean") {
    return `${name}: checkbox`;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return; // Unknown type for empty array
    }
    if (typeof value[0] === "string") {
      return `${name}: list`;
    }
    if (typeof value[0] === "object") {
      const fields = Object.entries(value[0])
        .map(([key, val]) => getField(key, val))
        .filter((f) => f !== undefined) as Lume.CMS.Field[];

      return {
        name,
        type: "object-list",
        fields,
      };
    }

    return undefined; // Unknown type for array of objects
  }

  if (typeof value === "object" && value !== null) {
    const fields = Object.entries(value)
      .map(([key, val]) => getField(key, val))
      .filter((f) => f !== undefined) as Lume.CMS.Field[];
    return {
      name,
      type: "object",
      fields,
    };
  }

  return `${name}: text`;
}
