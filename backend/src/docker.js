import Docker from "dockerode";
import fs from "node:fs";
import path from "node:path";

// Connects to the local Docker daemon over its default socket.
// On Linux/macOS this is /var/run/docker.sock (make sure the user
// running this process has permission to access it, e.g. is in the
// `docker` group).
const docker = new Docker();

const DEFAULT_IMAGE = "node:20-slim";
const BUILD_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes safety timeout
const MEMORY_LIMIT_BYTES = 512 * 1024 * 1024; // 512MB cap per build

/**
 * Runs `npm install` (and `npm run build` if present) for the project at
 * `hostRepoPath` inside an isolated, throwaway Docker container.
 *
 * Returns { success, exitCode, logs } where logs is the combined
 * stdout/stderr captured from the container.
 */
export async function runBuildInContainer(hostRepoPath, { image = DEFAULT_IMAGE, onLog } = {}) {
  const hasPackageJson = fs.existsSync(path.join(hostRepoPath, "package.json"));
  if (!hasPackageJson) {
    return {
      success: false,
      exitCode: null,
      logs: "No package.json found at the root of this repo — nothing to build.\n",
    };
  }

  const pkg = JSON.parse(fs.readFileSync(path.join(hostRepoPath, "package.json"), "utf-8"));
  const hasBuildScript = Boolean(pkg.scripts && pkg.scripts.build);
  const command = hasBuildScript
    ? "npm install && npm run build"
    : "npm install";

  // Make sure we have the base image before creating the container.
  await pullImageIfNeeded(image, onLog);

  const container = await docker.createContainer({
    Image: image,
    Cmd: ["sh", "-c", command],
    WorkingDir: "/workspace",
    Tty: false,
    HostConfig: {
      Binds: [`${hostRepoPath}:/workspace`],
      Memory: MEMORY_LIMIT_BYTES,
      NanoCpus: 1_000_000_000, // 1 CPU
      NetworkMode: "bridge",
      AutoRemove: false, // we remove manually after reading logs
      Privileged: false,
    },
  });

  let logs = "";
  let timedOut = false;

  const timeout = setTimeout(async () => {
    timedOut = true;
    try {
      await container.kill();
    } catch {
      // container may have already exited; ignore
    }
  }, BUILD_TIMEOUT_MS);

  try {
    await container.start();

    const stream = await container.logs({
      follow: true,
      stdout: true,
      stderr: true,
    });

    await new Promise((resolve, reject) => {
      stream.on("data", (chunk) => {
        // Docker multiplexes stdout/stderr with an 8-byte header per frame;
        // stripping the first 8 bytes of each chunk keeps the demo simple.
        const text = chunk.length > 8 ? chunk.subarray(8).toString("utf-8") : chunk.toString("utf-8");
        logs += text;
        if (onLog) onLog(text);
      });
      stream.on("end", resolve);
      stream.on("error", reject);
    });

    const { StatusCode } = await container.wait();
    clearTimeout(timeout);

    if (timedOut) {
      logs += "\n[minici] Build timed out and was killed.\n";
    }

    return {
      success: StatusCode === 0 && !timedOut,
      exitCode: StatusCode,
      logs,
    };
  } finally {
    clearTimeout(timeout);
    try {
      await container.remove({ force: true });
    } catch {
      // already removed; ignore
    }
  }
}

async function pullImageIfNeeded(image, onLog) {
  const images = await docker.listImages();
  const alreadyPulled = images.some((img) => (img.RepoTags || []).includes(image));
  if (alreadyPulled) return;

  if (onLog) onLog(`[minici] Pulling image ${image}...\n`);

  await new Promise((resolve, reject) => {
    docker.pull(image, (err, stream) => {
      if (err) return reject(err);
      docker.modem.followProgress(stream, (err) => (err ? reject(err) : resolve()));
    });
  });
}
