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

**Status:** Planned — Backwards-Compatible Minor Feature

Scope:
- **1-Time Brand DNA & Voice Setup Wizard (`BRAND-DNA.md`):** 8–10 question onboarding wizard capturing brand tone, target audience, value propositions, editorial guardrails, pricing rules, and `--grex-*` visual identity, saving `storage/BRAND-DNA.md` alongside portable `Site DNA`.
- **Batch Content/Product Campaign Engine (`POST /api/groxy/batch-create`):** Powers 1-sentence batch creation of up to 40+ SEO/WCAG-audited blog posts or products with exact `ADR-025c` `GrabDecimal` prices, zero-`<div>` clean DOM, and `schema.org` JSON-LD readiness.
- **Human-in-the-Loop Safety (`GROXY-SAFE-001`):** Strictly gated behind `create_entry_draft` (`status: "draft"`) and single-use `approval_token` + `X-CSRF-Token` confirmation before persisting drafts into GrabLab CMS.

---

## `v1.3.0` — Autonomous Post-Purchase Email Flow Designer & Copywriter

**Status:** Planned — Backwards-Compatible Minor Feature

Scope:
- Reads `storage/BRAND-DNA.md`, `storage/SITE-CONTEXT.md`, and live `--grex-*` design tokens (`GET /api/design-system.md`) to design multi-step post-purchase transactional and retention flows.
- Generates branded receipt copy, onboarding/setup guides, review request sequences, and exact-price (`ADR-025c` `GrabDecimal`) product cross-sell flows paired with GrabLab CMS `email_outbox` triggers and Grex Builder `mode: "email"` templates.
- All generated sequences, subject lines, and dispatch bindings remain strictly gated behind `GROXY-SAFE-001` single-use `approval_token` review prior to activation.

---

## `v1.4.0` — 5 Autonomous Storefront & Commerce AI Engines

**Status:** Planned — Backwards-Compatible Minor Feature

Scope:
- **AI Abandoned-Cart & Smart Checkout Recovery (`POST /api/groxy/recovery`):** Triggered by GrabLab CMS `commerce:abandoned_checkout` events, drafting brand-voiced recovery sequences using `storage/BRAND-DNA.md` tone and exact `ADR-025c` `GrabDecimal` subtotal/discount math gated behind `GROXY-SAFE-001`.
- **Grounded Storefront Concierge & Pre-Sale Q&A Widget:** Zero-wrapper-`<div>` `Grex JS` semantic `<dialog>`/`<aside>` storefront assistant strictly grounded in `storage/SITE-CONTEXT.md` and `storage/BRAND-DNA.md` (zero hallucinated specs, prices, or policies).
- **Dynamic Bundle & Cross-Sell Architect (`POST /api/groxy/bundles`):** Generates exact-price (`ADR-025c` `GrabDecimal`) product bundles and complementary cross-sell Grex Theme Builder sections gated behind `GROXY-SAFE-001`.
- **Automated Review Sentiment Miner & FAQ Builder (`POST /api/groxy/reviews/mine`):** Mines verified customer feedback to propose `FAQPage` `schema.org` JSON-LD blocks and SKU-level product quality/alert flags for operator review.
- **Seasonal Campaign & Flash-Sale Autopilot (`POST /api/groxy/campaigns/plan`):** Plans synchronized hero banner updates, campaign landing page drafts (`status: "draft"`), and 3-email launch sequences strictly gated behind `GROXY-SAFE-001` single-use `approval_token` confirmation.

---

## `v1.5.0` — Bespoke Store Schema Quiz & Opt-In "Talk to Groxy" Database & Store Consultant

**Status:** Planned — Backwards-Compatible Minor Feature

Scope:
- **Store Architecture Quiz (`POST /api/groxy/db/architect-quiz`):** Generates lean, zero-bloat `.grab` database migrations (`ADR-024f` + `ADR-025c`) tailored to the operator's exact business model and dispatches approved plans to **Groxy Desk** / **Gashboard** SSH tunnels for human-approved provisioning (`GROXY-SAFE-001`).
- **Opt-In Database & Store Consultant (`groxy_db_consultant_enabled`):** Reads live `.grab` schema, row counts, active `ForEach` Query Loops, `slug_history` redirects, and order records (`SCHEMA-CONTEXT.md` + `SITE-CONTEXT.md`) to deliver plain-English **Impact & Risk Assessments** (*Safe / Caution / High-Risk Data Loss*) prior to any table, column, or data change, automatically triggering a **Grabtaculous** Pre-Deploy Snapshot before applying approved adjustments.

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

