# HANDOFF.md — Groxy AI

- **Current Owner:** OpenAI Codex (implementation and verification complete; release promotion pending authenticated GitHub access)
- **Current Milestone State:** `v1.0.0` and `v1.1.0` remain complete and frozen. The owner approved [`GROXY-AI-SPEC-120.md`](specifications/GROXY-AI-SPEC-120.md) as written on 2026-11-15. `v1.2.0` implementation and all local verification gates are complete; synchronized origin/stable pushes and GitHub Releases remain pending because the configured `gh` credential is invalid.
- **Next Milestone:** Finish authenticated `v1.2.0` origin + stable promotion and publish both matching releases with all three assets.

---

## Frozen Upstream Contracts (Unmodified)
- **GRAB:** `v1.1.0` (`urbanspress/grab`)
- **Grex JS:** `v1.0.0` (`urbanspress/grex-js`)
- **GrabLab CMS:** `v1.0.1` (`urbanspress/grablab-cms`)
- **Grex Theme Builder:** `v1.0.0` (`urbanspress/grex-builder`)

## `v1.2.0` Implementation & Verification Checkpoint
- **Specification:** [`specifications/GROXY-AI-SPEC-120.md`](specifications/GROXY-AI-SPEC-120.md) — explicitly approved by the project owner as written on 2026-11-15.
- **Scope:** 8–10 question Brand DNA wizard (`POST /api/groxy/brand-dna/wizard`, `GET /api/groxy/brand-dna`), confined `storage/BRAND-DNA.md` and `storage/brand-dna.v1.json`, portable Site DNA `brand_dna`, plus deterministic/local Ollama/allowlisted BYOK batches of 1–40 posts or products (`POST /api/groxy/batch-create`, `/apply`).
- **Safety contract:** Every staged item must pass the 22-rule four-pillar audit at `>=90` Grade A/A+, preserve exact `ADR-025c` decimal strings, and contain no wrapper `<div>` or `innerHTML` writes. Batch apply requires CSRF and a single-use token bound to `{ batch_id, item_count, batch_sha256 }`; all CMS dispatches use `create_entry_draft` with `status_enforced: "draft"`.
- **Implemented:** Added the ten-step semantic wizard and campaign studio, revisioned storage and Site DNA round-trip, exact-price product schema, deterministic/Ollama/BYOK generation paths, duplicate avoidance, audited staging, and target-bound single-use CMS draft approval. Version metadata and new tests are synchronized at `1.2.0`.
- **Verified:** `grab check --platform-config grab.platform.json src/groxy.grab` passes; canonical `grab format` output matches the source byte-for-byte; `node --test tests/*.test.js` passes 54/54; `python tests/integration_e2e.py` passes Gates 1, 2, 3A, and live 3B including Brand DNA persistence, Site DNA export, 403 invalid-token and 409 replay rejection, and GrabLab CMS draft-only creation. All eight sibling repositories are clean.
- **Release promotion blocker:** Implementation commit `ff381eb` is pushed to `origin/main` (`urbanspress/groxy-ai.progress`). `gh auth status` reports the configured `urbanspress` token is invalid, so the `v1.2.0` tag, `stable/main` push, and matching GitHub Releases with assets remain pending. Re-authenticate GitHub CLI before completing synchronized publication. The pre-existing untracked `playbook/genres/` folder is preserved and excluded from release staging.
- **Frozen scope:** Keep `v1.0.0` and `v1.1.0` implementation and completion records untouched.

## `v1.1.0` Completion Checkpoint
- **Approved specification:** [`specifications/GROXY-AI-SPEC-110.md`](specifications/GROXY-AI-SPEC-110.md) - owner approved as written on 2026-11-15.
- **Implemented:** Added magic-byte PNG/JPEG/WebP validation, the 5 MiB cap, bounded base64 decoding and hex input, `GRAB-E401` reference path checks, exact numeric wire checks, deterministic palette repair, local Ollama fallback, allowlisted BYOK checks, Grex compilation, target-bound `vtok_*` staging/apply routes, and the Screenshot-to-Grex dashboard panel.
- **Verified:** `grab check --platform-config grab.platform.json src/groxy.grab` and canonical `grab format` byte-for-byte comparison pass; `node --test tests/*.test.js` passes 45/45; `python tests/integration_e2e.py` passes Gates 1, 2, 3A, and live 3B against GRAB, GrabLab CMS, Grex Theme Builder, and Groxy AI v1.1.0. All eight sibling repositories report clean status.
- **Released:** Generated `docs/releases/pdf/Groxy-AI-v1.1.0-Guide.pdf`, `dist/groxy-ai-v1.1.0-bundle.zip`, and `dist/SHA256SUMS.txt`; synchronized ecosystem snapshot and Codex handoff; committed and tagged `v1.1.0`; pushed and published matching GitHub releases on `origin` and `stable`.

---

## `v1.0.0` Completion Summary (Step 4 Complete)
1. **`specifications/GROXY-AI-SPEC-005.md` & `docs/ROADMAP.md`:** Both marked `Approved & Frozen — Complete`.
2. **Version Metadata & `v1.x` Contract Freeze:**
   - Updated service identity to `"1.0.0"` in `src/groxy.grab` (`/_health`, `/_ready`, `/api/groxy/playbook` `service_version: "1.0.0"`, `/api/groxy/mcp/inspect`), `views/dashboard.grab.html`, `README.md`, `CHANGELOG.md`, and exported `GROXY_VERSION = "1.0.0"` across all `public/groxy/*.js` and `assets/*.js` runtime modules (including `assets/booster.js` and `assets/site-context.js`).
3. **Hardened `--read-only` Container Packaging (`deploy/`):**
   - Added `deploy/docker-compose.yml` and `deploy/README.md` (`read_only: true`, `cap_drop: ["ALL"]`, `no-new-privileges:true`, `tmpfs: /tmp:rw,noexec,nosuid`, writable mounts scoped strictly to `storage/` and `cache/`, zero hardcoded secrets or private IPs) supporting standalone and `--profile ecosystem-stack` 4-layer hosting.
4. **Verification Gates (`100%` Pass):**
   - `grab check --platform-config grab.platform.json src/groxy.grab`: exit `0`
   - Non-destructive `grab format src/groxy.grab` byte-for-byte parity: exact match (`266,500` bytes)
   - `node --test tests/*.test.js`: `37/37` passing (`35` core unit/DOM/enrichment/site-intelligence tests + `2` `v1.0.0` production audit & deploy tests)
   - `python tests/integration_e2e.py`: Gates `1`, `2`, `3A` (`GRAB v1.1.0 grab mcp`), and `3B` (live **GRAB `v1.1.0` + GrabLab CMS `v1.0.1` + Grex Theme Builder `v1.0.0` + Groxy AI `v1.0.0`**) passing `100%`
5. **Release Artifacts & Ecosystem Sync:**
   - `docs/releases/pdf/Groxy-AI-v1.0.0-Guide.pdf` (`docs/releases/generate_release_guides.py 1.0.0`)
   - `dist/groxy-ai-v1.0.0-bundle.zip` (including `deploy/`) & `dist/SHA256SUMS.txt` (`scripts/package_release.py 1.0.0`)
   - Synchronized `v1.0.0` tags & GitHub Releases published on both `urbanspress/groxy-ai.progress` (`origin`) and `urbanspress/groxy-ai.stable` (`stable`)
   - `C:\Development\GRAB\docs\ROADMAP.md` and `C:\Development\GRAB\AGENTS.md` updated to mark Step 4 `Complete` and Step 5 `Next Active Milestone`, plus `C:\Development\ECOSYSTEM-SNAPSHOT.md` refreshed via `sync-notebook-sources.ps1`

---

## `v0.4.0` Completion Summary
1. **`specifications/GROXY-AI-SPEC-004.md` & `docs/ROADMAP.md`:** Both marked `Complete`.
2. **Core Implementation Verified (`100%` pass):**
   - `grab check --platform-config grab.platform.json src/groxy.grab`: exit `0`
   - Non-destructive `grab format src/groxy.grab` byte-for-byte parity: verified exact match
   - `node --test tests/*.test.js`: `35/35` passing (`unit_auditor.test.js`, `unit_booster.test.js`, `unit_enrichment.test.js`, `unit_generator.test.js`, `unit_mcp_client.test.js`, `unit_playbook.test.js`, `unit_site_intelligence.test.js`, `unit_ui_dom.test.js`) covering all 40 Style Pack × Blueprint combinations, `?goal=`/`?industry=` filtering, live `SITE-CONTEXT.md` sync with `ADR-025c` pricing, internal linking graph + strict `301` loop exclusion, XSS-safe `</script>`-escaped `schema.org` JSON-LD + `422` float rejection, Media `alt` enrichment with decorative preservation + single-use `approval_token`, Nightly Watch Morning Boost Report, Portable Site DNA export, and zero wrapper `<div>`s / zero `innerHTML` across `/groxy`
   - `python tests/integration_e2e.py`: Gates `1`, `2`, `3A` (`GRAB v1.1.0 grab mcp`), and `3B` (live **GrabLab CMS `v1.0.1` + Grex Theme Builder `v1.0.0` + Groxy AI `v0.4.0`**) passing `100%`
3. **Release Artifacts Generated:**
   - `docs/releases/pdf/Groxy-AI-v0.4.0-Guide.pdf` (`docs/releases/generate_release_guides.py 0.4.0`)
   - `dist/groxy-ai-v0.4.0-bundle.zip` & `dist/SHA256SUMS.txt` (`scripts/package_release.py 0.4.0`)

## `v0.3.0` Completion Summary
1. **`specifications/GROXY-AI-SPEC-003.md` & `docs/ROADMAP.md`:** Both marked `Complete`.
2. **Core Implementation Verified (`100%` pass):**
   - `grab check --platform-config grab.platform.json src/groxy.grab`: exit `0`
   - Non-destructive `grab format src/groxy.grab` byte-for-byte parity: verified exact match
   - `node --test tests/unit_*.test.js`: `28/28` passing (`unit_auditor.test.js`, `unit_booster.test.js`, `unit_generator.test.js`, `unit_mcp_client.test.js`, `unit_playbook.test.js`, `unit_ui_dom.test.js`) covering all 20 Style Pack × Blueprint combinations, live `GRAB-DESIGN-SYSTEM.md` tokens & `.grex-c-*` reuse, contrast repair, `ForEach` `queryLoop`, exact `ADR-025c` `GrabDecimal`/`GrabInteger` wire preservation & JS float rejection, single-use `approval_token`, and zero wrapper `<div>`s / zero `innerHTML` writes across the Visual Generator Studio UI
   - `python tests/integration_e2e.py`: Gates `1`, `2`, `3A` (`GRAB v1.1.0 grab mcp`), and `3B` (live **GrabLab CMS `v1.0.1` + Grex Theme Builder `v1.0.0` + Groxy AI `v0.3.0`** including live `GET /api/design-system.md`, `GET /api/groxy/style-packs`, `POST /api/groxy/generate-layout`, `POST /api/groxy/generate-layout/apply` -> `POST /api/mcp/layout` with `actor: "groxy-ai"`, GrabLab `status_enforced: "draft"`, `applyAiLayout` command verification, and 1-click Undo restoration) passing `100%`
3. **Release Artifacts Generated:**
   - `docs/releases/pdf/Groxy-AI-v0.3.0-Guide.pdf` (`docs/releases/generate_release_guides.py 0.3.0`)
   - `dist/groxy-ai-v0.3.0-bundle.zip` & `dist/SHA256SUMS.txt` (`scripts/package_release.py 0.3.0`)

## `v0.2.0` Completion Summary
- Opt-in Pre-Publish SEO & Performance Grade Review Gate (`POST /api/groxy/prepublish-review`) and 🚀 `"Let Groxy Boost This"` Side-by-Side Diff engine (`POST /api/groxy/boost`, `POST /api/groxy/boost/approve`), walkthrough PDF, and synchronized `origin`/`stable` `v0.2.0` releases complete.

## `v0.1.0` Completion Summary
- Core `grab mcp` bridge, curated 22-rule SEO playbook, deterministic 4-pillar auditor (`0–100`, `A+`–`F`), zero-`<div>` `/groxy` Inspector UI, walkthrough PDF, and synchronized `origin`/`stable` `v0.1.0` releases complete.

---

## Pre-`v1.0.0` 5-Layer Audit Summary (`Orchestrator (Argon)` — 100% Pass)
Completed multi-repository security, DOM, accessibility, precision, container, and contract audit across **GRAB `v1.1.0`**, **Grex JS `v1.0.0`**, **GrabLab CMS `v1.0.1`**, **Grex Theme Builder `v1.0.0`**, and **Groxy AI `v0.4.0`**:
1. **Zero Wrapper-`<div>` & Semantic DOM Compliance:** `25/25` `.grab.html` templates across all 4 UI/CMS/Builder/AI repos contain `0` `<div>` tags; `innerHTMLWriteCount === 0` and zero `eval()`/`new Function()` calls across runtime modules; `<div>`/`<script>`/`<iframe>`/unsafe URLs rejected (`F` / `<= 59`, `publish_safe: false`, HTTP `422` / `-32602`).
2. **WCAG AA Accessibility & Contrast:** All `8` Style Packs pass Light/Dark `>= 4.5:1` contrast and all `40` Style Pack × Blueprint (`8 × 5`) combinations pass `validateElementNode()`, `auditAccessibility()`, and 22-rule auditing (`>= 90`, `A`/`A+`).
3. **Exact Numeric Precision (`ADR-025c`):** Base-10 `GrabDecimal`/`GrabInteger` wire strings preserved byte-for-byte across audits, boosts, pricing grids, `SITE-CONTEXT.md`, `Site DNA`, and `schema.org` `Product` offers; raw JS floats & IEEE drift strings rejected with HTTP `422`.
4. **Human-in-the-Loop Safety (`GROXY-SAFE-001`):** `X-CSRF-Token` enforced across all `13` `POST` routes; single-use `approval_token` enforced (`403` invalid, `409` replay); `create_entry_draft` enforces `status_enforced: "draft"`; `POST /api/mcp/layout` stamps `actor: "groxy-ai"`, records undoable `applyAiLayout`, and leaves live `published` state untouched.
5. **Container & Docker Security:** Verified `--read-only` rootfs isolation (`read_only: true`, `cap_drop: ["ALL"]`, `no-new-privileges:true`, `tmpfs: /tmp:rw,noexec,nosuid`), `GRAB-E401` file guards (`.env`/`.git`/`.ssh`/`*.key`/`*.pem`/traversal), and `GRAB-E402` default-deny network & SSRF blocking (`169.254.169.254`).
6. **Ecosystem Contract Parity:** Verified `5` `grab mcp` stdio tools, `6` GrabLab CMS MCP tools, `-32602`/`422` error schemas, SHA-256 identity of 20-element `grex.elements.json` (`c54c4bcf...`) & `grex.js` (`c1e28d74...`), and live `GET /api/design-system.md` round-trip (`35/35` Groxy AI Node tests, `43/43` Grex JS tests, `24/24` Grex Builder tests, and all `integration_e2e.py` Gates `1`, `2`, `3A`, `3B` passing 100%).

---

## Planned Backwards-Compatible Minor Track (`v1.1.0` – `v1.8.0`)

- **Milestone `v1.1.0` — Screenshot-to-Grex Visual Replica (`POST /api/groxy/vision-clone`):** `Status: Approved & Frozen — Complete` ([`specifications/GROXY-AI-SPEC-110.md`](specifications/GROXY-AI-SPEC-110.md)):
  - Magic-byte-verified `PNG`/`JPEG`/`WebP` reference screenshot upload with bounded max payload limits (`5 MiB` cap, `GRAB-E401` confinement).
  - Structural hierarchy, spacing rhythm, typography scale, and palette extraction via user-configured vision model (local Ollama `llama3.2-vision`/`qwen2.5-vl` on `127.0.0.1:11434` or optional BYOK API key governed by `GRAB-E402`).
  - Compiles strictly into `Grex JS v1.0.0`'s 20 semantic components (`divCount === 0`, `innerHTMLWriteCount === 0`, WCAG AA `>= 4.5:1` Light/Dark contrast auto-repaired, `ADR-025c` exact base-10 wire strings, `GRAB-DESIGN-SYSTEM.md` `--grex-*` tokens).
  - Human-in-the-loop preview canvas + 4-pillar `A`/`A+` scorecard gated behind `X-CSRF-Token` + single-use target-bound `approval_token` (`GROXY-SAFE-001`) before dispatching to `POST /api/mcp/layout` (`actor: "groxy-ai"`, 1-click `Ctrl+Z` undo parity).
- **Milestone `v1.2.0` — 1-Time Brand DNA & Voice Setup Wizard (`BRAND-DNA.md`) & Batch Content/Product Campaign Engine (`POST /api/groxy/batch-create`):** `Status: Approved; implementation verified, release promotion pending — Backwards-Compatible Minor Feature` (zero frozen peer implementation code modified):
  - 8–10 question onboarding wizard saving `storage/BRAND-DNA.md` + `Site DNA`, powering 1-sentence batch creation of up to 40+ SEO/WCAG-audited blog posts or products with exact `ADR-025c` `GrabDecimal` prices, gated behind `create_entry_draft` (`status: "draft"`) and single-use `approval_token` (`GROXY-SAFE-001`).
- **Milestone `v1.3.0` — Autonomous Post-Purchase Email Flow Designer & Copywriter:** `Status: Planned — Backwards-Compatible Minor Feature` (zero `v1.0.0` implementation code modified):
  - Reads `BRAND-DNA.md`, `SITE-CONTEXT.md`, and `--grex-*` tokens to design multi-step post-purchase receipts, setup guides, review requests, and exact-price product cross-sell flows gated behind `GROXY-SAFE-001` approval.
- **Milestone `v1.4.0` — 5 Autonomous Storefront & Commerce AI Engines:** `Status: Planned — Backwards-Compatible Minor Feature` (zero `v1.0.0` implementation code modified):
  - **AI Abandoned-Cart & Smart Checkout Recovery (`POST /api/groxy/recovery`):** Triggered by `commerce:abandoned_checkout` with exact `ADR-025c` `GrabDecimal` math and `BRAND-DNA.md` tone.
  - **Grounded Storefront Concierge & Pre-Sale Q&A Widget:** `Grex JS` zero-wrapper-`<div>` `<dialog>`/`<aside>` strictly grounded in `SITE-CONTEXT.md` + `BRAND-DNA.md`.
  - **Dynamic Bundle & Cross-Sell Architect (`POST /api/groxy/bundles`):** Generates `ADR-025c` exact-price bundles + `GROXY-SAFE-001` Grex Theme Builder sections.
  - **Automated Review Sentiment Miner & FAQ Builder (`POST /api/groxy/reviews/mine`):** Generates `FAQPage` `schema.org` blocks + SKU alert flags.
  - **Seasonal Campaign & Flash-Sale Autopilot (`POST /api/groxy/campaigns/plan`):** Generates synchronized hero banner + landing page draft + 3-email launch sequence gated behind `GROXY-SAFE-001`.
- **Milestone `v1.5.0` — Bespoke Store Schema Quiz & Opt-In "Talk to Groxy" Database & Store Consultant:** `Status: Planned — Backwards-Compatible Minor Feature` (zero `v1.0.0` implementation code modified):
  - **Store Architecture Quiz (`POST /api/groxy/db/architect-quiz`):** Generates lean, zero-bloat `.grab` database migrations (`ADR-024f` + `ADR-025c`) tailored to the user's exact business model and dispatches to **Groxy Desk** / **Gashboard** SSH tunnels for human-approved provisioning (`GROXY-SAFE-001`).
  - **Opt-In Database & Store Consultant (`groxy_db_consultant_enabled`):** Reads live `.grab` schema, row counts, active `ForEach` Query Loops, `slug_history` redirects, and order records (`SCHEMA-CONTEXT.md` + `SITE-CONTEXT.md`) to provide honest **Impact & Risk Assessments** (*Safe / Caution / High-Risk Data Loss*) before any table/column/data change, triggering an automatic **Grabtaculous** Pre-Deploy Snapshot before applying approved adjustments.
- **Milestone `v1.6.0` — Lovable/Base44-Style Iterative Section Co-Pilot & Golden-Ratio Design-Craft Engine:** `Status: Planned — Backwards-Compatible Minor Feature` (zero `v1.0.0` implementation code modified):
  - **Targeted Section Refinement (`POST /api/groxy/section-refine`):** Conversational per-section editing inside **Grex Theme Builder** patching only the selected subtree via `POST /api/mcp/layout` (`actor: "groxy-ai"`, 1-click `Ctrl+Z` undo, `GROXY-SAFE-001` approval gate).
  - **Design-Craft & Visual Rhythm Playbook (`playbook/design-craft.v1.json`):** Enforces `8pt` spacing rhythm, `60–65ch` readable line measure, 1-primary-CTA-per-fold hierarchy, Light/Dark surface elevation (`--grex-surface-1` / `--grex-surface-2`), and automatic full-stack wiring of generated forms and `ForEach` grids to live **GrabLab CMS** content types and `ADR-025c` `GrabDecimal` product fields.
- **Milestone `v1.7.0` — Multi-Genre Storytelling Brain, Hemingway Readability Auditor & `schema.org/Book` JSON-LD Engine:** `Status: Planned — Backwards-Compatible Minor Feature` (zero `v1.0.0` implementation code modified):
  - **Genre-Specific Storytelling Playbooks (`playbook/genres/*.v1.json`):** Covers *Thriller/Mystery*, *Sci-Fi/Fantasy*, *Romance*, *Horror*, *Literary Fiction*, *Business/How-To*, *Memoir/Biography*, and *Self-Help*, enforcing proven pacing beats (*Three-Act*, *Hero's Journey*, *Save the Cat*, *Hook-Problem-Framework-Action*).
  - **Interactive Story, Genre & Audience Quiz (`POST /api/groxy/author/brief`) & Hemingway Readability Auditor:** Saves a persistent `BOOK-BIBLE.md` continuity file (`POV`, tone, character/world rules) plus Hemingway-grade readability, passive-voice, pacing, and continuity auditing (`GROXY-SAFE-001` approval-gated draft creation).
  - **Autonomous Book SEO & XSS-Safe `schema.org/Book` JSON-LD Engine:** Deterministic book SEO & XSS-safe `schema.org/Book` / `Chapter` / `Person` / `Offer` (`ADR-025c` `GrabDecimal` price & `ISBN`) JSON-LD generator.
- **Milestone `v1.8.0` — Baked-In Offline Knowledge Vault, Allowlisted Real-Time Web Research & Browser Co-Pilot:** `Status: Planned — Backwards-Compatible Minor Feature` (zero `v1.0.0` implementation code modified):
  - **Baked-In Static Reference Vault (`playbook/knowledge/*.v1.json`):** Zero-network reference datasets (Schema.org v30.1 vocabularies, WCAG AA contrast rules, country/postal formats, and offline AnswerThePublic-style question/keyword intent frameworks).
  - **Opt-In Allowlisted Real-Time Web Search (`POST /api/groxy/research/search`, `groxy_web_research_enabled`):** Enforces `GRAB-E402` outbound domain allowlisting (blocking private/loopback/metadata IPs `127.0.0.1`/`169.254.169.254`) to query user-configured self-hosted **SearXNG**, DuckDuckGo Instant Answers, Wikipedia/Wikidata, or user BYOK search APIs—returning real-time answers with source URL citations.

---

## Next Step Guidance (`Groxy AI v1.2.0`)
1. **Frozen Baselines:** Keep Groxy AI `v1.0.0` and `v1.1.0` and all upstream contracts frozen and unchanged.
2. **Current Task:** Restore a valid GitHub CLI credential, generate the final Complete walkthrough and package/checksums, then promote the verified commit/tag and matching release assets to both remotes. Keep the roadmap/spec completion state aligned with the stable-release gate.
3. **Recommended Model for Release Audit:** Use **`Orchestrator (Argon)`** for the final cross-layer security and release audit because v1.2.0 adds outbound provider handling, cryptographically bound batch approval, and draft-only CMS dispatch across frozen ecosystem contracts.
