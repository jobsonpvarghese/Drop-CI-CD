import { simpleGit } from "simple-git";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";

/**
 * Shallow-clones `repoUrl` into a fresh temp directory and returns the path.
 * Caller is responsible for cleaning it up with cleanupRepo().
 */
export async function cloneRepo(repoUrl) {
  const id = crypto.randomBytes(6).toString("hex");
  const targetDir = path.join(os.tmpdir(), `minici-${id}`);
  fs.mkdirSync(targetDir, { recursive: true });

  const git = simpleGit();
  await git.clone(repoUrl, targetDir, ["--depth", "1"]);

  return targetDir;
}

export function cleanupRepo(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
}
