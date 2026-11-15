# Deploying Groxy AI `v1.0.0` (Hardened `--read-only` Docker & 4-Layer Stack Guide)

This directory contains the production-hardened container deployment template for **Groxy AI `v1.0.0`**, built cleanly on **GRAB `v1.1.0`**, **Grex JS `v1.0.0`**, **GrabLab CMS `v1.0.1`**, and **Grex Theme Builder `v1.0.0`**.

> **Zero-Secrets Git Policy:** Never commit real server IP addresses, private domains, database passwords, MCP bearer tokens, or `GRABLAB_MASTER_KEY` literals to Git. Supply all runtime secrets via an untracked `.env` file or your container secret manager.

---

## 1. Architecture of the `--read-only` Isolation Profile

All services in [`docker-compose.yml`](docker-compose.yml) run with an immutable root filesystem (`read_only: true`, equivalent to `docker run --read-only`), drop all Linux capabilities (`cap_drop: ["ALL"]`), block privilege escalation (`no-new-privileges:true`), mount `/tmp` with `noexec,nosuid`, bind host ports exclusively to `127.0.0.1` for reverse-proxy TLS termination (Caddy/Nginx), and scope writable paths strictly to runtime `storage/` and `cache/` mounts:

| Host Path | Container Path | Access | Purpose |
|---|---|---|---|
| `../storage` | `/app/storage` | `rw` | Persists `SITE-CONTEXT.md` background snapshots (`--allow-write /app/storage`) |
| `../cache` | `/app/cache` | `rw` | Runtime scratch/cache mount (`--allow-write /app/cache`) |
| Container image | `/app/src`, `/app/views`, `/app/public`, `/app/assets`, `/app/playbook`, `/app/grab.platform.json` | `ro` (immutable rootfs) | Verified `.grab`, `.grab.html`, Grex JS runtime, and frozen 22-rule SEO playbook |

### Minimal GRAB `v1.1.0` Capability Flags
- `--allow-read /app`
- `--allow-write /app/storage --allow-write /app/cache`
- `--platform-config /app/grab.platform.json --allow-cache groxy:read-write`
- `--allow-env GROXY_STORAGE_DIR,GROXY_SITE_CONTEXT_PATH,GROXY_CMS_URL,GROXY_BUILDER_URL`
- `--allow-net ${GROXY_ALLOW_NET:-grablab-cms:8080,grex-builder-studio:8080}` (default-deny outside explicit allowlisted upstream hosts per `GRAB-E402`)

---

## 2. Two Hosting Modes

### Mode A: Standalone Groxy AI (`groxy-ai`)
Runs `src/groxy.grab` behind a local TLS reverse proxy and connects to existing GrabLab CMS and Grex Theme Builder endpoints configured via `GROXY_CMS_URL`, `GROXY_BUILDER_URL`, and `GROXY_ALLOW_NET`.

```sh
docker compose -f deploy/docker-compose.yml up -d
```

### Mode B: Integrated 4-Layer Ecosystem Stack (`--profile ecosystem-stack`)
Launches **Groxy AI `v1.0.0`**, **GrabLab CMS `v1.0.1`**, and **Grex Theme Builder `v1.0.0`** together on an isolated Compose network with `--read-only` root filesystems across every service.

```sh
docker compose -f deploy/docker-compose.yml --profile ecosystem-stack up -d
```

---

## 3. Environment Setup (Untracked `.env`)

Create an untracked `.env` file alongside [`docker-compose.yml`](docker-compose.yml):

```env
# Standalone Groxy AI
GROXY_IMAGE=groxy-ai:v1.0.0
GROXY_PORT=8090
GROXY_TRUSTED_PROXY=127.0.0.1
GROXY_ALLOW_NET=grablab-cms:8080,grex-builder-studio:8080
GROXY_CMS_URL=http://grablab-cms:8080
GROXY_BUILDER_URL=http://grex-builder-studio:8080

# Required only when using `--profile ecosystem-stack`
GRABLAB_IMAGE=grablab-cms:v1.0.1
GRABLAB_PORT=8080
GRABLAB_MASTER_KEY=replace-with-32-plus-random-bytes-at-runtime
GRABLAB_MAX_UPLOAD_BYTES=10485760
GRABLAB_TRUSTED_PROXY=127.0.0.1
GREX_BUILDER_IMAGE=grex-builder-studio:v1.0.0
GREX_STUDIO_PORT=8081
GREX_TRUSTED_PROXY=127.0.0.1
```

---

## 4. Direct `docker run --read-only` Reference (Standalone)

```sh
docker run --rm -d \
  --name groxy-ai \
  --read-only \
  --cap-drop=ALL \
  --security-opt=no-new-privileges:true \
  --tmpfs /tmp:rw,noexec,nosuid,size=64m \
  -p 127.0.0.1:8090:8090 \
  -v "$(pwd)/storage:/app/storage:rw" \
  -v "$(pwd)/cache:/app/cache:rw" \
  -e GROXY_STORAGE_DIR="/app/storage" \
  -e GROXY_SITE_CONTEXT_PATH="/app/storage/SITE-CONTEXT.md" \
  -e GROXY_CMS_URL="http://grablab-cms:8080" \
  -e GROXY_BUILDER_URL="http://grex-builder-studio:8080" \
  groxy-ai:v1.0.0 \
  grab serve \
    --addr 0.0.0.0:8090 \
    --allow-public \
    --allow-scripts \
    --diagnostics production \
    --log-format json \
    --trusted-proxy 127.0.0.1 \
    --allow-read /app \
    --allow-write /app/storage \
    --allow-write /app/cache \
    --allow-env GROXY_STORAGE_DIR,GROXY_SITE_CONTEXT_PATH,GROXY_CMS_URL,GROXY_BUILDER_URL \
    --platform-config /app/grab.platform.json \
    --allow-cache groxy:read-write \
    --allow-net grablab-cms:8080,grex-builder-studio:8080 \
    --static /app/public \
    /app/src/groxy.grab
```

---

## 5. Health & Readiness Verification

- **Liveness:** `GET /_health` -> `200 OK` (`{"status":"ok"}` via Grisp supervisor)
- **Readiness:** `GET /_ready` -> `200 OK` (`{"status":"ready",...}` via Grisp supervisor)
- **Service Identity & Playbook:** `GET /api/groxy/playbook` -> `200 OK` (`"service_version":"1.0.0"`, `"playbook_version":"1.0.0"`, `22` rules)
