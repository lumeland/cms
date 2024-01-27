import { getPath, normalizePath } from "../../../utils/path.ts";
import { EntryMetadata } from "../../../types.ts";

interface Props {
  collection: string;
  publicPath: string;
  files: EntryMetadata[];
}

export default function Template({ collection, publicPath, files }: Props) {
  const tree = createTree(files);

  return (
    <>
      <nav aria-label="You are here:">
        <ul class="breadcrumb">
          <li>
            <a href={getPath()}>Home</a>
          </li>
          <li>
            <a>{collection}</a>
          </li>
        </ul>
      </nav>

      <header class="header">
        <h1 class="header-title">Content of {collection}</h1>
        <u-filter
          class="header-filter"
          data-placeholder={`Search files in ${collection}`}
          data-selector="#list li"
        >
        </u-filter>
      </header>

      <ul id="list" class="list">
        <Folder collection={collection} tree={tree} publicPath={publicPath} />
      </ul>

      <form
        method="post"
        class="footer ly-rowStack is-responsive"
        enctype="multipart/form-data"
        action={getPath("uploads", collection, "create")}
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

interface FolderProps {
  collection: string;
  publicPath: string;
  tree: Tree;
}

function Folder({ collection, publicPath, tree }: FolderProps) {
  return (
    <>
      {Array.from(tree.folders?.entries() || []).map(([name, subTree]) => (
        <li>
          <details open class="accordion">
            <summary>{name}</summary>
            <ul>
              <Folder
                collection={collection}
                publicPath={publicPath}
                tree={subTree}
              />
            </ul>
          </details>
        </li>
      ))}
      <Files
        collection={collection}
        publicPath={publicPath}
        files={tree.files}
      />
    </>
  );
}

interface FilesProps {
  collection: string;
  publicPath: string;
  files?: Map<string, string>;
}

function Files(
  { collection, files, publicPath }: FilesProps,
) {
  if (!files) {
    return null;
  }

  return (
    <>
      {Array.from(files.entries()).map(([name, file]) => (
        <li>
          <a
            href={getPath("uploads", collection, "file", file)}
            class="list-item"
          >
            <u-icon-file path={file}></u-icon-file>
            {name}
          </a>
          <u-popover>
            <button class="buttonIcon" type="button">
              <u-icon name="eye" />
            </button>
            <template>
              <u-preview
                id={`preview_${file}`}
                data-src={getPath("uploads", collection, "raw", file)}
              >
              </u-preview>
            </template>
          </u-popover>
          <u-copy text={normalizePath(publicPath, file)}></u-copy>
        </li>
      ))}
    </>
  );
}

interface Tree {
  folders?: Map<string, Tree>;
  files?: Map<string, string>;
}

function createTree(files: EntryMetadata[]): Tree {
  const tree: Tree = {};

  for (const file of files) {
    const { id } = file;
    placeFile(tree, id, id.split("/"));
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
