import express from "express";
import cors from "cors";
import { cloneRepo, cleanupRepo } from "./src/clone.js";
import { runBuildInContainer } from "./src/docker.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

// Milestone 1: manual trigger, no queue.
// POST { repoUrl: "https://github.com/user/repo.git" }
// Clones the repo, runs npm install (+ build if present) inside an
// isolated Docker container, and returns the full logs once it finishes.
app.post("/api/build", async (req, res) => {
  const { repoUrl } = req.body || {};

  if (!repoUrl || typeof repoUrl !== "string") {
    return res.status(400).json({ error: "repoUrl is required" });
  }

  let repoPath;
  try {
    repoPath = await cloneRepo(repoUrl);
  } catch (err) {
    return res.status(400).json({ error: `Failed to clone repo: ${err.message}` });
  }

  try {
    const result = await runBuildInContainer(repoPath);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: `Build failed: ${err.message}` });
  } finally {
    cleanupRepo(repoPath);
  }
});

app.listen(PORT, () => {
  console.log(`minici backend listening on http://localhost:${PORT}`);
  console.log(`Requires a Docker daemon reachable at the default socket.`);
});
