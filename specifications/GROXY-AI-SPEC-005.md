# GROXY-AI-SPEC-005: Groxy AI `v1.0.0` Production Release, Hardened `--read-only` Container Packaging, SemVer `v1.x` Freeze & Full 5-Layer Ecosystem E2E Verification

- **Status:** Approved & Frozen — Complete
- **Milestone:** `v1.0.0` — Production Release, Hardened `--read-only` Container Packaging, SemVer `v1.x` Contract Freeze & Full 5-Layer Ecosystem E2E Verification
- **Foundational Upstream Baselines (Frozen `v1.x` Contracts):**
  - **GRAB:** `v1.1.0` (`urbanspress/grab` — `grab serve --allow-scripts`, `grab check`, `grab format <file>`, `grab mcp`, `use server`, `use http`, `use json`, `use data`, `use cache`, `use crypto`, `use env`, `server.asset`, `GRAB-E401`, `GRAB-E402`)
  - **Grex JS:** `v1.0.0` (`urbanspress/grex-js` — `grex.elements.json`, `validateElementNode()`, `auditAccessibility()`, reactive signals, semantic elements, zero wrapper-`<div>` DOM)
  - **GrabLab CMS:** `v1.0.1` (`urbanspress/grablab-cms`, `GRABLAB-SPEC-100.md` — `POST /api/auth/mcp-token`, `POST /api/mcp`, `GET /api/mcp/tools`, `POST /api/mcp/tools/{name}`, `create_entry_draft`, `update_entry_layout`, `query_entries`, `list_content_types`, `list_menus`, `list_media`, `/static/grex/grex.elements.json`, JSON-RPC `-32602`, `301` redirect loop/reserved guards)
  - **Grex Theme Builder:** `v1.0.0` (`urbanspress/grex-builder`, `GREX-BUILDER-SPEC-100.md` — `GET /api/design-system.md`, `POST /api/mcp/layout`, `actor: "groxy-ai"`, `applyAiLayout` command-stack Undo parity, `GREX-A11Y-*`, `GREX-SCHEMA-001`, `GREX-SEC-003`/`004`)
- **Governance:** Read alongside [`GROXY-EXPERT.md`](../GROXY-EXPERT.md), [`AGENTS.md`](../AGENTS.md), [`docs/ROADMAP.md`](../docs/ROADMAP.md), and [`specifications/GROXY-AI-SPEC-001.md`](GROXY-AI-SPEC-001.md) through [`specifications/GROXY-AI-SPEC-004.md`](GROXY-AI-SPEC-004.md).

---

## 1. Purpose & `v1.0.0` Production Freeze Scope

**Groxy AI `v1.0.0`** concludes Step 4 of the Post-1.0 **GRAB Ecosystem** as a production-hardened, zero-build, deterministic design, content, and SEO intelligence agent built strictly on **GRAB `v1.1.0`**, **Grex JS `v1.0.0`**, **GrabLab CMS `v1.0.1`**, and **Grex Theme Builder `v1.0.0`**.

Following delivery of the `v0.1.0` Core `grab mcp` Client & 22-Rule Deterministic Auditor, `v0.2.0` Pre-Publish Grade Review Gate & 🚀 `"Let Groxy Boost This"` Diff Engine, `v0.3.0` Autonomous `GRAB-DESIGN-SYSTEM.md`-Aware Visual Page & Section Generator, and `v0.4.0` Site-Wide Internal Linking Graph, `schema.org` JSON-LD, Media `alt`-Text Enrichment & Non-Intrusive Background Snapshot Workflows, **`v1.0.0`** records the completed pre-`v1.0.0` 5-layer cross-repository audit and freezes all `v1.x` contracts across:

1. **Pre-`v1.0.0` 5-Layer Cross-Repository Security, DOM & Contract Audit (`100%` Pass):** Independent multi-repository verification across `GRAB v1.1.0`, `Grex JS v1.0.0`, `GrabLab CMS v1.0.1`, `Grex Theme Builder v1.0.0`, and `Groxy AI v0.4.0`.
2. **SemVer `v1.x` Contract & Schema Stability Freeze (`ADR-027c`):** Freezes all `22` routes in `src/groxy.grab` (`21` primary endpoints + `GET /` redirect), the 22-rule 4-pillar SEO/A11y/DOM/Linking playbook (`playbook/seo-playbook.v1.json`), all `8` Industry & Goal-Aware Style Packs × `5` Blueprints (`40` combinations), single-use `approval_token` + `X-CSRF-Token` human-in-the-loop safety (`GROXY-SAFE-001`), exact `GrabDecimal`/`GrabInteger` wire string preservation (`ADR-025c`), and `AuditReport` / `BoostResult` / `GenerationResult` / `SiteContext` / `LinkGraphReport` / `SchemaOrgResult` / `MediaAltPlan` / `NightlyWatchDigest` / `SiteDnaBundle` JSON contracts.
3. **Hardened `--read-only` Container Deployment Manifests (`deploy/docker-compose.yml` & `deploy/README.md`):**
   - Default standalone `groxy-ai` service running with an immutable container root filesystem (`read_only: true`, `cap_drop: ["ALL"]`, `no-new-privileges:true`, `tmpfs: /tmp:rw,noexec,nosuid,size=64m`), loopback port binding (`127.0.0.1:${GROXY_PORT:-8090}:8090`), writable mount strictly scoped to `../storage:/app/storage:rw` for `SITE-CONTEXT.md`, minimal GRAB CLI capabilities (`--allow-public`, `--allow-scripts`, `--diagnostics production`, `--log-format json`, `--trusted-proxy`, `--allow-read /app`, `--allow-write /app/storage`, `--allow-env ...`, `--platform-config /app/grab.platform.json`, `--allow-cache groxy:read-write`, `--allow-net`, `--static /app/public /app/src/groxy.grab`), and `/_ready` healthcheck.
   - Optional `ecosystem-stack` profile wiring `groxy-ai` alongside `grablab-cms` (`v1.0.1`) and `grex-builder-studio` (`v1.0.0`) over explicit `--allow-net` allowlists with zero hardcoded secrets or private IPs.
4. **Production Audit & Deployment Verification Tests (`tests/unit_v100_production_audit.test.js` & `tests/integration_e2e.py`):** Automated assertions verifying `v1.0.0` version parity, hardened `deploy/` manifest invariants, zero wrapper-`<div>` / zero-`innerHTML` compliance, exact numeric precision, single-use token safety, and full 5-layer cross-repo E2E execution.
5. **Release Documentation, Packaging & Synchronized Dual-Repo Promotion:** Plain-English Walkthrough PDF (`docs/releases/pdf/Groxy-AI-v1.0.0-Guide.pdf`), packaged release archive (`dist/groxy-ai-v1.0.0-bundle.zip` including `deploy/`) + `dist/SHA256SUMS.txt`, ecosystem snapshot sync (`C:\Development\GRAB\scripts\sync-notebook-sources.ps1`), and synchronized GitHub Releases on `urbanspress/groxy-ai.progress` (`origin`) and `urbanspress/groxy-ai.stable` (`stable`) with the mandatory **Release Type & Affected Layers** + **Ecosystem Compatibility Matrix** block.

---

## 2. Pre-`v1.0.0` 5-Layer Cross-Repository Security, DOM & Contract Audit Summary

The mandatory pre-`v1.0.0` audit (`Orchestrator (Argon)`) was executed across all five ecosystem repositories with **100% passing verification**:

| Audit Dimension | Cross-Repository Scope Verified | Observed Evidence & Enforcement | Status |
|---|---|---|---|
| **1. Zero Wrapper-`<div>` & Semantic DOM Compliance** | `grex-js` (`43/43` tests), `grablab-cms`, `grex-builder` (`24/24` tests), `groxy-ai` (`35/35` Node tests + `views/dashboard.grab.html` + `public/groxy/*.js` + `src/groxy.grab`) | `25/25` `.grab.html` templates across all 4 frontend/CMS/Builder/AI repos contain `0` `<div>` tags (`divCount === 0`); `innerHTMLWriteCount === 0` and zero `eval()`/`new Function()` calls across all UI scripts; `<div>`, `<script>`, `<iframe>`, `<object>`, `<style>`, `on*`, `innerHTML`/`srcdoc`, and unsafe URLs (`javascript:`, `vbscript:`, `file:`, `data:`) trigger `F` (`<= 59`, `publish_safe: false`) and HTTP `422` (`-32602`). | **100% Pass** |
| **2. WCAG AA Accessibility & Contrast (`>= 4.5:1`)** | `groxy-ai/public/groxy/generator.js`, `auditor.js`, `src/groxy.grab`, `grex-js` `auditAccessibility()`, `grex-builder` `design-system.js` | All `8` Industry & Goal-Aware Design Style Packs pass WCAG AA Light & Dark contrast `>= 4.5:1` (`wcag_aa: true`); all `40` Style Pack × Blueprint (`8 × 5`) layouts pass `validateElementNode()`, `auditAccessibility()`, and 22-rule grading (`overall_score >= 90`, Grade `A`/`A+`, `publish_safe: true`), including automatic repair of light-on-light overrides. | **100% Pass** |
| **3. Exact Numeric Precision (`ADR-025c`)** | `GRAB v1.1.0` runtime, `Grex JS v1.0.0`, `GrabLab CMS v1.0.1`, `Grex Theme Builder v1.0.0`, `Groxy AI v0.4.0` (`auditor.js`, `booster.js`, `generator.js`, `site-context.js`, `src/groxy.grab`) | Exact base-10 `GrabDecimal` and `GrabInteger` wire strings (`"0.00"`, `"19.95"`, `"29.00"`, `"49.99"`, `"149.95"`, `"1000.00"`, `"10020"`) remain string-exact across audits, boosts, pricing grids, `SITE-CONTEXT.md`, `Site DNA`, and `schema.org` `Product` `offers.price`; JS floats (`29.99`, `49.99`) and IEEE drift strings (`"0.30000000000000004"`) are strictly rejected with HTTP `422` (`GrexSecurityError`). | **100% Pass** |
| **4. Human-in-the-Loop Safety & Cryptographic Isolation (`GROXY-SAFE-001`)** | `src/groxy.grab` (`13` `POST` routes), `public/groxy/mcp-client.js`, `grablab-cms` (`create_entry_draft`), `grex-builder` (`POST /api/mcp/layout`) | All `13` `POST` endpoints enforce `X-CSRF-Token` (`403` on missing/invalid); `boost/approve`, `generate-layout/apply`, and `media/enrich-alt/approve` enforce single-use `approval_token` (`403` invalid, `200` first use, `409 Conflict` replay); `create_entry_draft` enforces `status_enforced: "draft"`; `mcp-client.js` blocks `status: "published"` / `publish_entry` with `GROXY-SAFE-001`; `POST /api/mcp/layout` stamps `actor: "groxy-ai"`, records `applyAiLayout` on `createCommandStack`, preserves live `published` state untouched, and restores pre-AI draft verbatim on 1-click Undo. | **100% Pass** |
| **5. Container & Docker Security (`--read-only`, `GRAB-E401`, `GRAB-E402`)** | `grablab-cms/deploy/docker-compose.yml`, `grex-builder/deploy/docker-compose.yml`, `GRAB v1.1.0 grab mcp`, `groxy-ai/public/groxy/mcp-client.js` | Production compose manifests enforce `read_only: true`, `cap_drop: ["ALL"]`, `no-new-privileges:true`, `tmpfs: /tmp:rw,noexec,nosuid`, and zero hardcoded secrets or private IPs; `grab mcp` (`Gate 3A`) and `mcp-client.js` block `.env`, `.git`, `.ssh`, `*.key`, `*.pem`, `..` traversal, and ungranted writes (`GRAB-E401`); default-deny `--allow-net` + SSRF guards block `169.254.169.254` and unallowlisted origins (`GRAB-E402`). | **100% Pass** |
| **6. Ecosystem Contract Parity** | All 5 layers (`GRAB v1.1.0`, `Grex JS v1.0.0`, `GrabLab CMS v1.0.1`, `Grex Theme Builder v1.0.0`, `Groxy AI v0.4.0`) | All `5` `grab mcp` stdio tools and `6` GrabLab CMS MCP tools match frozen contracts; JSON-RPC `-32602` + HTTP `422` validation schemas align; `grex.elements.json` (`c54c4bcf15ec8fea2dec4ef41975ba85a4b555dd400604e59c78883a8bbdebc9`, 20 elements) matches SHA-256 across `grex-js` and `grablab-cms`, and `grex-js-v1.0.0.js` (`c1e28d74a7ecf19182e225644fa244aa8600658dd1ff8895c133bfc64976b6d6`) matches SHA-256 across `grex-js`, `grex-builder`, and `groxy-ai`; live `GET /api/design-system.md` round-trip succeeds cleanly. *(Observation: `grablab-cms/public/grex/grex.js` uses its CMS-specific v1.0.1 build hash `eded264c31c3f5efa6e4b67ed06049eb5a5e517d34179efcbba921811059a377` while its `grex.elements.json` matches `grex-js` 100%.)* | **100% Pass** |

---

## 3. Planned `v1.0.0` Repository Additions & Updates

Upon explicit project-owner approval of `GROXY-AI-SPEC-005.md`, `v1.0.0` implementation will make only the targeted production-hardening, version-freeze, packaging, and deployment additions below:

```text
groxy-ai/
├── specifications/
│   └── GROXY-AI-SPEC-005.md                  # This v1.0.0 freeze & audit specification
├── deploy/
│   ├── docker-compose.yml                    # Hardened --read-only standalone + ecosystem-stack Compose template
│   └── README.md                             # Plain-English --read-only Docker, capability & zero-secrets guide
├── src/
│   └── groxy.grab                            # Bump service version metadata ("0.4.0" -> "1.0.0") in /_health, /_ready, /api/groxy/mcp/inspect & docs/headers
├── views/
│   └── dashboard.grab.html                   # Bump UI version badge/meta/footer to v1.0.0 (preserving 0 <div> tags)
├── public/
│   └── groxy/
│       ├── auditor.js                        # Update module header comment to v1.0.0 (preserve backwards-compatible schema_version contracts)
│       ├── booster.js                        # Update module header comment to v1.0.0
│       ├── generator.js                      # Update module header comment to v1.0.0
│       ├── site-context.js                   # Update module header comment & Site DNA metadata cleanly per SemVer v1.x freeze
│       ├── mcp-client.js                     # Update module header comment to v1.0.0
│       └── dashboard.js                      # Update dashboard header/studio label to v1.0.0
├── scripts/
│   └── package_release.py                    # Include deploy/ in dist/groxy-ai-v1.0.0-bundle.zip + dist/SHA256SUMS.txt
├── docs/
│   ├── ROADMAP.md                            # Mark v1.0.0 Approved -> Complete upon verification
│   └── releases/
│       ├── generate_release_guides.py        # Add Groxy AI v1.0.0 plain-English walkthrough generator
│       ├── html/Groxy-AI-v1.0.0-Guide.html   # Generated HTML walkthrough guide
│       └── pdf/Groxy-AI-v1.0.0-Guide.pdf     # Generated PDF walkthrough guide
├── tests/
│   ├── unit_v100_production_audit.test.js    # Verifies v1.0.0 version parity, deploy/ --read-only isolation, zero hardcoded secrets/IPs & zero-<div> compliance
│   └── integration_e2e.py                    # Updated E2E checks asserting v1.0.0 /_health, /_ready, /api/groxy/mcp/inspect & deploy/ manifest integrity
├── README.md                                 # Update v1.0.0 status, quickstart & deploy links
├── CHANGELOG.md                              # Add v1.0.0 Production Release section
└── HANDOFF.md                                # Record v1.0.0 completion & snapshot sync
```

> **SemVer Contract Note (`ADR-027c`):** Service identity (`version: "1.0.0"` on `/_health`, `/_ready`, `/api/groxy/mcp/inspect`, UI chrome, and release bundles) bumps to `1.0.0`, while existing endpoint payload `schema_version` strings tested by downstream consumers remain strictly backwards-compatible across the `v1.x` line unless explicitly extended in an additive way.

---

## 4. Frozen `v1.x` Public Contracts (`ADR-027c`)

Any breaking modification to the endpoints, safety gates, schemas, or playbook rules below after `v1.0.0` requires a `v2.0.0` major release (`ADR-027c`). Additive, backwards-compatible extensions are permitted in `v1.x.0`.

### 4.1 Frozen HTTP Endpoint Surface (`22` Routes in `src/groxy.grab`: `9` `GET` + `13` `POST`)

| Method & Route | Auth / Safety Gate | Frozen Responsibility |
|---|---|---|
| `GET /_health` | Public read-only | Returns `200 OK` `{"status":"ok","service":"groxy-ai","version":"1.0.0"}`. |
| `GET /_ready` | Public read-only | Verifies `playbook/seo-playbook.v1.json` (`22` rules) loaded; returns `200 OK` (`status: "ready"`, `version: "1.0.0"`, `rule_count: 22`) or `503`. |
| `GET /` | Public read-only | `302` redirect to `/groxy`. |
| `GET /groxy` | Mints/binds `X-CSRF-Token` | Renders semantic, zero-`<div>` Inspector & Generator UI (`views/dashboard.grab.html`) with `server.asset` fingerprinted `/static/groxy/*` assets. |
| `GET /api/groxy/playbook` | Public read-only JSON | Returns frozen 22-rule `playbook/seo-playbook.v1.json` metadata and rule definitions. |
| `POST /api/groxy/audit` | `X-CSRF-Token` (`403` on fail) | Deterministic 4-pillar `0–100` / `A+`–`F` audit (`AuditReport`) with hard `F` (`<= 59`, `publish_safe: false`) on wrapper-`<div>` or XSS violations. |
| `POST /api/groxy/mcp/inspect` | `X-CSRF-Token` (`403` on fail) | Read-only cross-layer capability & contract check across GrabLab CMS, Grex Theme Builder, and `grab mcp` (`version: "1.0.0"`). |
| `POST /api/groxy/prepublish-review` | `X-CSRF-Token` (`403` on fail) | Opt-in pre-publish grade gate (`review_required` when `groxy_assist_enabled: true`, `bypassed` when `false`); strictly non-mutating. |
| `POST /api/groxy/boost` | `X-CSRF-Token` (`403` on fail) | Non-destructive 🚀 `"Let Groxy Boost This"` remediation + structured Before/After diffs + single-use `approval_token` (`tok_*`). |
| `POST /api/groxy/boost/approve` | `X-CSRF-Token` + single-use `approval_token` (`403`/`409`) | Human approval gate (`GROXY-SAFE-001`) saving draft via `create_entry_draft` (`status_enforced: "draft"`) and layout via `POST /api/mcp/layout` (`actor: "groxy-ai"`). |
| `GET /api/groxy/style-packs` | Public read-only JSON | Lists all `8` WCAG AA Design Style Packs & `5` Blueprints with optional `?goal=` and `?industry=` filtering. |
| `POST /api/groxy/generate-layout` | `X-CSRF-Token` (`403` on fail) | Composes semantic `grex.elements.json` layout (`Grade A`/`A+`, `div_count: 0`, `ADR-025c` `422` float guard) staged with single-use `approval_token` (`tok_*`). |
| `POST /api/groxy/generate-layout/apply` | `X-CSRF-Token` + single-use `approval_token` (`403`/`409`) | Dispatches human-approved layout to Grex Theme Builder (`actor: "groxy-ai"`, `applyAiLayout` Undo parity) + optional draft entry (`status_enforced: "draft"`). |
| `POST /api/groxy/site-context/sync` | `X-CSRF-Token` (`403` on fail) | Read-only upstream pull indexing entries, `ADR-025c` prices, menus (`primary`, `footer`, `mobile`), media, and `301` redirects into `storage/SITE-CONTEXT.md`. |
| `GET /api/groxy/site-context.md` | Public read-only Markdown | Serves latest cached/persisted `SITE-CONTEXT.md` snapshot (`text/markdown; charset=utf-8`). |
| `POST /api/groxy/links/analyze` | `X-CSRF-Token` (`403` on fail) | Read-only directed internal link graph detecting orphans, broken paths, generic anchors, `301` chains, and strictly excluding `301` loops from suggestions. |
| `POST /api/groxy/schema/generate` | `X-CSRF-Token` (`403` on fail) | Deterministic `Article`, `BlogPosting`, `Product` (`ADR-025c` exact string `offers.price`, `422` on float), `FAQPage`, `BreadcrumbList`, and `WebSite` JSON-LD with `</script>` XSS escaping. |
| `POST /api/groxy/media/enrich-alt` | `X-CSRF-Token` (`403` on fail) | Detects missing/filename `alt` text, preserves `decorative: true` (`alt: ""`, `aria_hidden: "true"`), and mints single-use `approval_token` (`altok_*`). |
| `POST /api/groxy/media/enrich-alt/approve` | `X-CSRF-Token` + single-use `approval_token` (`403`/`409`) | Persists explicitly approved `alt` proposals while preserving decorative assets (`status: "decorative_preserved"`). |
| `POST /api/groxy/watch/run` | `X-CSRF-Token` (`403` on fail) | Executes non-intrusive off-peak audit producing quiet **Morning Boost Report** digest (`popups: false`, `silent_edits: false`, `mutates_live_cms: false`). |
| `GET /api/groxy/watch/digest` | Public read-only JSON | Returns latest **Morning Boost Report** digest with 1-click **🚀 `"Let Groxy Boost This"`** descriptors. |
| `GET /api/groxy/site-dna/export` | Public read-only JSON / Markdown | Exports portable **Site DNA** (`application/json` or `?format=markdown`) combining `GRAB-DESIGN-SYSTEM.md`, `SITE-CONTEXT.md`, Style Pack tokens, and Watch digest for **Gashboard + `grabman`**. |

### 4.2 Frozen Playbook, Style Packs & Blueprints
- **22 Deterministic Playbook Rules (`playbook/seo-playbook.v1.json`):** `GROXY-SEO-001..008` (`100` pts), `GROXY-A11Y-001..005` (`100` pts), `GROXY-DOM-001..005` (`100` pts), `GROXY-LINK-001..004` (`100` pts).
- **8 Style Packs × 5 Blueprints (`40` Verified Combinations):**
  - *Style Packs:* `emerald-editorial`, `obsidian-tech`, `warm-commerce`, `swiss-minimal`, `local-service-trust`, `creative-studio-bold`, `creator-academy`, `wellness-organic`.
  - *Blueprints:* `full_landing_page`, `hero_section`, `pricing_grid`, `faq_accordion`, `foreach_showcase`.

---

## 5. Hardened `--read-only` Container Deployment (`deploy/docker-compose.yml` & `deploy/README.md`)

Groxy AI `v1.0.0` ships a production deployment bundle aligned with `grablab-cms/deploy/docker-compose.yml` and `grex-builder/deploy/docker-compose.yml`:

### 5.1 Container Security Controls
- **Immutable Root Filesystem:** `read_only: true` (equivalent to `docker run --read-only`), `cap_drop: ["ALL"]`, `security_opt: ["no-new-privileges:true"]`, and `tmpfs: ["/tmp:rw,noexec,nosuid,size=64m"]`.
- **Loopback Exposure Only:** Host port bound strictly to `127.0.0.1:${GROXY_PORT:-8090}:8090` behind TLS reverse proxy (Caddy/Nginx) using `--trusted-proxy ${GROXY_TRUSTED_PROXY:-127.0.0.1}`.
- **Strictly Scoped Writable Storage:** Application source (`src/`, `views/`, `public/`, `playbook/`, `grab.platform.json`) stays mounted read-only inside the image; only `../storage:/app/storage:rw` is writable for runtime `SITE-CONTEXT.md` persistence.
- **Minimal GRAB `v1.1.0` Capabilities:**
  - `--allow-public --allow-scripts --diagnostics production --log-format json`
  - `--trusted-proxy ${GROXY_TRUSTED_PROXY:-127.0.0.1}`
  - `--allow-read /app --allow-write /app/storage`
  - `--platform-config /app/grab.platform.json --allow-cache groxy:read-write`
  - `--allow-net ${GROXY_ALLOW_NET:-grablab-cms:8080,grex-builder-studio:8080}` (default-deny outside explicitly listed upstream hosts per `GRAB-E402`)
  - `--allow-env GROXY_STORAGE_DIR,GROXY_SITE_CONTEXT_PATH` (only if explicitly configured via `use env`)
  - `--static /app/public /app/src/groxy.grab`
- **Two Compose Modes:**
  1. **Default (`groxy-ai`):** Standalone hardened Groxy AI container service with `/_ready` Docker healthcheck (`wget -qO- http://127.0.0.1:8090/_ready || exit 1`).
  2. **Optional `ecosystem-stack` Profile (`--profile ecosystem-stack`):** Composes `groxy-ai` alongside `grablab-cms` (`v1.0.1`) and `grex-builder-studio` (`v1.0.0`) on an internal bridge network with `--allow-net` strictly scoped to the internal CMS and Theme Builder service addresses.
- **Zero-Secrets Git Hygiene:** Zero real VPS IP addresses, passwords, tokens, or `GRABLAB_MASTER_KEY` literals committed in `deploy/`—all runtime secrets supplied via untracked `.env` or secret managers.

---

## 6. `v1.0.0` Acceptance & Verification Gates

`Groxy AI v1.0.0` is eligible for completion, `v1.0.0` tagging, and synchronized `origin` + `stable` release promotion **only** when **100%** of these gates pass:

1. **GRAB CLI Static & Canonical Format Parity:**
   - `grab check --platform-config grab.platform.json src/groxy.grab` and `.grab.html` probe compilation exit `0` with zero errors.
   - Non-destructive `grab format src/groxy.grab` stdout matches `src/groxy.grab` on disk byte-for-byte.
2. **Full Node Unit, DOM, WCAG AA & Production Audit Suite (`node --test tests/*.test.js`):**
   - All existing `35` tests (`unit_auditor`, `unit_booster`, `unit_enrichment`, `unit_generator`, `unit_mcp_client`, `unit_playbook`, `unit_site_intelligence`, `unit_ui_dom`) plus `tests/unit_v100_production_audit.test.js` pass `100%` (verifying `v1.0.0` metadata parity, `deploy/docker-compose.yml` + `deploy/README.md` `--read-only` isolation, zero hardcoded secrets/IPs, `divCount === 0`, `innerHTMLWriteCount === 0`, `40` Style Pack × Blueprint combinations, and `ADR-025c` exact precision).
3. **Full Cross-Layer E2E Integration (`python tests/integration_e2e.py`):**
   - Gate `1` (static/format/DOM), Gate `2` (Node tests), Gate `3A` (`GRAB v1.1.0 grab mcp`), and Gate `3B` (live **GRAB `v1.1.0` + GrabLab CMS `v1.0.1` + Grex Theme Builder `v1.0.0` + Groxy AI `v1.0.0`**) pass `100%`, including `version == "1.0.0"` on `/_health`, `/_ready`, and `/api/groxy/mcp/inspect`.
4. **Release Artifacts & Ecosystem Snapshot Sync:**
   - Generates `docs/releases/html/Groxy-AI-v1.0.0-Guide.html` and `docs/releases/pdf/Groxy-AI-v1.0.0-Guide.pdf` (`docs/releases/generate_release_guides.py 1.0.0`).
   - Packages `dist/groxy-ai-v1.0.0-bundle.zip` (including `deploy/`), `dist/Groxy-AI-v1.0.0-Guide.pdf`, and `dist/SHA256SUMS.txt` (`scripts/package_release.py 1.0.0`).
   - Executes `powershell -ExecutionPolicy Bypass -File C:\Development\GRAB\scripts\sync-notebook-sources.ps1` so `C:\Development\ECOSYSTEM-SNAPSHOT.md` is current.
5. **Synchronized Dual-Repo Release Promotion (upon explicit owner approval):**
   - Pushes `main` and annotated `v1.0.0` tag in ascending order to both `origin` (`urbanspress/groxy-ai.progress`) and `stable` (`urbanspress/groxy-ai.stable`).
   - Publishes matching `v1.0.0` GitHub Releases with `groxy-ai-v1.0.0-bundle.zip`, `Groxy-AI-v1.0.0-Guide.pdf`, `SHA256SUMS.txt`, and the mandatory **Release Type & Affected Layers** + **Ecosystem Compatibility Matrix** block to both repositories.
