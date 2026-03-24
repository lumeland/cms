import Collection from "./collection.ts";
import Document from "./document.ts";
import Upload from "./upload.ts";

import type { Permissions, UserConfiguration } from "../types.ts";

type Subject = Collection | Document | Upload;

export default class User {
  name?: string;
  email?: string;
  permissions: Record<string, Permissions> = {};
  language?: string;

  get isLogged(): boolean {
    return !!this.name;
  }

  constructor(name?: string, config?: UserConfiguration) {
    this.name = config?.name ?? name;
    this.email = config?.email;
    this.permissions = config?.permissions ?? {};
    this.language = config?.language;
  }

  // TO-DO: Implement view permissions
  canView(_subject: Subject): boolean {
    return true;
  }

  canCreate(subject: Subject): boolean {
    if (!this.canView(subject)) {
      return false;
    }

    // Document has no create permission. Use edit instead.
    if (subject instanceof Document) {
      return this.#getUserPermission(subject)?.edit ?? subject.permissions.edit;
    }

    return this.#getUserPermission(subject)?.create ??
      subject.permissions.create;
  }

  canDelete(subject: Subject): boolean {
    if (!this.canView(subject)) {
      return false;
    }

    // Documents can't be deleted
    if (subject instanceof Document) {
      return false;
    }

    return this.#getUserPermission(subject)?.delete ??
      subject.permissions.delete;
  }

  canEdit(subject: Subject): boolean {
    if (!this.canView(subject)) {
      return false;
    }

    return this.#getUserPermission(subject)?.edit ?? subject.permissions.edit;
  }

  canRename(subject: Subject): boolean {
    if (!this.canView(subject)) {
      return false;
    }

    // Documents can't be renamed
    if (subject instanceof Document) {
      return false;
    }

    // Collections have the "auto" feature so we need to check rename === true
    return this.#getUserPermission(subject)?.rename ??
      subject.permissions.rename === true;
  }

  #getUserPermission(subject: Subject): Permissions | undefined {
    for (const [name, permissions] of Object.entries(this.permissions)) {
      if (name === subject.name) {
        return permissions;
      }
    }
  }
}
