# GROXY-AI-SPEC-180 — Baked-In Offline Knowledge Vault, Allowlisted Real-Time Web Research & Bestseller Radar

- **Version:** Groxy AI `v1.8.0`
- **Status:** Approved target; specification in review
- **Draft Date:** 2026-11-17
- **SemVer:** MINOR — backwards-compatible feature release (`ADR-027c`).
- **Frozen baselines:** Groxy AI `v1.0.0` through `v1.7.0`; GRAB `v1.1.0`; Grex JS `v1.0.0`; GrabLab CMS `v1.0.1`; Grex Theme Builder `v1.0.0`; Gashboard `v1.0.0`; Groxy Desk `v1.0.0`.
- **Governance:** [AGENTS.md](../AGENTS.md), [GROXY-EXPERT.md](../GROXY-EXPERT.md), [HANDOFF.md](../HANDOFF.md), [Roadmap](../docs/ROADMAP.md), [SPEC-170](GROXY-AI-SPEC-170.md).

---

## 1. Purpose, Scope & Approval Boundary

Equip operators, authors, and publishers with:
1. A **Baked-In Offline Knowledge Vault** (`playbook/knowledge/*.v1.json` & `POST /api/groxy/knowledge/query`) operating 100% locally at zero API fee.
2. An **Allowlisted Real-Time Web Research & Bestseller Radar** (`POST /api/groxy/research/search`, `POST /api/groxy/research/bestseller-radar`, `playbook/market/bestseller-radar.v1.json`) strictly governed by `GRAB-E402` SSRF protection, exact `ADR-025c` base-10 `GrabDecimal` price tiers, and `GROXY-SAFE-001` single-use `rtok_res_<hex>` approval tokens.
3. An **OAuth2 Read-Only Google Search Console Integration** (`gsc.readonly`) storing encrypted tokens at rest via `use crypto` `AES-256-GCM` (`"v1:..."`) and surfacing GDPR/CCPA-compliant aggregated query/impression/CTR metrics.
4. A **Pure `Grex JS v1.0.0` Research & Radar Studio Panel** inside `/groxy` (`divCount === 0`, `innerHTMLWriteCount === 0`, Light/Dark WCAG AA `>= 4.5:1`).

Under the **Stage 1 Spec-First Approval Gate** in [AGENTS.md](../AGENTS.md), **no `v1.8.0` application code** (`src/`, `views/`, `public/`, `assets/`, `tests/`) is written until the project owner explicitly approves this specification and the Stage 2 Pre-Implementation Cross-Layer Security & Contract Audit passes. Frozen `v1.0.0`–`v1.7.0` code and all eight sibling repositories remain untouched.

**Out of scope:** auto-publishing live entries (`status: "published"`), silent overwrite of human manuscripts or layouts, bypassing third-party CAPTCHAs or login walls, unallowlisted outbound HTTP requests, raw JS floats in `ADR-025c` fields, new Grex elements outside `grex.elements.json`, and mandatory third-party cloud API fees.

---

## 2. Baked-In Offline Knowledge Vault (`playbook/knowledge/*.v1.json`)

### 2.1 Modular Knowledge Datasets
`Groxy AI v1.8.0` ships a versioned, zero-network, zero-fee knowledge vault under `playbook/knowledge/`:
- `playbook/knowledge/seo-rules.v1.json`: Semrush, Ahrefs, Google Search Central, and AnswerThePublic-style question/keyword intent frameworks.
- `playbook/knowledge/schema-org-types.v1.json`: Schema.org v30.1 vocabularies (`Book`, `BookSeries`, `Product`, `Article`, `BlogPosting`, `FAQPage`, `BreadcrumbList`, `WebSite`) with plain `https://schema.org/...` identifiers.
- `playbook/knowledge/wcag-aa-patterns.v1.json`: WCAG AA `>= 4.5:1` / `>= 3.0:1` contrast rules and accessible `Grex JS v1.0.0` 20-element structural patterns.
- `playbook/knowledge/conversion-copywriting.v1.json`: Conversion copywriting frameworks, 1-primary-CTA-per-fold patterns, and back-cover blurb hooks.
- `playbook/knowledge/correctional-publishing.v1.json`: Correctional-facility and direct-to-reader book publishing playbooks (USPS-only carrier rules, Matte paperback physical constraints, facility mailroom tiering, and zero-promotional-insert packing slip rules).

### 2.2 Fail-Closed Schema Validator (`groxy-knowledge-vault-v1.0`)
At server startup and runtime load, every `playbook/knowledge/*.v1.json` file MUST pass strict schema validation; any malformed, incomplete, or unsafe dataset **fails closed** (never loads partial rules):
- **Required top-level fields:** `schema_version` (`"groxy-knowledge-vault-v1.0"`), `domain_slug` (lowercase `^[a-z0-9-]+$`), `display_name`, `updated_at`, and `entries` (non-empty array of `{ entry_id, title, category, tags, summary, rules, citations }`).
- **Exact `ADR-025c` Base-10 Numeric Fidelity:** Any numeric thresholds, contrast ratios (e.g., `"4.50"`, `"3.00"`), word-count targets, or price benchmarks MUST be exact base-10 wire strings (`GrabDecimal` / `GrabInteger`). Raw JS floats or exponent notation are rejected with HTTP `422`.
- **Zero Inline HTML / XSS:** Dataset strings MUST NOT contain `<script`, `</script`, `<iframe`, `<object`, `<style`, `<div`, inline `on*=` attributes, or unsafe URL protocols (`javascript:`, `vbscript:`, `file:`, unsanitized `data:`).

### 2.3 Deterministic Offline Query Engine (`POST /api/groxy/knowledge/query`)
Queries `playbook/knowledge/*.v1.json` 100% locally with zero network calls:
- Accepts `{ query, domain_slug? , category?, limit? }` (bounded plain text, `limit` `1..25`).
- Computes deterministic relevance scores from exact tag, title, category, and token matches, returning ranked entries with `entry_id`, `domain_slug`, `title`, `summary`, `rules`, and `citations`.

---

## 3. Shared Route Contract, Auth & Input Validation

All routes require existing authenticated operator authorization. Mutating `POST` routes require `X-CSRF-Token`; failures return `403` before any storage read, outbound request, or staging. Requests reject unknown fields, duplicate JSON keys (`400`), wrong types, raw JS floats in numeric wire fields (`422`), and invalid identifiers (`400`). Requests never accept arbitrary filesystem paths, SQL, shell commands, or raw unallowlisted URLs.

| Route | Request | Result |
|---|---|---|
| `POST /api/groxy/knowledge/query` | `query` (bounded plain text), optional `domain_slug`, optional `category`, optional `limit` | `200`: deterministic offline matches from `playbook/knowledge/*.v1.json` |
| `POST /api/groxy/research/search` | `query` (bounded plain text), `provider` (`searxng` \| `duckduckgo` \| `wikipedia` \| `openlibrary`), optional `limit` | `200`: `GRAB-E402` allowlist-verified search results with source URL citations (`403` if `groxy_web_research_enabled` is false or origin is not allowlisted) |
| `POST /api/groxy/research/bestseller-radar` | `genre_slug`, optional `target_consumer` (`groxy_studio` \| `grablab_cms` \| `groxy_desk`), optional `target_slot`, optional `price_tier_usd`, optional `include_live_feeds` | `200`: profit-ranked genre/book brief with exact `ADR-025c` pricing tiers, `payload_sha256`, and single-use `rtok_res_<hex>`; staging only, no CMS/Builder write |
| `POST /api/groxy/research/bestseller-radar/apply` | `radar_plan_id`, `genre_slug`, `target_consumer`, `target_slot`, `payload_sha256`, `approval_token` | `201` winner after atomic ledger claim and draft-only CMS/Builder/Desk dispatch; `403` CSRF/token/binding mismatch; `409` replay, concurrent race, or stale target |
| `GET /api/groxy/research/gsc/status` | None | `200`: connection status (`connected: true/false`), `scope: "https://www.googleapis.com/auth/webmasters.readonly"`, property domain (never tokens/secrets) |
| `POST /api/groxy/research/gsc/connect` | `site_url`, `authorization_code`, `code_verifier`, `redirect_uri` | `200`: exchanges PKCE code with `https://oauth2.googleapis.com/token` (`GRAB-E402` verified), encrypts tokens via `AES-256-GCM` (`"v1:..."`), returns redacted status |
| `POST /api/groxy/research/gsc/query` | `site_url`, `start_date`, `end_date`, optional `row_limit` | `200`: aggregated query/impression/CTR/position metrics from `gsc.readonly` (GDPR/CCPA compliant, zero PII) |
| `POST /api/groxy/research/gsc/disconnect` | `site_url` | `200`: revokes/deletes stored encrypted token row cleanly |

---

## 4. Allowlisted Real-Time Web Research & Bestseller Radar

### 4.1 `GRAB-E402` Exact-Origin HTTPS Allowlisting & SSRF Protection
Live web research (`POST /api/groxy/research/search` and `include_live_feeds: true` on Bestseller Radar) is **opt-in** (`groxy_web_research_enabled: true` in config) and strictly governed by `GRAB-E402`:
- **Exact-Origin HTTPS Allowlist:** Outbound requests MUST target explicitly configured exact `https://` origins (e.g., `https://api.duckduckgo.com`, `https://en.wikipedia.org`, `https://openlibrary.org`, or an operator-configured `https://` SearXNG origin). Plain `http://` is forbidden for external hosts.
- **SSRF IP & Host Blocking:** Reject loopback (`127.0.0.0/8`, `::1`, `localhost`), private RFC-1918 (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), unique-local IPv6 (`fc00::/7`), link-local (`169.254.0.0/16`, `fe80::/10`), and cloud-metadata (`169.254.169.254`, `metadata.google.internal`) addresses before socket connection.
- **Redirect Revalidation:** Disable blind auto-follow redirects; every `3xx` `Location` header MUST be re-parsed and re-validated against the exact-origin allowlist and SSRF IP blocklist (bounded max hops, e.g., `<= 3`), failing closed with `GRAB-E402` / HTTP `403` on any violation.
- **Prompt-Injection & XSS Isolation:** External feed snippets are untrusted data—stripped of HTML, bounded in length, JSON-encoded before any optional local Ollama (`127.0.0.1:11434`) synthesis, and never allowed to alter prices, targets, or approval state.

### 4.2 Bestseller Radar Playbook (`playbook/market/bestseller-radar.v1.json`)
Compiles profit-ranked genre and book briefs from `playbook/market/bestseller-radar.v1.json` (and optional `GRAB-E402` allowlisted public book/trend feeds):
- **Fail-Closed Schema:** Validated at startup and runtime load (`groxy-bestseller-radar-v1.0`), zero inline HTML/XSS, exact `ADR-025c` base-10 wire strings.
- **Exact `ADR-025c` Base-10 `GrabDecimal` Price Tiers:** Supports exact base-10 wire strings `"2.99"`, `"4.99"`, `"12.99"`, `"14.99"`, and `"16.99"` (alongside unit-cost, estimated USPS postage, and net-margin wire strings). Raw JS floats, scientific notation, or non-canonical numeric strings are rejected with HTTP `422`.
- **Profit-Ranked Briefs:** Outputs recommended book concepts, keyword demand signals, series hook positioning, `schema.org/Book` JSON-LD preview (`</script>`-escaped), and exact net-margin comparisons.

---

## 5. `GROXY-SAFE-001` Staging, Canonical Hashing & Atomic Single-Winner Apply (`rtok_res_<hex>`)

1. **Canonical Digest (`payload_sha256`):** Computed over recursive Unicode-code-point-sorted UTF-8 JSON of the staged Bestseller Radar brief using Groxy's canonicalizer (`v1.3.0`+).
2. **Target-Bound Approval Token (`rtok_res_<hex>`):** Single-use CSPRNG token (`>= 128` bits), stored as `SHA-256(rtok_res)` in an additive Groxy-owned SQLite ledger table (`groxy_research_ledger` on the existing `commerce` connection in `scripts/migrate_commerce.grab`), bound to `{ radar_plan_id, genre_slug, target_consumer, target_slot, payload_sha256 }` with a bounded TTL (default 15 minutes).
3. **Atomic Single-Winner Consumption:** `POST /api/groxy/research/bestseller-radar/apply` validates `X-CSRF-Token` (`403`), verifies token & binding (`403`), and atomically claims the row (`UPDATE groxy_research_ledger SET status = 'applying' WHERE plan_id = :plan_id AND status = 'staged'`). Concurrent races or replays yield **exactly one `201` winner** and **`409` for all losers/replays**.
4. **Draft-Only & Target-Scoped Dispatch:**
   - **Groxy AI Studio (`/groxy`):** Stages/saves the brief as a draft in GrabLab CMS (`create_entry_draft`, `status_enforced: "draft"`) and/or one-slot Grex Theme Builder `POST /api/mcp/layout` (`actor: "groxy-ai"`, `Ctrl+Z` `applyAiLayout` undo parity).
   - **GrabLab CMS `v1.4.0` Embedded Bestseller Radar:** Returns a verified draft-only import payload (`status_enforced: "draft"`) for CMS draft creation.
   - **Groxy Desk `v1.1.0` WebView2 Co-Pilot:** Returns a signed, `rtok_res_<hex>`-verified import receipt for the Desk Co-Pilot without auto-publishing or bypassing human confirmation.
   - Downstream dispatch failures transition the ledger row to terminal `dispatch_failed`; tokens are never reusable.

---

## 6. OAuth2 Read-Only Google Search Console Integration (`gsc.readonly`, `AES-256-GCM`)

1. **Least-Privilege Scope (`gsc.readonly`):** Requests strictly `https://www.googleapis.com/auth/webmasters.readonly` via OAuth2 + PKCE (`S256` challenge via `crypto.sha256_base64url`). Never requests write scopes or account-management scopes.
2. **`AES-256-GCM` Encrypted Token Storage:** Access and refresh tokens are encrypted at rest using GRAB `v1.1.0` `use crypto` (`crypto.encrypt_aead` / `crypto.decrypt_aead` with `"v1:..."` envelope and explicit 32-byte key from `--allow-env`). Tokens are stored in `groxy_gsc_connections` (additive table on `commerce`) and are **never** returned in HTTP responses, error messages, or logs.
3. **GDPR / CCPA Compliance:** Queries strictly aggregated search performance metrics (`query`, `page`, `clicks`, `impressions`, `ctr`, `position`) formatted with exact `ADR-025c` base-10 wire strings; zero PII or visitor-level tracking is collected or stored.
4. **Outbound `GRAB-E402` Enforcement:** Token exchange and Search Console API calls allowlist only `https://oauth2.googleapis.com` and `https://www.googleapis.com`.

---

## 7. Cross-Layer Integration Contracts

- **GrabLab CMS `v1.0.1` / planned `v1.4.0`:** All CMS writes route through `create_entry_draft` (`status_enforced: "draft"`) with live `list_content_types` custom-field filtering. Embedded Bestseller Radar imports require `rtok_res_<hex>` + `X-CSRF-Token`.
- **Grex Theme Builder `v1.0.0`:** Layout updates use strictly one-slot `POST /api/mcp/layout` (`actor: "groxy-ai"`, `Ctrl+Z` undo parity) with `slot_sha256` sibling-drift protection (`409`).
- **Groxy Desk `v1.0.0` / planned `v1.1.0`:** WebView2 Co-Pilot imports consume `rtok_res_<hex>`-staged radar briefs without modifying frozen `v1.0.0` Desk binaries.

---

## 8. Pure `Grex JS v1.0.0` Research & Radar Studio Panel (`/groxy`)

Renders inside `views/dashboard.grab.html` + `public/groxy/research-studio.js` (and `assets/research-studio.js`) using strictly the 20 semantic elements in `grex.elements.json` and semantic HTML5 (`<details>`, `<dialog>`):
- **Zero Wrapper `<div>` & Zero `innerHTML`:** `divCount === 0`, `innerHTMLWriteCount === 0`, zero `eval()` / `new Function()`.
- **Accessibility & Contrast:** Full keyboard navigation (`Enter`/`Space`), accessible labels on all `Input` / `Select` / `Button` controls, `<dialog>` confirmation with `Escape` handling and focus restoration, and Light/Dark WCAG AA `>= 4.5:1` contrast (`auditAccessibility()` 100% pass).

---

## 9. Acceptance & Verification Gates — Required After Owner Approval

1. **GRAB Static & Format Parity:** `grab check --platform-config grab.platform.json` passes on all `.grab` / `.grab.html` files with zero errors; `grab format <file>` stdout matches every `.grab` file on disk byte-for-byte.
2. **Knowledge Vault & Bestseller Radar Playbooks (`node --test tests/*.test.js`):** All `playbook/knowledge/*.v1.json` and `playbook/market/bestseller-radar.v1.json` files pass fail-closed schema validation; malformed, float-priced (`422`), or XSS-containing playbooks fail closed.
3. **`GRAB-E402` SSRF & Redirect Revalidation:** Outbound research tests verify exact-origin HTTPS allowlisting, block loopback (`127.0.0.1`, `::1`), private (`10.x`, `172.16.x`, `192.168.x`), link-local (`169.254.x`), and cloud-metadata (`169.254.169.254`) targets, and block `3xx` redirects to unallowlisted/private origins.
4. **`ADR-025c` Exact Base-10 Numerics:** Bestseller Radar price tiers (`"2.99"`, `"4.99"`, `"12.99"`, `"14.99"`, `"16.99"`) and GSC metrics preserve exact base-10 wire strings; raw JS floats or scientific notation are rejected with HTTP `422`.
5. **OAuth2 `gsc.readonly` & `AES-256-GCM` Token Encryption:** Tests verify `use crypto` `AES-256-GCM` (`"v1:..."`) encryption at rest, zero secret leakage in responses/logs, `gsc.readonly` scope enforcement, and GDPR/CCPA aggregated-only metric output.
6. **`GROXY-SAFE-001` Approval & Concurrency (`rtok_res_<hex>`):** Missing/invalid `X-CSRF-Token` -> `403`; `rtok_res_<hex>` binding mismatch -> `403`; replay -> `409`; two-process concurrent apply race yields **exactly one `201` and one `409`**; CMS dispatch enforces `status_enforced: "draft"`; Builder dispatch uses one-slot `POST /api/mcp/layout` (`actor: "groxy-ai"`).
7. **DOM & WCAG AA Accessibility:** `divCount === 0`, `innerHTMLWriteCount === 0`, Light/Dark WCAG AA `>= 4.5:1`, `auditAccessibility()` 100% pass across the Research & Radar Studio UI and generated layouts, plus `<dialog>` `Escape` & focus restoration.
8. **Live Gate 3B (`python tests/integration_e2e.py`):** Live 4-layer E2E verification against `GRAB v1.1.0`, `Grex JS v1.0.0`, `GrabLab CMS v1.0.1`, `Grex Theme Builder v1.0.0`, and `Groxy AI v1.8.0` passes 100% with `release-ready: True`.
9. **Regression & Freeze Preservation:** All frozen `v1.0.0`–`v1.7.0` tests pass; all 8 sibling repositories remain unmodified and clean.
10. **Release Promotion:** Only after explicit owner approval, dual-remote protocol per [AGENTS.md](../AGENTS.md) with 5-layer Ecosystem Compatibility Matrix, walkthrough PDF (`docs/releases/pdf/Groxy-AI-v1.8.0-Guide.pdf`), release bundle, and `SHA256SUMS.txt`.

---

## 10. Owner Review & Next Phase

**Awaiting explicit project-owner approval of `SPEC-180`.** Once approved, switch to **`Claude Opus (High)`** (or **`Orchestrator (Argon)`**) for the Stage 2 Pre-Implementation Cross-Layer Security & Contract Audit before writing any `v1.8.0` application code.
