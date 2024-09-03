export interface Tree {
  path: string;
  folders?: Map<string, Tree>;
  files?: Map<string, string>;
}

interface File {
  name: string;
}

export default function createTree(files: File[]): Tree {
  const tree: Tree = {
    path: "",
  };

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
    const folder: Tree = tree.folders.get(name) ?? {
      path: `${tree.path}${name}/`,
    };
    placeFile(folder, path, parts);
    tree.folders.set(name, folder);
    return;
  }

  tree.files ??= new Map();
  tree.files.set(name, path);
}
