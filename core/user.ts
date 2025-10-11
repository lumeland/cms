import Collection from "./collection.ts";
import Document from "./document.ts";
import Upload from "./upload.ts";

import type { Permissions, UserConfiguration } from "../types.ts";

type Subject = Collection | Document | Upload;

export default class User {
  name?: string;
  email?: string;
  permissions: Record<string, Permissions> = {};

  get isLogged(): boolean {
    return !!this.name;
  }

  authenticate(
    users: Record<string, string | UserConfiguration>,
    header: string | null,
  ): boolean {
    const match = header?.match(/^Basic\s+(.*)$/);
    if (match) {
      const [user, pw] = atob(match[1]).split(":");

      for (const [name, config] of Object.entries(users)) {
        const password = typeof config === "string" ? config : config.password;
        if (user === name && pw == password) {
          // Save user data and permissions
          if (typeof config === "string") {
            this.name = name;
          } else {
            this.name = config.name ?? name;
            this.email = config.email;
            this.permissions = config.permissions ?? {};
          }
          return true;
        }
      }
    }
    return false;
  }

  canCreate(subject: Subject): boolean {
    // Document has no create permission. Use edit instead.
    if (subject instanceof Document) {
      return this.#getUserPermission(subject)?.edit ?? subject.permissions.edit;
    }

    return this.#getUserPermission(subject)?.create ??
      subject.permissions.create;
  }

  canDelete(subject: Subject): boolean {
    // Documents can't be deleted
    if (subject instanceof Document) {
      return false;
    }

    return this.#getUserPermission(subject)?.delete ??
      subject.permissions.delete;
  }

  canEdit(subject: Subject): boolean {
    return this.#getUserPermission(subject)?.edit ?? subject.permissions.edit;
  }

  canRename(subject: Subject): boolean {
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
