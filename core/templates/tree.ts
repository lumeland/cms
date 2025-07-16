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
    placeFile(tree, name, label.split("/"), name.split("/"));
  }

  return tree;
}

function placeFile(
  tree: Tree,
  name: string,
  labelParts: string[],
  nameParts: string[],
) {
  const labelPart = labelParts.shift()!;

  if (labelParts.length) {
    const namePart = nameParts.shift()!;
    tree.folders ??= new Map();
    const folder: Tree = tree.folders.get(labelPart) ?? {
      path: `${tree.path}${namePart}/`,
    };
    placeFile(folder, name, labelParts, nameParts);
    tree.folders.set(labelPart, folder);
    return;
  }

  tree.files ??= new Map();
  tree.files.set(labelPart, name);
}
