import process from "node:process";
import { spawnSync } from "node:child_process";

export function cwd() {
  return process.cwd();
}

/** Synchronously run a piped command and return [stdout, stderr] */
export function runPipedCommand(
  cmd: string,
  args: string[] = [],
  cwd?: string,
): [string | undefined, string | undefined] {
  const result = spawnSync(cmd, args, {
    cwd,
    shell: false,
    encoding: "utf-8",
  });

  if (result.error) {
    return [undefined, result.error.message.trim()];
  }

  if (result.status !== 0) {
    return [undefined, (result.stderr ?? "").trim()];
  }

  return [(result.stdout ?? "").trim(), undefined];
}
