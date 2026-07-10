# Backend for Drop-CI/CD.
#
# Two runtime dependencies drive this image:
#   1. `git` — simple-git shells out to it to clone repos (not in node:20-slim).
#   2. The host Docker daemon — dockerode connects to /var/run/docker.sock to
#      run each build in a throwaway sibling container. Mount the socket at
#      runtime (see the note at the bottom of this file).
FROM node:20-slim

# git + CA certs are needed for cloning over HTTPS.
RUN apt-get update \
    && apt-get install -y --no-install-recommends git ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install deps first so this layer is cached unless the manifests change.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Application source.
COPY server.js ./
COPY src ./src

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

CMD ["node", "server.js"]

# Run with the host Docker socket mounted so this service can launch build
# containers, e.g.:
#
#   docker build -t drop-cicd-backend .
#   docker run --rm -p 4000:4000 \
#     -v /var/run/docker.sock:/var/run/docker.sock \
#     -e TMPDIR=/tmp/drop-cicd -v /tmp/drop-cicd:/tmp/drop-cicd \
#     drop-cicd-backend
#
# The TMPDIR bind mount matters: cloned repos are written to a temp dir and
# then bind-mounted into the sibling build container by the *host* daemon, so
# that path must resolve identically on the host and inside this container.
