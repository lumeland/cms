import { getUrl } from "../../../utils/string.ts";

interface Props {
  collection: string;
  files: string[];
}

export default function Template({ collection, files }: Props) {
  const tree = createTree(files);

  return (
    <>
      <header class="header">
        <nav class="header-nav">
          <a href="/" class="button is-link">
            <u-icon name="arrow-left"></u-icon>
            Back
          </a>
        </nav>
        <h1 class="header-title">Content of {collection}</h1>
        <u-filter
          class="header-filter"
          data-placeholder={`Search files in ${collection}`}
          data-selector="#list li"
        >
        </u-filter>
      </header>

      <ul id="list" class="list">
        <Folder collection={collection} tree={tree} />
      </ul>

      <form
        method="post"
        class="footer ly-rowStack"
        enctype="multipart/form-data"
        action={getUrl("uploads", collection, "create")}
      >
        <input
          aria-label="Add file"
          id="new-file"
          type="file"
          name="file"
          required
          class="inputFile"
        />
        <button class="button is-primary" type="submit">
          <u-icon name="upload-simple" />
          Upload file
        </button>
      </form>
    </>
  );
}

function Folder({ collection, tree }: { collection: string; tree: Tree }) {
  return (
    <>
      {Array.from(tree.folders?.entries() || []).map(([name, subTree]) => (
        <li>
          <details open class="accordion">
            <summary>{name}</summary>
            <ul>
              <Folder collection={collection} tree={subTree} />
            </ul>
          </details>
        </li>
      ))}
      <Files collection={collection} files={tree.files} />
    </>
  );
}

function Files(
  { collection, files }: { collection: string; files?: Map<string, string> },
) {
  if (!files) {
    return null;
  }

  return (
    <>
      {Array.from(files.entries()).map(([name, path]) => (
        <li>
          <a
            href={getUrl("uploads", collection, "file", path)}
            class="list-item"
          >
            <u-icon name="image-square-fill"></u-icon>
            {name}
          </a>
        </li>
      ))}
    </>
  );
}

interface Tree {
  folders?: Map<string, Tree>;
  files?: Map<string, string>;
}

function createTree(files: string[]): Tree {
  const tree: Tree = {};

  for (const file of files) {
    placeFile(tree, file, file.split("/"));
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
