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

**Status:** Approved; implementation in progress — Backwards-Compatible Minor Feature ([SPEC-150](../specifications/GROXY-AI-SPEC-150.md)).

Scope:
- **Store Architecture Quiz (`POST /api/groxy/db/architect-quiz`):** Generates lean, zero-bloat `.grab` database migrations (`ADR-024f` + `ADR-025c`) tailored to the operator's exact business model and dispatches approved plans to **Groxy Desk** / **Gashboard** SSH tunnels for human-approved provisioning (`GROXY-SAFE-001`).
- **Opt-In Database & Store Consultant (`groxy_db_consultant_enabled`):** Reads live `.grab` schema, row counts, active `ForEach` Query Loops, `slug_history` redirects, and order records (`SCHEMA-CONTEXT.md` + `SITE-CONTEXT.md`) to deliver plain-English **Impact & Risk Assessments** (*Safe / Caution / High-Risk Data Loss*) prior to any table, column, or data change, requiring an automatic Pre-Mutation SHA-256 Snapshot (`snap_db_*`) before applying explicitly approved adjustments.
- **Review contract:** SPEC-150 defines `/api/groxy/db/consult` and `/api/groxy/db/apply`, read-only opt-in inspection, recursive canonical `payload_sha256`, `dtok_<hex>` bound to plan/migration/payload/target, CSRF, atomic `201`/`409` consumption, exact decimal columns, offline deterministic rules and optional Ollama/BYOK. Section 9 requires full static, DOM/WCAG, injection, snapshot/recovery and live Gate 3B verification after owner approval.

---

## `v1.6.0` — Lovable/Base44-Style Iterative Section Co-Pilot & Golden-Ratio Design-Craft Engine

**Status:** Planned — Backwards-Compatible Minor Feature

Scope:
- **Targeted Section Refinement (`POST /api/groxy/section-refine`):** Conversational per-section editing inside **Grex Theme Builder** patching only the selected subtree via `POST /api/mcp/layout` (`actor: "groxy-ai"`, 1-click `Ctrl+Z` undo, `GROXY-SAFE-001` approval gate).
- **Design-Craft & Visual Rhythm Playbook (`playbook/design-craft.v1.json`):** Enforces `8pt` spacing rhythm, `60–65ch` readable line measure, 1-primary-CTA-per-fold hierarchy, Light/Dark surface elevation (`--grex-surface-1` / `--grex-surface-2`), and automatic full-stack wiring of generated forms and `ForEach` grids to live **GrabLab CMS** content types and `ADR-025c` `GrabDecimal` product fields.

---

## `v1.7.0` — Multi-Genre Storytelling Brain, Hemingway Readability Auditor & `schema.org/Book` JSON-LD Engine

**Status:** Planned — Backwards-Compatible Minor Feature

Scope:
- **Genre-Specific Storytelling Playbooks (`playbook/genres/*.v1.json`):** First-class genre playbooks covering *Thriller/Mystery*, *Sci-Fi/Fantasy*, *Romance*, *Horror*, *Literary Fiction*, *Business/How-To*, *Memoir/Biography*, and *Self-Help*, enforcing proven pacing beats (*Three-Act*, *Hero's Journey*, *Save the Cat*, and *Hook-Problem-Framework-Action*).
- **Interactive Story, Genre & Audience Quiz (`POST /api/groxy/author/brief`) & Hemingway Readability Auditor:** Interactive discovery quiz saving a persistent `BOOK-BIBLE.md` continuity file (`POV`, tone, character/world rules) plus deterministic Hemingway-grade readability, passive-voice, pacing, and continuity auditing (`GROXY-SAFE-001` approval-gated draft creation with `status_enforced: "draft"`).
- **Autonomous Book SEO & XSS-Safe `schema.org/Book` JSON-LD Engine:** Deterministic book landing-page SEO and XSS-safe `schema.org/Book` / `Chapter` / `Person` / `Offer` (`ADR-025c` `GrabDecimal` price & `ISBN`) JSON-LD generator.

---

## `v1.8.0` — Baked-In Offline Knowledge Vault, Allowlisted Real-Time Web Research & Browser Co-Pilot

**Status:** Planned — Backwards-Compatible Minor Feature

Scope:
- **Baked-In Static Reference Vault (`playbook/knowledge/*.v1.json`):** Zero-network reference datasets (Schema.org v30.1 vocabularies, WCAG AA contrast rules, country/postal formats, and offline AnswerThePublic-style question/keyword intent frameworks).
- **Opt-In Allowlisted Real-Time Web Search (`POST /api/groxy/research/search`, `groxy_web_research_enabled`):** Enforces `GRAB-E402` outbound domain allowlisting (blocking private/loopback/metadata IPs `127.0.0.1`/`169.254.169.254`) to query user-configured self-hosted **SearXNG**, DuckDuckGo Instant Answers, Wikipedia/Wikidata, or user BYOK search APIs—returning real-time answers with source URL citations.
- **OAuth2 Read-Only Google Search Console (`gsc.readonly`, `AES-256-GCM` encrypted tokens) + Curated Bestseller Radar Playbooks (`playbook/market/bestseller-radar.v1.json`):** Opt-in, authorized read-only query-demand intelligence and curated genre/product trends from permitted sources, with source provenance and no access-control bypass. Exact OAuth provider-scope mapping and token lifecycle are deferred to the v1.8.0 specification.
