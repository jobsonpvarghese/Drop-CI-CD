import "dotenv/config"
import express from "express"
import cors from "cors"
import { cloneRepo, cleanupRepo } from "./src/clone.js"
import { runBuildInContainer } from "./src/docker.js"
import { exchangeCodeForToken, getGithubUser } from "./src/github.js"

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())
app.use(express.json())

app.get("/api/health", (req, res) => {
  res.json({ ok: true })
  console.log("Health check OK")
})

// Milestone 1: manual trigger, no queue.
// POST { repoUrl: "https://github.com/user/repo.git" }
// Clones the repo, runs npm install (+ build if present) inside an
// isolated Docker container, and returns the full logs once it finishes.
app.post("/api/build", async (req, res) => {
  const { repoUrl } = req.body || {}

  if (!repoUrl || typeof repoUrl !== "string") {
    return res.status(400).json({ error: "repoUrl is required" })
  }

  let repoPath
  try {
    repoPath = await cloneRepo(repoUrl)
  } catch (err) {
    return res.status(400).json({ error: `Failed to clone repo: ${err.message}` })
  }

  try {
    const result = await runBuildInContainer(repoPath)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: `Build failed: ${err.message}` })
  } finally {
    cleanupRepo(repoPath)
  }
})

// GitHub OAuth: the frontend redirects the user to GitHub, GitHub redirects
// back to the frontend /auth/callback with a `code`, and the frontend posts
// that code here. We swap it for an access token (using the client secret,
// which must never touch the browser) and return the token + basic profile.
app.post("/api/auth/github/callback", async (req, res) => {
  const { code } = req.body || {}

  if (!code || typeof code !== "string") {
    return res.status(400).json({ error: "code is required" })
  }

  try {
    const token = await exchangeCodeForToken(code)
    const user = await getGithubUser(token)
    res.json({
      token,
      user: { login: user.login, name: user.name, avatarUrl: user.avatar_url },
    })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.listen(PORT, () => {
  console.log(`minici backend listening on http://localhost:${PORT}`)
  console.log(`Requires a Docker daemon reachable at the default socket.`)
})
