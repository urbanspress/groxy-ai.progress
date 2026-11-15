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

**Status:** Approved target; specification in review ([`specifications/GROXY-AI-SPEC-004.md`](../specifications/GROXY-AI-SPEC-004.md))

Scope:
- **Expanded 8 Industry & Goal-Aware Design Style Packs (`GET /api/groxy/style-packs`):** Expands the curated zero-API-fee catalog from 4 to 8 packs (`emerald-editorial`, `obsidian-tech`, `warm-commerce`, `swiss-minimal`, plus `local-service-trust`, `creative-studio-bold`, `creator-academy`, and `wellness-organic`) tagged with industry & conversion-goal metadata and verified WCAG AA `>= 4.5:1` Light/Dark contrast pairs.
- **Live `SITE-CONTEXT.md` Background Sync (`POST /api/groxy/site-context/sync`, `GET /api/groxy/site-context.md`):** Non-intrusively indexes live GrabLab entries, categories/tags, exact `GrabDecimal`/`GrabInteger` product prices, navigation menus (`primary`, `footer`, `mobile`), and `slug_history` `301` redirects into a read-only `storage/SITE-CONTEXT.md` map.
- **Site-Wide Internal Linking Graph (`POST /api/groxy/links/analyze`):** Detects orphan pages, computes internal link authority, suggests contextual internal links with descriptive anchors, and flags broken paths or `301` redirect chains/loops without modifying live copy (`GROXY-SAFE-001`).
- **Deterministic `schema.org` JSON-LD Generator (`POST /api/groxy/schema/generate`):** Generates XSS-safe (`</script>`-escaped) `Article`, `BlogPosting`, `Product` (with exact `GrabDecimal` price strings), `FAQPage`, `BreadcrumbList`, and `WebSite` structured data blocks.
- **Media Library `alt`-Text Enrichment (`POST /api/groxy/media/enrich-alt`):** Scans `list_media` for missing or filename-as-alt items (`IMG_1234.jpg`) and proposes WCAG AA `alt` text (respecting `decorative: true`) for 1-click human approval.
- **Non-Intrusive `Groxy Nightly Watch` Digest & Portable `Site DNA` Snapshot (`POST /api/groxy/watch/run`, `GET /api/groxy/watch/digest`, `GET /api/groxy/site-dna/export`):** Off-peak background audit producing a quiet **Morning Boost Report** with 1-click **🚀 "Let Groxy Boost This"** actions, plus a portable **Site DNA** export for **Gashboard + `grabman`**.

---

## `v1.0.0` — Production Release, Hardened `--read-only` Container Packaging & Full Ecosystem E2E Verification

**Status:** Planned

Scope:
- Full pre-`v1.0.0` second-opinion security, DOM, contract, and human-in-the-loop safety audit (`Orchestrator (Argon)`).
- Hardened `--read-only` Docker deployment manifests (`deploy/docker-compose.yml`), SemVer `v1.x` contract freeze, plain-English walkthrough PDF (`docs/releases/pdf/Groxy-AI-v1.0.0-Guide.pdf`), and synchronized `v1.0.0` promotion to `urbanspress/groxy-ai.progress` and `urbanspress/groxy-ai.stable`.
