export interface Tree {
  folders?: Map<string, Tree>;
  files?: Map<string, string>;
}

interface File {
  name: string;
}

export default function createTree(files: File[]): Tree {
  const tree: Tree = {};

  for (const file of files) {
    const { name } = file;
    placeFile(tree, name, name.split("/"));
  }

  return tree;
}

function placeFile(tree: Tree, path: string, parts: string[]) {
  const name = parts.shift()!;

  if (parts.length) {
    tree.folders ??= new Map();
    const folder: Tree = tree.folders.get(name) ?? {};
    placeFile(folder, path, parts);
    tree.folders.set(name, folder);
    return;
  }

  tree.files ??= new Map();
  tree.files.set(name, path);
}
