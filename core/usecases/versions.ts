import { Versioning } from "../../types.ts";

export function createVersion(versioning: Versioning, name: string) {
  versioning.create(name);
  versioning.change(name);
}

export function changeVersion(versioning: Versioning, name: string) {
  versioning.change(name);
}

export function publishVersion(versioning: Versioning, name: string) {
  versioning.publish(name);
}

export function deleteVersion(versioning: Versioning, name: string) {
  versioning.delete(name);
}
