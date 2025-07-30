import Collection from "./collection.ts";
import Document from "./document.ts";
import Upload from "./upload.ts";

type Subject = Collection | Document | Upload;

export default class User {
  name?: string;

  get isLogged(): boolean {
    return !!this.name;
  }

  canCreate(subject: Subject): boolean {
    // Document has no create permission. Use edit instead.
    if (subject instanceof Document) {
      return subject.permissions.edit;
    }

    return subject.permissions.create;
  }

  canDelete(subject: Subject): boolean {
    // Documents can't be deleted
    if (subject instanceof Document) {
      return false;
    }

    return subject.permissions.delete;
  }

  canEdit(subject: Subject): boolean {
    return subject.permissions.edit;
  }

  canRename(subject: Subject): boolean {
    // Collections have the "auto" feature
    if (subject instanceof Collection) {
      return subject.permissions.rename === true;
    }

    // Documents can't be renamed
    if (subject instanceof Document) {
      return false;
    }

    return subject.permissions.rename;
  }
}
