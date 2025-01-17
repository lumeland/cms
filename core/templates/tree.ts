import type { EntryMetadata } from "../../types.ts";

export interface Tree {
  path: string;
  folders?: Map<string, Tree>;
  files?: Map<string, string>;
}

export default function createTree(files: EntryMetadata[]): Tree {
  const tree: Tree = {
    path: "",
  };

  for (const file of files) {
    const { label, name } = file;
    placeFile(tree, name, label.split("/"));
  }

  return tree;
}

function placeFile(tree: Tree, name: string, parts: string[]) {
  const part = parts.shift()!;

  if (parts.length) {
    tree.folders ??= new Map();
    const folder: Tree = tree.folders.get(part) ?? {
      path: `${tree.path}${part}/`,
    };
    placeFile(folder, name, parts);
    tree.folders.set(part, folder);
    return;
  }

  tree.files ??= new Map();
  tree.files.set(part, name);
}
