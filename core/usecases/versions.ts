import type Git from "../git.ts";
import type User from "../user.ts";

export function createVersion(user: User, git: Git, name: string) {
  git.create(name);
  git.change(user, name);
}

export function changeVersion(user: User, git: Git, name: string) {
  git.change(user, name);
}

export function syncVersion(user: User, git: Git, name: string) {
  if (git.current().name !== name) {
    throw new Error("The current version doesn't match");
  }
  git.sync(user);
}

export function updateVersion(git: Git, name: string) {
  if (git.current().name !== name) {
    throw new Error("The current version doesn't match");
  }
  git.update();
}

export function publishVersion(user: User, git: Git, name: string) {
  git.publish(user, name);
}

export function deleteVersion(user: User, git: Git, name: string) {
  git.delete(user, name);
}
