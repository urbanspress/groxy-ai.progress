# GROXY-AI-SPEC-180 — Baked-In Offline Knowledge Vault, Allowlisted Real-Time Web Research & Bestseller Radar

- **Version:** Groxy AI `v1.8.0`
- **Status:** Approved; implementation in progress
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

**Approved; implementation in progress (2026-11-17).** Explicit project-owner approval received for `SPEC-180` as written. Stage 2 Pre-Implementation Cross-Layer Security & Contract Audit verdict: **`PASS`** (Section 11, Binding Conditions `C1–C8`). Next phase: switch to **`GPT-OSS 120B (High)`** (or **`Claude Sonnet (High)`** / **`Hydrogen (High)`**) for Stage 3 implementation and all Section 9 acceptance gates.

---

## 11. Stage 2 Pre-Implementation Cross-Layer Security & Contract Audit — `PASS` (2026-11-17)

**Auditor:** Google Antigravity — Orchestrator (Argon), Stage 2 routing. **Method:** Read-only contract inspection of `C:\Development\groxy-ai` (`AGENTS.md`, `GROXY-EXPERT.md`, `HANDOFF.md`, `docs/ROADMAP.md`, `specifications/GROXY-AI-SPEC-170.md`, `scripts/migrate_commerce.grab`, `src/groxy.grab`), frozen **GrabLab CMS `v1.0.1`** (`HANDOFF.md`, `src/app.grab`), frozen **Groxy Desk `v1.0.0`** (`HANDOFF.md`), and **Plotific Press** (`AGENTS.md`, `PLOTIFIC-EXPERT.md`). All frozen sibling repositories remained completely unmodified and clean (`git status --short` empty). **Zero upstream code changes are required.**

### 11.1 Contract Verification Matrix

| `SPEC-180` Requirement | Frozen Upstream / Baseline Evidence | Verdict |
|---|---|---|
| Fail-closed `groxy-knowledge-vault-v1.0` & `groxy-bestseller-radar-v1.0` schemas (`playbook/knowledge/*.v1.json`, `playbook/market/bestseller-radar.v1.json`) + Plotific Press rules | `correctional-publishing.v1.json` aligns 100% with `PLOTIFIC-EXPERT.md` (`PLOTIFIC-SAFE-001` fail-closed mailroom gating; `LULU-USPS-001` `perfect_bound_paperback`, `matte` finish, `60# uncoated`, USPS-only blocking `UPS`/`FedEx`/`DHL`, plain white-label packing slip with zero promotional inserts/staples). Startup and runtime validators reject malformed, float-priced (`422`), or XSS-tainted datasets fail-closed, and `scripts/package_release.py` bundles all datasets (`C1`). | `PASS` |
| `ADR-025c` exact base-10 `GrabDecimal` / `GrabInteger` fidelity (`"2.99"`, `"4.99"`, `"12.99"`, `"14.99"`, `"16.99"` & `422` float rejection) | GrabLab CMS `validate_single_field_value` preserves `integer` and base-10 `decimal` strings; Plotific Press `ADR-025c` uses exact base-10 wire strings; Groxy's raw JSON scanner rejects raw JS floats, scientific notation, and non-canonical numeric strings with HTTP `422` across Bestseller Radar tiers, costs/margins, knowledge thresholds (`"4.50"`, `"3.00"`), and GSC metrics (`C2`). | `PASS` |
| `GRAB-E402` exact-origin HTTPS allowlisting, SSRF IP/host blocks & `3xx` redirect revalidation | GRAB `v1.1.0` enforces default-deny `--allow-net`; `SPEC-180` keeps live web research opt-in (`groxy_web_research_enabled: true`, `403` when disabled), restricts external requests to configured exact `https://` origins (`https://api.duckduckgo.com`, `https://en.wikipedia.org`, `https://openlibrary.org`, or configured `https://` SearXNG origin), blocks loopback/RFC-1918/ULA/link-local/cloud-metadata hosts pre-connect, disables blind auto-redirects (`retries: 0`), revalidates every `3xx` `Location` (`<= 3` hops, fail closed `403 GRAB-E402`), and isolates untrusted snippets via HTML stripping + JSON encoding (`C3`). | `PASS` |
| OAuth2 `webmasters.readonly` PKCE & `AES-256-GCM` (`"v1:..."`) encrypted token storage | Mirrors GrabLab CMS `v1.0.1` (`src/app.grab:432-463, 4925-5008, 5236`) native GRAB `v1.1.0` `crypto.sha256_base64url` PKCE `S256` and `crypto.encrypt_aead` / `crypto.decrypt_aead` (`"v1:..."` envelope with explicit master key from `--allow-env` `GROXY_MASTER_KEY` / `GRABLAB_MASTER_KEY`), storing encrypted tokens in additive `groxy_gsc_connections`, allowlisting only `https://oauth2.googleapis.com` and `https://www.googleapis.com` (with confined loopback test override only for deterministic test harness), returning zero secrets in responses/logs, and exposing strictly GDPR/CCPA-compliant aggregated metrics (`C4`). | `PASS` |
| Atomic single-winner `rtok_res_<hex>` consumption (`201` winner, `403` mismatch, `409` replay/race) + `slot_sha256` drift guard | Additive `version: 5` migration in `scripts/migrate_commerce.grab` on existing `commerce` connection creates `groxy_research_ledger` and `groxy_gsc_connections`; reuses Groxy's recursive canonical `payload_sha256`, `crypto.hash_password` over `SHA-256` target binding, `X-CSRF-Token` (`403`), Builder `slot_sha256` freshness pre-check & post-claim re-read (`409 RESEARCH_SLOT_DRIFT`), and `UPDATE ... WHERE plan_id = :plan_id AND status = 'staged'` with `sqlite_jitter_backoff` (`201` single winner / `409` losers & replays) (`C5`). | `PASS` |
| Cross-layer import payloads (`groxy_studio`, GrabLab CMS `v1.0.1` / `v1.4.0`, Grex Theme Builder `v1.0.0`, Groxy Desk `v1.0.0` / `v1.1.0`) | GrabLab CMS `create_entry_draft` enforces `status: "draft"` / `status_enforced: "draft"` and `list_content_types` allows strict `custom_fields` filtering (`C6`). Grex Theme Builder `POST /api/mcp/layout` enforces one-slot replacement (`actor: "groxy-ai"`, `applyAiLayout` `Ctrl+Z` undo parity, canonical readback). `groxy_desk` receives a signed `rtok_res_<hex>`-consumed draft-only import receipt (`status_enforced: "draft"`, `human_confirmation_required: true`) without touching frozen `v1.0.0` Desk binaries (`C6`). | `PASS` |
| XSS-safe `schema.org/Book` JSON-LD preview | Reuses `SPEC-170` `escape_jsonld_for_script` escaping `</script>`, `<`, `>`, `&`, `U+2028`, and `U+2029` alongside exact `ADR-025c` `offers.price` wire strings (`C7`). | `PASS` |
| Pure `Grex JS v1.0.0` Research & Radar Studio panel (`/groxy`) | Zero wrapper `<div>` elements (`divCount === 0`), zero `innerHTML` writes (`innerHTMLWriteCount === 0`), zero `eval()` / `new Function()`, live `--grex-*` / `.grex-c-*` reuse from `GET /api/design-system.md`, keyboard `Enter`/`Space` + `<dialog>` `Escape` & focus restoration, and Light/Dark WCAG AA `>= 4.5:1` (`auditAccessibility()` 100% pass) (`C8`). | `PASS` |

### 11.2 Binding Stage 3 Implementation Conditions (No Upstream Change)

1. **`C1` — Fail-Closed `groxy-knowledge-vault-v1.0` & `groxy-bestseller-radar-v1.0` Schemas:** Validate all 5 `playbook/knowledge/*.v1.json` files (`seo-rules`, `schema-org-types`, `wcag-aa-patterns`, `conversion-copywriting`, `correctional-publishing`) and `playbook/market/bestseller-radar.v1.json` at server startup and runtime load; enforce `PLOTIFIC-SAFE-001` & `LULU-USPS-001` rules in `correctional-publishing.v1.json` (`perfect_bound_paperback`, `matte` finish, `60# uncoated`, USPS-only carriers blocking `UPS`/`FedEx`/`DHL`, plain white-label packing slip with zero promotional inserts/staples); reject any malformed, float-priced (`422`), or XSS-tainted (`<script`, `</script`, `<iframe`, `<object`, `<style`, `<div`, `on*=`, `javascript:`, `vbscript:`, `file:`, `data:`) dataset fail-closed; bundle `playbook/knowledge/*.v1.json` and `playbook/market/bestseller-radar.v1.json` in `scripts/package_release.py`.
2. **`C2` — `ADR-025c` Exact Base-10 `GrabDecimal` / `GrabInteger` Fidelity (`422` Float Rejection):** Enforce exact base-10 wire strings across Bestseller Radar price tiers (`"2.99"`, `"4.99"`, `"12.99"`, `"14.99"`, `"16.99"`), unit print costs, estimated USPS postage, net-margin strings, knowledge-vault numeric thresholds (`"4.50"`, `"3.00"`), and GSC metrics (`clicks`, `impressions`, `ctr`, `position`). Reject raw JS floats, scientific notation, and non-canonical numeric strings with HTTP `422`.
3. **`C3` — `GRAB-E402` Exact-Origin HTTPS Allowlisting, SSRF Blocking & `3xx` Redirect Revalidation:** Keep live web research opt-in (`groxy_web_research_enabled: true`, returning `403` when disabled); allow only configured exact `https://` origins (`https://api.duckduckgo.com`, `https://en.wikipedia.org`, `https://openlibrary.org`, or configured `https://` SearXNG origin); reject loopback (`127.0.0.0/8`, `::1`, `localhost`), private RFC-1918 (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), unique-local IPv6 (`fc00::/7`), link-local (`169.254.0.0/16`, `fe80::/10`), and cloud-metadata (`169.254.169.254`, `metadata.google.internal`) before socket connection; disable blind redirect follow (`retries: 0`) and revalidate every `3xx` `Location` header against the exact-origin allowlist and SSRF blocklist (`<= 3` hops, failing closed with `403 GRAB-E402`); strip HTML, bound length, and JSON-encode untrusted snippets before any optional local Ollama (`127.0.0.1:11434`) synthesis.
4. **`C4` — OAuth2 `webmasters.readonly` PKCE & `AES-256-GCM` (`"v1:..."`) Token Storage:** Enforce least-privilege scope `https://www.googleapis.com/auth/webmasters.readonly` (`gsc.readonly`) with PKCE (`S256` via `crypto.sha256_base64url`); allowlist only `https://oauth2.googleapis.com` and `https://www.googleapis.com` under `GRAB-E402` (with confined loopback test override only for deterministic test harness); encrypt `access_token` and `refresh_token` at rest using GRAB `v1.1.0` `use crypto` `crypto.encrypt_aead` / `crypto.decrypt_aead` (`"v1:..."` envelope with explicit master key from `--allow-env` `GROXY_MASTER_KEY` / `GRABLAB_MASTER_KEY`) in additive `groxy_gsc_connections` table; never return or log tokens/secrets; surface strictly GDPR/CCPA-compliant aggregated query/page/clicks/impressions/ctr/position metrics.
5. **`C5` — Additive `version: 5` SQLite Migration (`groxy_research_ledger` & `groxy_gsc_connections`) & Atomic Single-Winner `rtok_res_<hex>`:** Add migration `version: 5` to `scripts/migrate_commerce.grab` on existing `commerce` connection creating `groxy_research_ledger` and `groxy_gsc_connections`; bind single-use `rtok_res_<hex>` (`>= 128` bits, stored via `crypto.hash_password` over `SHA-256` binding) to `{ radar_plan_id, genre_slug, target_consumer, target_slot, payload_sha256 }` (recursive Unicode-code-point-sorted UTF-8 JSON); enforce `X-CSRF-Token` (`403`), binding verification (`403`), Builder `slot_sha256` freshness pre-check (`409 RESEARCH_SLOT_DRIFT`), atomic single-winner `UPDATE groxy_research_ledger SET status = 'applying' WHERE plan_id = :plan_id AND status = 'staged'` with `sqlite_jitter_backoff` retry (`201` single winner, `409` for all concurrent losers and replays), and post-claim `slot_sha256` re-check.
6. **`C6` — Cross-Layer Import Payloads (`groxy_studio`, `grablab_cms`, `groxy_desk`):**
   - `groxy_studio` / `grablab_cms` (GrabLab CMS `v1.0.1` & planned `v1.4.0` Embedded Bestseller Radar): Query live `list_content_types` (`book`/`post`/`page`), filter `custom_fields` strictly to keys registered on that content type so CMS `validate_custom_fields` never fails with `400`, dispatch via `create_entry_draft` (`status_enforced: "draft"`), and return the verified draft-only import envelope (`status_enforced: "draft"`).
   - `groxy_studio` layout slot (Grex Theme Builder `v1.0.0`): Dispatch strictly via one-slot `POST /api/mcp/layout` (`slot`, `layout`, `actor: "groxy-ai"`, `summary`, Builder `X-CSRF-Token` — never `document` form) with `applyAiLayout` 1-click `Ctrl+Z` undo parity and canonical slot readback verification.
   - `groxy_desk` (Groxy Desk `v1.0.0` & planned `v1.1.0` WebView2 Co-Pilot): Return a signed, `rtok_res_<hex>`-consumed draft-only import receipt (`status_enforced: "draft"`, `human_confirmation_required: true`) without modifying frozen `v1.0.0` Desk binaries or auto-publishing.
   - Transition downstream failures to terminal `dispatch_failed` so tokens are never reusable.
7. **`C7` — XSS-Safe `schema.org/Book` JSON-LD Preview:** Escape `</script>`, `<`, `>`, `&`, `U+2028`, and `U+2029` in all Bestseller Radar `schema.org/Book` JSON-LD previews with exact `ADR-025c` `offers.price` strings.
8. **`C8` — Pure `Grex JS v1.0.0` Research & Radar Studio Panel (`/groxy`):** Maintain `divCount === 0`, `innerHTMLWriteCount === 0`, zero `eval()` / `new Function()`, live `--grex-*` / `.grex-c-*` token reuse (`GET /api/design-system.md`), keyboard navigation (`Enter`/`Space`), `<dialog>` `Escape` & focus restoration, and Light/Dark WCAG AA `>= 4.5:1` (`auditAccessibility()` 100% pass).

### 11.3 Verdict

**`PASS`.** `SPEC-180` aligns 100% with frozen **GRAB `v1.1.0`**, **Grex JS `v1.0.0`**, **GrabLab CMS `v1.0.1`** (and planned `v1.4.0`), **Grex Theme Builder `v1.0.0`**, **Gashboard `v1.0.0`**, **Groxy Desk `v1.0.0`** (and planned `v1.1.0`), and **Plotific Press** contracts with **zero upstream code changes required**, subject to Stage 3 implementing Binding Conditions `C1–C8` and all Section 9 acceptance gates.
