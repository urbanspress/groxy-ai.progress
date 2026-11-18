# Groxy AI Roadmap

**Repositories:** `urbanspress/groxy-ai.progress` (active development) / `urbanspress/groxy-ai.stable` (verified releases)  
**Foundational Baselines:** **GRAB `v1.1.0`**, **Grex JS `v1.0.0`**, **GrabLab CMS `v1.0.1`**, and **Grex Theme Builder `v1.0.0`**

**Status Labels:**
- **Specification in Review** — Specification drafted and awaiting explicit project-owner approval before application code is written.
- **Approved** — Authorized by the project owner for implementation.
- **Complete** — Implemented, `grab check` / `grab format` clean, 100% unit/DOM/accessibility/E2E tests passing, walkthrough PDF generated, and synchronized to `origin` + `stable`.
- **Planned** — Future milestone awaiting prior milestone completion and spec drafting.

---

## `v0.1.0` — Core `grab mcp` Client, Curated SEO Reasoning Playbook & Deterministic Auditor

**Status:** Complete ([`specifications/GROXY-AI-SPEC-001.md`](../specifications/GROXY-AI-SPEC-001.md))

Scope:
- **Unified `grab mcp` & Builder Contract Bridge:** Native GRAB + JS adapter connecting to GrabLab CMS `v1.0.1` (`POST /api/mcp`, `GET /api/mcp/tools`, `POST /api/mcp/tools/{name}` for `list_content_types`, `query_entries`, `create_entry_draft`, `update_entry_layout`, `list_media`, `list_menus`), Grex Theme Builder `v1.0.0` (`GET /api/design-system.md`, `POST /api/mcp/layout` with `actor: "groxy-ai"`), and GRAB's stdio `grab mcp` tools (`grab_check`, `grab_format`, `grab_inspect_routes`, `grab_inspect_schema`, `grab_scaffold`).
- **Curated SEO Knowledge & Reasoning Playbook (`playbook/seo-playbook.v1.json`):** Versioned, inspectable rulebook distilled from **Semrush**, **Ahrefs**, and **Google Search Central** best practices (search intent, title/meta optimization, semantic heading structure, `301` redirect awareness, internal anchor integrity, and WCAG AA accessibility).
- **Deterministic 4-Pillar Auditor (`0–100` & `A+`–`F`):** Reproducible offline/online scoring engine evaluating **On-Page SEO**, **Content & WCAG Accessibility**, **Performance & Clean DOM** (zero wrapper `<div>`s + `GRAB-DESIGN-SYSTEM.md` token/class alignment), and **Off-Page / Internal Linking Readiness**, plus a zero-`<div>` Groxy Audit Inspector UI (`/groxy`).

---

## `v0.2.0` — Pre-Publish Grade Review Gate (`A+`–`F` / `0–100`) & 🚀 "Let Groxy Boost This" Side-by-Side Diff Engine

**Status:** Complete ([`specifications/GROXY-AI-SPEC-002.md`](../specifications/GROXY-AI-SPEC-002.md))

Scope:
- Wire Groxy AI's `0–100` / `A+`–`F` audit report and fix generator directly into **GrabLab CMS `v1.1.0`**'s `groxy_assist_enabled` Pre-Publish Grade Review Gate.
- Build the **🚀 "Let Groxy Boost This"** non-destructive optimization engine: generates improved SEO titles, meta descriptions, semantic headings, missing image `alt` text, and `GRAB-DESIGN-SYSTEM.md`-compliant layout improvements using optional cost-free local models (Ollama / OpenCode) or deterministic rules.
- Present an explicit side-by-side before/after diff + refreshed grade breakdown so authors always review and click **"Approve & Make This Live"** before publication.

---

## `v0.3.0` — Autonomous `GRAB-DESIGN-SYSTEM.md`-Aware Visual Page & Section Generator

**Status:** Complete ([`specifications/GROXY-AI-SPEC-003.md`](../specifications/GROXY-AI-SPEC-003.md))

Scope:
- Composes complete landing pages, hero sections, pricing grids (`GrabDecimal`-exact), FAQs (`Accordion`), and dynamic query showcases (`ForEach`) purely from the 20 semantic `grex.elements.json` components with curated, zero-API-fee Design Style Packs.
- Reads live `--grex-*` tokens and `.grex-c-*` utility classes from `GET /api/design-system.md`, validates every generated tree against `validateElementNode()`, `auditAccessibility()`, and the 22-rule 4-pillar auditor (`Grade A/A+`, `publish_safe: true`), and dispatches human-approved layouts (`GROXY-SAFE-001`) via `POST /api/mcp/layout` (`actor: "groxy-ai"`) with full 1-click `Ctrl+Z` Undo parity in Grex Theme Builder.

---

## `v0.4.0` — Site-Wide Internal Linking Graph, Schema.org JSON-LD, Media `alt`-Text Enrichment & Non-Intrusive Background Snapshot Workflows

**Status:** Complete ([`specifications/GROXY-AI-SPEC-004.md`](../specifications/GROXY-AI-SPEC-004.md))

Scope:
- **Expanded 8 Industry & Goal-Aware Design Style Packs (`GET /api/groxy/style-packs`):** Expands the curated zero-API-fee catalog from 4 to 8 packs (`emerald-editorial`, `obsidian-tech`, `warm-commerce`, `swiss-minimal`, plus `local-service-trust`, `creative-studio-bold`, `creator-academy`, and `wellness-organic`) tagged with industry & conversion-goal metadata and verified WCAG AA `>= 4.5:1` Light/Dark contrast pairs.
- **Live `SITE-CONTEXT.md` Background Sync (`POST /api/groxy/site-context/sync`, `GET /api/groxy/site-context.md`):** Non-intrusively indexes live GrabLab entries, categories/tags, exact `GrabDecimal`/`GrabInteger` product prices, navigation menus (`primary`, `footer`, `mobile`), and `slug_history` `301` redirects into a read-only `storage/SITE-CONTEXT.md` map.
- **Site-Wide Internal Linking Graph (`POST /api/groxy/links/analyze`):** Detects orphan pages, computes internal link authority, suggests contextual internal links with descriptive anchors, and flags broken paths or `301` redirect chains/loops without modifying live copy (`GROXY-SAFE-001`).
- **Deterministic `schema.org` JSON-LD Generator (`POST /api/groxy/schema/generate`):** Generates XSS-safe (`</script>`-escaped) `Article`, `BlogPosting`, `Product` (with exact `GrabDecimal` price strings), `FAQPage`, `BreadcrumbList`, and `WebSite` structured data blocks.
- **Media Library `alt`-Text Enrichment (`POST /api/groxy/media/enrich-alt`):** Scans `list_media` for missing or filename-as-alt items (`IMG_1234.jpg`) and proposes WCAG AA `alt` text (respecting `decorative: true`) for 1-click human approval.
- **Non-Intrusive `Groxy Nightly Watch` Digest & Portable `Site DNA` Snapshot (`POST /api/groxy/watch/run`, `GET /api/groxy/watch/digest`, `GET /api/groxy/site-dna/export`):** Off-peak background audit producing a quiet **Morning Boost Report** with 1-click **🚀 "Let Groxy Boost This"** actions, plus a portable **Site DNA** export for **Gashboard + `grabman`**.

---

## `v1.0.0` — Production Release, Hardened `--read-only` Container Packaging & Full Ecosystem E2E Verification

**Status:** Approved & Frozen — Complete ([`specifications/GROXY-AI-SPEC-005.md`](../specifications/GROXY-AI-SPEC-005.md))

Scope:
- Full pre-`v1.0.0` second-opinion security, DOM, contract, and human-in-the-loop safety audit (`Orchestrator (Argon)` — **100% Complete** across all 5 ecosystem layers).
- Hardened `--read-only` Docker deployment manifests (`deploy/docker-compose.yml` & `deploy/README.md`), SemVer `v1.x` contract freeze, plain-English walkthrough PDF (`docs/releases/pdf/Groxy-AI-v1.0.0-Guide.pdf`), and synchronized `v1.0.0` promotion to `urbanspress/groxy-ai.progress` and `urbanspress/groxy-ai.stable`.

---

## `v1.1.0` — Screenshot-to-Grex Visual Replica (`POST /api/groxy/vision-clone`)

**Status:** Approved & Frozen — Complete ([`specifications/GROXY-AI-SPEC-110.md`](../specifications/GROXY-AI-SPEC-110.md))

Scope:
- Accepts user-uploaded reference screenshots (`PNG` / `JPEG` / `WebP` verified strictly via magic bytes + bounded max file size caps under `GRAB-E401` confinement).
- Extracts structural hierarchy, spacing rhythm, typography scale, and color tokens via a configured vision model (local **Ollama** `llama3.2-vision` / `qwen2.5-vl` on `127.0.0.1:11434` with zero mandatory cloud API fees, or optional user-supplied BYOK API key governed by `GRAB-E402`).
- Compiles a clean, zero-wrapper-`<div>` **`Grex JS v1.0.0`** layout (`divCount === 0`, `innerHTMLWriteCount === 0`, WCAG AA `>= 4.5:1` Light/Dark contrast auto-repaired, `ADR-025c` exact base-10 wire strings preserved, `GRAB-DESIGN-SYSTEM.md` `--grex-*` tokens & `.grex-c-*` classes applied).
- Human-in-the-loop preview canvas + 4-pillar `A`/`A+` scorecard gated behind `X-CSRF-Token` + single-use target-bound `approval_token` (`GROXY-SAFE-001`) before dispatching to Grex Theme Builder via `POST /api/mcp/layout` (`actor: "groxy-ai"` with 1-click `Ctrl+Z` Undo parity).
- **Verification & Release:** `grab check` and byte-for-byte `grab format` pass; Node tests `45/45`; integration Gates 1, 2, 3A, and live cross-layer 3B pass 100%. The walkthrough PDF, bundle, and checksums are generated and synchronized to both release repositories.

---

## `v1.2.0` — 1-Time Brand DNA & Voice Setup Wizard (`BRAND-DNA.md`) & Batch Content/Product Campaign Engine (`POST /api/groxy/batch-create`)

**Status:** Approved & Frozen — Complete — Backwards-Compatible Minor Feature ([`specifications/GROXY-AI-SPEC-120.md`](../specifications/GROXY-AI-SPEC-120.md))

Scope:
- **1-Time Brand DNA & Voice Setup Wizard (`POST /api/groxy/brand-dna/wizard`, `GET /api/groxy/brand-dna`):** Accessible 8–10 question zero-`<div>` Grex JS wizard capturing business identity/niche, audience and pain points, geography/local SEO, voice sliders/pills, forbidden buzzwords, CTAs, offer/pricing rules, guarantees, and linked Design Style Pack / `GRAB-DESIGN-SYSTEM.md` tokens. Persist `storage/BRAND-DNA.md` plus `storage/brand-dna.v1.json` under `GRAB-E401`; add optional `brand_dna` to `groxy-site-dna-v0.4.0` and `v1.0.0` exports.
- **Batch Content/Product Campaign Engine (`POST /api/groxy/batch-create`, `POST /api/groxy/batch-create/apply`):** Generates `1..40` posts or products from a one-sentence brief, reading Brand DNA and `SITE-CONTEXT.md` to avoid duplicate titles/slugs. Support deterministic zero-fee playbook generation, optional local Ollama (`127.0.0.1:11434`), or `GRAB-E402`-allowlisted BYOK enrichment.
- **Audit & Human Approval (`GROXY-SAFE-001`):** Pre-audit every candidate through the 22-rule, four-pillar auditor (score `>=90`, Grade A/A+), require `divCount === 0`, `innerHTMLWriteCount === 0`, exact `ADR-025c` `GrabDecimal` strings (reject JS floats with `422`), and XSS-safe Article/Product JSON-LD. Stage an immutable preview with single-use `btok_<hex>` cryptographically bound to `{ batch_id, item_count, batch_sha256 }`; apply requires `X-CSRF-Token`, returns `403` for invalid/mismatch and `409` for replay, and dispatches only via GrabLab CMS `create_entry_draft` (`status_enforced: "draft"`).
- **Acceptance Gates:** Zero-`<div>` / zero-`innerHTML`, Light/Dark WCAG AA contrast (`>=4.5:1` normal text), `GRAB-E401` confinement, exact numeric wire-string tests, token binding/replay tests, and live Gate 3B CMS draft-enforcement verification. No implementation begins before explicit owner approval of the specification.

---

## `v1.3.0` — Autonomous Post-Purchase Email Flow Designer & Copywriter

**Status:** Approved & Frozen — Complete; Backwards-Compatible Minor Feature ([`specifications/GROXY-AI-SPEC-130.md`](../specifications/GROXY-AI-SPEC-130.md)). The project owner approved SPEC-130 as written on 2026-11-16.

Scope:
- **Brand-grounded four-step designer (`POST /api/groxy/email-flows/design`):** Reads `storage/BRAND-DNA.md`, `storage/SITE-CONTEXT.md`, and live `GET /api/design-system.md` `--grex-*` tokens for Order Receipt & Welcome, Quick-Start / Setup Guide, Check-In & Review Request, and Targeted Cross-Sell / Reorder. Deterministic zero-fee templates, optional local Ollama with offline fallback, and `GRAB-E402`-allowlisted BYOK enrichment.
- **Exact values and safe templates:** Preserve `ADR-025c` `GrabDecimal` prices, discounts, and order totals as strings (`422` for JS floats); zero wrapper `<div>`s / `innerHTML` writes, Light/Dark WCAG AA `>= 4.5:1`, automatic unsubscribe placeholders and physical-address footers.
- **Preview and draft-only apply (`POST /api/groxy/email-flows/apply`):** Require `X-CSRF-Token` plus single-use `etok_<hex>` bound to `{ flow_id, step_count, flow_sha256 }`; `403` invalid/mismatch and `409` replay. Save the flow and templates through `create_entry_draft`, never send, activate triggers, or overwrite human copy. Future `email_outbox` / Builder `mode: "email"` integration requires separately available and approved upstream contracts.
- **Acceptance:** Complete. Recursive canonical `flow_sha256` parity, offline Ollama fallback, GRAB-E402 BYOK SSRF rejection, exact monetary/footer/DOM/accessibility checks, and concurrent single-winner apply (`201` + `409`) pass. `node --test tests/*.test.js` passes 61/61; `python tests/integration_e2e.py` passes Gates 1, 2, 3A, and live 3B. The CMS stores one exact-value flow draft; sending stays disabled. Frozen upstream repositories remain untouched.

---

## `v1.4.0` — 5 Autonomous Storefront & Commerce AI Engines

**Status:** Approved & Frozen — Complete — Backwards-Compatible Minor Feature ([SPEC-140](../specifications/GROXY-AI-SPEC-140.md)). The project owner approved SPEC-140 as written on 2026-11-16.

Scope:
- **Recovery (`POST /api/groxy/commerce/recovery`):** Three brand-grounded abandoned-cart email drafts with exact `ADR-025c` line prices/subtotals/discounts, unsubscribe placeholders, and physical-address footers. No assumed commerce event subscription or sending.
- **Concierge (`POST /api/groxy/commerce/concierge`):** Pre-sale answers sourced strictly from `SITE-CONTEXT.md` + `BRAND-DNA.md`, with an accessible semantic `<dialog>`/`<aside>` Grex widget configuration and explicit abstention on unknown facts.
- **Bundles (`POST /api/groxy/commerce/bundles`):** Grounded complementary SKU recommendations, exact bundle prices/savings, and ready-to-stage cross-sell sections.
- **Reviews (`POST /api/groxy/commerce/reviews-mine`):** Evidence-linked recurring objections and SKU quality alerts, XSS-safe `</script>`-escaped `FAQPage` JSON-LD, and zero-`<div>` `<details>` FAQ layouts.
- **Campaigns (`POST /api/groxy/commerce/campaign-plan`):** Coordinated hero banner, landing-page draft, and three-email launch sequence with exact promotional pricing; no live activation.
- **Shared staging (`POST /api/groxy/commerce/apply`):** Deterministic zero-fee synthesis by default, optional local Ollama/offline fallback or `GRAB-E402`-allowlisted BYOK. CSRF and single-use `ctok_<hex>` bind `{ plan_id, engine, target_slot, payload_sha256 }` through recursive canonical JSON; `403` invalid/mismatch, `409` concurrent/replay. Atomic single-winner consumption precedes Builder `POST /api/mcp/layout` (`actor: "groxy-ai"`, Ctrl+Z) and/or CMS `create_entry_draft` (`status_enforced: "draft"`); partial downstream outcomes require reconciliation.
- **Acceptance:** Complete. `grab check`, byte-for-byte canonical `grab format` for both `.grab` files, 72/72 Node tests, and live Gate 3B pass. Generated layouts and the Commerce Studio controls pass Grex schema and Light/Dark `auditAccessibility()` checks; tests cover WCAG AA contrast, zero wrapper `<div>`/`innerHTML`, dialog Escape/focus restoration, native details/keyboard controls, prompt-injection JSON escaping, hostile HTML/URL input, deterministic no-provider generation, BYOK redaction, CMS/Builder failure recovery, replay rejection, and the two-process `201`/`409` race. Prior releases and upstream repositories remain frozen; untracked `playbook/genres/` is preserved.

---

## `v1.5.0` — Bespoke Store Schema Quiz & Opt-In "Talk to Groxy" Database & Store Consultant

**Status:** Complete — Backwards-Compatible Minor Feature ([SPEC-150](../specifications/GROXY-AI-SPEC-150.md)).

Scope:
- **Store Architecture Quiz (`POST /api/groxy/db/architect-quiz`):** Generates lean, zero-bloat `.grab` database migrations (`ADR-024f` + `ADR-025c`) tailored to the operator's exact business model. Approved changes go through a verified Groxy Desk/Gashboard loopback executor or an explicitly invoked GRAB CLI maintenance script; HTTP handlers never execute DDL.
- **Opt-In Database & Store Consultant (`groxy_db_consultant_enabled`):** Reads live `.grab` schema, row counts, active `ForEach` Query Loops, `slug_history` redirects, and order records (`SCHEMA-CONTEXT.md` + `SITE-CONTEXT.md`) to deliver plain-English **Impact & Risk Assessments** (*Safe / Caution / High-Risk Data Loss*) prior to any table, column, or data change, requiring an automatic Pre-Mutation SHA-256 Snapshot (`snap_db_*`) before applying explicitly approved adjustments.
- **Review contract:** SPEC-150 defines `/api/groxy/db/consult` and `/api/groxy/db/apply`, read-only opt-in inspection, recursive canonical `payload_sha256`, `dtok_<hex>` bound to plan/migration/payload/target, CSRF, atomic `201`/`409` consumption, exact decimal columns, offline deterministic rules and optional Ollama/BYOK. A `maintenance_ready` receipt means the signed migration awaits explicit CLI execution; only a verified executor receipt/readback may claim `applied`. Section 9 requires full static, DOM/WCAG, injection, snapshot/recovery and live Gate 3B verification before completion.

---

## `v1.6.0` — Lovable/Base44-Style Iterative Section Co-Pilot & Golden-Ratio Design-Craft Engine

**Status:** Approved & Frozen — Complete — Backwards-Compatible Minor Feature ([SPEC-160](../specifications/GROXY-AI-SPEC-160.md)). Owner-approved on 2026-11-16; Stage 2 Pre-Implementation Cross-Layer Security & Contract Audit `PASS` (Section 11, Conditions C1–C8); implemented and verified 100% across all Section 9 gates (`grab check`, byte-for-byte `grab format`, `87/87` Node unit/DOM tests, and live 4-layer Gate 3B with `release-ready: True`) on 2026-11-17.

Scope:
- **Targeted Section Refinement (`POST /api/groxy/section-refine` & `POST /api/groxy/section-refine/apply`):** Conversational per-section editing inside **Grex Theme Builder** patching only the selected subtree via one-slot `POST /api/mcp/layout` (`actor: "groxy-ai"`, 1-click `Ctrl+Z` `applyAiLayout` undo, `GROXY-SAFE-001` single-use `rtok_<hex>` ledger, full-slot drift `409`, and two-worker `201`/`409` single-winner atomicity).
- **Design-Craft & Visual Rhythm Playbook (`playbook/design-craft.v1.json`):** Enforces `8pt` spacing rhythm (`4pt` tight inline pairs), `60–65ch` readable line measure, 1-primary-CTA-per-fold hierarchy, Light/Dark surface elevation (`--grex-surface-1` / `--grex-surface-2`, reporting `token_unavailable` per `C4`), dual-theme WCAG AA `>= 4.5:1` auto-contrast repair (`C6`), and automatic full-stack wiring of generated forms and `ForEach` grids to live **GrabLab CMS** content types and `ADR-025c` `GrabDecimal` product fields without fabricating form `action` URLs (`C7`).

---

## `v1.7.0` — Multi-Genre Storytelling Brain, Hemingway Readability Auditor & `schema.org/Book` JSON-LD Engine

**Status:** Approved & Frozen — Complete ([`specifications/GROXY-AI-SPEC-170.md`](../specifications/GROXY-AI-SPEC-170.md)) — Backwards-Compatible Minor Feature. Owner-approved on 2026-11-17; Stage 2 Cross-Layer Audit `PASS` (`C1–C8`); implemented and verified 100% across all Section 9 gates (`grab check`, byte-for-byte `grab format`, `94/94` Node unit/DOM tests, and live 4-layer Gate 3B with `release-ready: True`) on 2026-11-17.

Scope:
- **Multi-Genre Storytelling Playbook Registry (`playbook/genres/*.v1.json`) & Reusable Agent Skill (`.agents/skills/genre-research/SKILL.md`):** Fail-closed `groxy-genre-playbook-v1.0` schema loader covering *Urban Fiction*, *Thriller/Mystery*, *Romance*, *Sci-Fi/Fantasy*, *Self-Help/Re-Entry*, and *True Crime*, enforcing exact `ADR-025c` base-10 `GrabDecimal` pricing tiers (`"0.00"`, `"2.99"`, `"4.99"`, `"9.99"`, `"14.99"`—rejecting JS floats with `422`) and zero inline HTML/XSS (`divCount === 0`, `</script>`-safe).
- **Author Mode Co-Writer & Chapter/Blurb Generator (`POST /api/groxy/author/generate` & `POST /api/groxy/author/apply`):** Reads `storage/BRAND-DNA.md`, `storage/SITE-CONTEXT.md`, and `playbook/genres/<slug>.v1.json` to generate chapter outlines (with end-of-chapter cliffhanger hooks), chapter drafts, back-cover conversion blurbs, and series reading-order grids (deterministic offline default + optional local Ollama `127.0.0.1:11434` fallback or `GRAB-E402` allowlisted BYOK). Stages recursive canonical `payload_sha256` + single-use target-bound `atok_<hex>` tokens (`X-CSRF-Token` + atomic single-winner `201`/`403`/`409`) dispatching strictly as drafts to GrabLab CMS (`create_entry_draft`, `status_enforced: "draft"`) and/or one-slot Builder `POST /api/mcp/layout` (`actor: "groxy-ai"`, `Ctrl+Z` undo).
- **Hemingway Clarity & Readability Auditor (`POST /api/groxy/author/readability-audit`):** Deterministic prose analyzer scoring grade level, passive voice density, adverb clutter, complex/nested clause chains, and dialogue-to-narration pacing with line-level plain-English rewrite suggestions.
- **XSS-Safe `schema.org/Book` & `BookSeries` JSON-LD Engine + Pure `Grex JS v1.0.0` Author Studio Panel:** Emits `</script>`-escaped `schema.org/Book` / `BookSeries` JSON-LD (`bookFormat`, `isbn`, `numberOfPages`, `inLanguage`, `genre`, `typicalAgeRange`, exact `ADR-025c` `offers.price`) and renders in `/groxy` with `divCount === 0`, `innerHTMLWriteCount === 0`, keyboard accessibility, and Light/Dark WCAG AA `>= 4.5:1` contrast.

---

## `v1.8.0` — Baked-In Offline Knowledge Vault, Allowlisted Real-Time Web Research & Bestseller Radar

**Status:** Approved & Frozen — Complete ([`specifications/GROXY-AI-SPEC-180.md`](../specifications/GROXY-AI-SPEC-180.md)) — Backwards-Compatible Minor Feature. Owner-approved on 2026-11-17; Stage 2 Cross-Layer Audit `PASS` (`C1–C8`); implemented and verified 100% across all Section 9 gates (`grab check`, byte-for-byte `grab format`, `101/101` Node unit/DOM tests, and live 4-layer Gate 3B with `release-ready: True`) on 2026-11-17.

Scope:
- **Baked-In Offline Knowledge Vault (`playbook/knowledge/*.v1.json` & `POST /api/groxy/knowledge/query`):** Zero-fee, zero-network queryable vault covering SEO rules, `schema.org` types, WCAG AA patterns, conversion copywriting, and correctional-facility / direct-to-reader book publishing playbooks (`groxy-knowledge-vault-v1.0`, fail-closed validation, `ADR-025c` exact base-10 wire strings, zero inline HTML/XSS).
- **Allowlisted Real-Time Web Research & Bestseller Radar (`POST /api/groxy/research/search`, `POST /api/groxy/research/bestseller-radar`, `playbook/market/bestseller-radar.v1.json`):** Enforces `GRAB-E402` exact-origin HTTPS allowlisting (blocking loopback/private/link-local/cloud-metadata SSRF and revalidating redirects) to query public trend/book feeds and compile profit-ranked genre/book briefs with exact `ADR-025c` base-10 `GrabDecimal` price tiers (`"2.99"`, `"4.99"`, `"12.99"`, `"14.99"`, `"16.99"`—rejecting JS floats with `422`). Supports **Groxy AI Studio** (`/groxy`), **GrabLab CMS `v1.4.0` Embedded Bestseller Radar**, and **Groxy Desk `v1.1.0` WebView2 Co-Pilot** imports behind single-use target-bound `rtok_res_<hex>` approval tokens (`X-CSRF-Token` + atomic single-winner `201`/`403`/`409` race protection).
- **OAuth2 Read-Only Google Search Console (`gsc.readonly`, `AES-256-GCM` encrypted tokens):** Connects to the operator's own domain Search Console metrics (GDPR/CCPA compliant, aggregated query/impression/CTR metrics only, secrets encrypted at rest via `use crypto` `AES-256-GCM` `"v1:..."` and never leaked in responses/logs).
- **Pure `Grex JS v1.0.0` Studio Panel & Section 9 Acceptance Gates:** `divCount === 0`, `innerHTMLWriteCount === 0`, Light/Dark WCAG AA `>= 4.5:1` contrast, `grab check`, byte-for-byte `grab format`, `GRAB-E402` SSRF block tests, `AES-256-GCM` token encryption tests, `422`/`403`/`409` race tests, and live Gate 3B verification (`release-ready: True`).

---

## `v1.9.0` — SEMrush-Parity Full-Site Technical Spider, Auto-Internal-Linker & Free Bing/Common-Crawl Competitor Gap Analyzer

**Status:** Planned — Backwards-Compatible Minor Feature

Scope:
- **Full-Site Technical SEO Spider (`POST /api/groxy/spider/crawl`):** Bounded, `GRAB-E402`-governed crawler auditing status codes, canonicals, redirect chains/loops, orphan pages, duplicate titles/H1s/meta descriptions, heading hierarchy, `schema.org` coverage, image `alt`/dimension hygiene, and internal PageRank authority.
- **Contextual Auto-Internal-Linker (`POST /api/groxy/links/auto-stage`):** Generates context-aware internal link anchor diffs across draft/published entries (`GROXY-SAFE-001` single-use approval token + side-by-side human review before staging via `grab mcp`).
- **Zero-Fee Bing Webmaster & Common Crawl Competitor Gap Analyzer (`POST /api/groxy/research/competitor-gap`):** Combines `GRAB-E402`-allowlisted public Common Crawl index queries, optional read-only Bing Webmaster / `gsc.readonly` metrics, and the Baked-In Knowledge Vault (`v1.8.0`) to uncover high-intent topic, keyword, and SERP feature gaps with `ADR-025c` exact metrics and zero paid third-party SEO API subscriptions.
