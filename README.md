# Drop-CI/CD

Milestone 1 scaffold: paste a repo URL in the dashboard, the backend clones it
and runs `npm install` (+ `npm run build` if present) inside an isolated
Docker container, then returns the logs.

## Requirements

- Node.js 20+
- Docker installed and running (the backend talks to the local Docker daemon
  via its default socket). On Linux, make sure your user is in the `docker`
  group so it can access `/var/run/docker.sock` without `sudo`.

## Run it

**Backend** (in one terminal):

```
cd backend
npm install
npm run dev
```

Runs on http://localhost:4000. Health check: `GET /api/health`.

**Frontend** (in another terminal):

```
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Runs on http://localhost:3000.

Open the dashboard, paste a small public repo URL (e.g.
`https://github.com/octocat/Hello-World.git` won't have a package.json, so
try a small real Node project), and hit "Run Build".

## Notes

- This box needs a working Docker daemon — it won't work in an environment
  without Docker installed (e.g. most plain sandboxes). Test it on your own
  machine or the remote server once Docker's set up there.
- No queue yet, no auth yet, no persistence yet — this is deliberately just
  milestone 1 from the spec (`minici-spec.md`). Next steps: live log
  streaming (Socket.io), then GitHub OAuth + webhooks.
