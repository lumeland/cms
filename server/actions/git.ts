import { Git, type Options } from "../../core/git.ts";

interface Action {
  action: "create" | "change" | "publish" | "delete";
  name: string;
}

export async function handleForm(form: FormData, userOptions: Options = {}) {
  const action = form.get("action") as Action["action"];
  const name = form.get("name") as string;

  await handle({ action, name }, userOptions);
}

async function handle(actionData: Action, userOptions: Options = {}) {
  const git = new Git(userOptions);
  const { action, name } = actionData;

  if (action === "create") {
    await git.create(name);
    await git.change(name);
    return;
  }

  if (action === "change") {
    await git.change(name);
    return;
  }

  if (action === "publish") {
    await git.publish(name);
    return;
  }

  if (action === "delete") {
    await git.delete(name);
    return;
  }
}
