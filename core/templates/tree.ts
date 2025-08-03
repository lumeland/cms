import type { EntryMetadata } from "../../types.ts";

export interface Tree {
  path: string;
  folders?: Map<string, Tree>;
  files?: Map<string, EntryMetadata>;
}

export default function createTree(files: EntryMetadata[]): Tree {
  const tree: Tree = {
    path: "",
  };

  for (const metadata of files) {
    const { label, name } = metadata;
    placeFile(tree, metadata, label.split("/"), name.split("/"));
  }
  return tree;
}

function placeFile(
  tree: Tree,
  metadata: EntryMetadata,
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
    placeFile(folder, metadata, labelParts, nameParts);
    tree.folders.set(labelPart, folder);
    return;
  }

  tree.files ??= new Map();
  tree.files.set(labelPart, metadata);
}
