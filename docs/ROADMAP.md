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

## `v0.4.0` — Site-Wide Internal Linking Graph, Schema.org JSON-LD & Media `alt`-Text Enrichment

**Status:** Planned

Scope:
- Site-wide link-graph crawler over `query_entries`, `list_menus`, and GrabLab `301` redirect history to surface orphan pages, redirect chains, and high-value internal anchor opportunities.
- Automated `schema.org` JSON-LD structured data builder (`Article`, `Product` with exact `GrabDecimal` price formatting, `BreadcrumbList`, `FAQPage`, `Organization`).
- Batch Media Library (`list_media`) `alt`-text and decorative-flag auditing with human-approved draft suggestions.

---

## `v1.0.0` — Production Release, Hardened `--read-only` Container Packaging & Full Ecosystem E2E Verification

**Status:** Planned

Scope:
- Full pre-`v1.0.0` second-opinion security, DOM, contract, and human-in-the-loop safety audit (`Orchestrator (Argon)`).
- Hardened `--read-only` Docker deployment manifests (`deploy/docker-compose.yml`), SemVer `v1.x` contract freeze, plain-English walkthrough PDF (`docs/releases/pdf/Groxy-AI-v1.0.0-Guide.pdf`), and synchronized `v1.0.0` promotion to `urbanspress/groxy-ai.progress` and `urbanspress/groxy-ai.stable`.
