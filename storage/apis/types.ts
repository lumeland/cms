export interface GitEntry {
  name: string;
  path: string;
  type: "file" | "dir";
}

export type CommitMessage = (options: CommitMessageOptions) => string;

export interface CommitMessageOptions {
  action: "create" | "update" | "delete";
  path: string;
}

export interface GitAPI {
  /** List the files of a directory. */
  listFiles: (path?: string, depth?: number) => AsyncGenerator<GitEntry>;

  /**
   * Get the content of a file as text.
   * Returns `undefined` if the file does not exist.
   */
  getTextContent: (path?: string) => Promise<string | undefined>;

  /**
   * Get the binary content of a file.
   * Returns `undefined` if the file does not exist.
   */
  getBinaryContent: (
    path?: string,
  ) => Promise<Uint8Array<ArrayBuffer> | undefined>;

  /**
   * Edit the content of a file
   * Creates the file if it does not exist.
   */
  setContent: (
    path: string,
    content: ArrayBuffer | Uint8Array | string,
  ) => Promise<void>;

  /**
   * Delete a file
   * Throws an error if the file does not exist.
   */
  deleteFile: (path: string) => Promise<void>;

  /**
   * Rename a file
   * Throws an error if the file does not exist.
   */
  rename: (path: string, newPath: string) => Promise<void>;

  /** Get the URL to view the file in the web interface. */
  getFileUrl: (path: string) => string;
}
