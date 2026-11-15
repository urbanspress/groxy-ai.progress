# GROXY-AI-SPEC-003: Groxy AI `v0.3.0` Autonomous `GRAB-DESIGN-SYSTEM.md`-Aware Visual Page & Section Generator for Grex Theme Builder

- **Status:** Specification in Review (awaiting explicit project-owner approval before writing `v0.3.0` application code)
- **Milestone:** `v0.3.0` — Autonomous `GRAB-DESIGN-SYSTEM.md`-Aware Visual Page & Section Generator for Grex Theme Builder
- **Foundational Upstream Baselines:**
  - **GRAB:** `v1.1.0` (`grab serve --allow-scripts`, `grab check`, `grab format <file>`, `grab mcp`, `use server`, `use http`, `use json`, `use data`, `use cache`, `use crypto`, `use env`, `server.asset`)
  - **Grex JS:** `v1.0.0` (`grex.elements.json`, `validateElementNode()`, `auditAccessibility()`, signals, semantic elements, zero wrapper-`<div>` DOM)
  - **GrabLab CMS:** `v1.0.1` (`GRABLAB-SPEC-100.md` — `POST /api/auth/mcp-token`, `POST /api/mcp`, `GET /api/mcp/tools`, `POST /api/mcp/tools/{name}`, `create_entry_draft`, `update_entry_layout`, `query_entries`, `list_menus`, `list_media`, `301` redirect loop/reserved guards)
  - **Grex Theme Builder:** `v1.0.0` (`GREX-BUILDER-SPEC-100.md` — `GET /api/design-system.md`, `POST /api/mcp/layout`, `actor: "groxy-ai"`, `applyAiLayout` command-stack Undo parity, `GREX-A11Y-*`, `GREX-SCHEMA-001`, `GREX-SEC-003`/`004`)
- **Governance:** Read alongside [`GROXY-EXPERT.md`](../GROXY-EXPERT.md), [`AGENTS.md`](../AGENTS.md), [`docs/ROADMAP.md`](../docs/ROADMAP.md), [`specifications/GROXY-AI-SPEC-001.md`](GROXY-AI-SPEC-001.md), and [`specifications/GROXY-AI-SPEC-002.md`](GROXY-AI-SPEC-002.md).

---

## 1. Purpose & `v0.3.0` Scope

**Groxy AI `v0.3.0`** adds an autonomous, design-system-aware **Visual Page & Section Generator** that composes complete landing pages, hero sections, `GrabDecimal`-exact pricing grids, FAQ `Accordion` sections, and dynamic `ForEach` content showcases directly for **Grex Theme Builder `v1.0.0`** and **GrabLab CMS `v1.0.1`**.

Unlike generic AI page builders that emit bloated `<div>` soup, hard-coded hex styles, or unverified HTML, `v0.3.0` reads the site's live `GRAB-DESIGN-SYSTEM.md` contract (`GET /api/design-system.md`), lets the user pick a curated **Design Style Pack** and **Page/Section Blueprint**, composes strictly from the 20 semantic `grex.elements.json` components, runs a mandatory pre-dispatch **Validation + WCAG AA + 22-Rule 4-Pillar Audit Gate** (requiring `Grade A` or `A+` and `publish_safe: true`), and stages the layout in an interactive preview requiring explicit human approval (`GROXY-SAFE-001`) before dispatching via `POST /api/mcp/layout` with `actor: "groxy-ai"` and full 1-click `Ctrl+Z` (`applyAiLayout`) Undo parity.

### Included in `v0.3.0`
1. **Live Design-System & User-Choice Style Pack Engine (`public/groxy/generator.js` & `GET /api/groxy/style-packs`):**
   - Ingests live `--grex-*` CSS custom properties, Light/Dark contrast pairs, `.grex-c-*` reusable utility classes, and conditional template slots from Grex Theme Builder's `GET /api/design-system.md`.
   - Provides curated, zero-API-fee **Design Style Packs** (`emerald-editorial`, `obsidian-tech`, `warm-commerce`, `swiss-minimal`) and **Blueprints** (`full_landing_page`, `hero_section`, `pricing_grid`, `faq_accordion`, `foreach_showcase`) so authors and designers can choose their visual aesthetic and structural layout.
2. **Autonomous Semantic Page & Section Composer (`POST /api/groxy/generate-layout` + Studio Generator UI in `views/dashboard.grab.html`):**
   - Composes full landing pages and modular sections exclusively from the 20 semantic `grex.elements.json` elements (`Section`, `Container`, `Grid`, `Stack`, `Card`, `Heading`, `Text`, `RichText`, `Link`, `Button`, `Image`, `Icon`, `Form`, `Input`, `Select`, `Tabs`, `Accordion`, `Modal`, `Nav`, `ForEach`).
   - Enforces `GREX-SCHEMA-001` (`divCount === 0`), `GREX-SEC-003`/`004` (zero `<script>`, `<iframe>`, `on*`, `innerHTML`, or unsafe URLs), and `ADR-025c` exact base-10 `GrabDecimal`/`GrabInteger` wire string preservation on all pricing tiers, counts, and SKU badges.
3. **Deterministic Pre-Dispatch Validation & 4-Pillar Audit Gate:**
   - Validates every generated layout tree against `Grex JS v1.0.0` `validateElementNode()`, `auditAccessibility()` (WCAG AA `>= 4.5:1` contrast, mandatory `Image` `alt` or `isDecorative: true`, sequential `H1`→`H2`→`H3` hierarchy, accessible interactive labels), and Groxy AI's 22-rule 4-pillar auditor (`auditor.js`), requiring `overall_grade` of `A` or `A+` (`overall_score >= 90`) and `publish_safe: true` before returning a previewable candidate.
4. **Human-in-the-Loop Preview, MCP Dispatch & 1-Click Undo Parity (`POST /api/groxy/generate-layout/apply` — `GROXY-SAFE-001`):**
   - Renders an inspectable semantic layout preview, node tree inspector, and 4-pillar scorecard inside the zero-`<div>` `/groxy` UI.
   - Requires explicit human approval (`single-use approval_token` + `X-CSRF-Token`) before dispatching the generated layout to Grex Theme Builder via `POST /api/mcp/layout` with `actor: "groxy-ai"` (recording a reversible `applyAiLayout` command on `createCommandStack` for 1-click `Ctrl+Z` Undo) and optionally saving an associated GrabLab draft via `create_entry_draft` (`status_enforced: "draft"`).

### Deferred to Later Milestones
- **Site-Wide Internal Linking Graph Crawler, `schema.org` JSON-LD Builder & Batch Media `alt`-Text Enrichment** (`v0.4.0`)
- **Pre-`v1.0.0` Security/DOM Audit, `--read-only` Docker Packaging & Walkthrough PDF** (`v1.0.0`)

---

## 2. Planned `v0.3.0` Repository Additions & Updates

```text
groxy-ai/
├── specifications/
│   └── GROXY-AI-SPEC-003.md          # This specification
├── src/
│   └── groxy.grab                    # Add /api/groxy/style-packs, /api/groxy/generate-layout, /api/groxy/generate-layout/apply
├── views/
│   └── dashboard.grab.html           # Add zero-<div> Visual Page & Section Generator Studio panel & Live Preview
├── public/
│   └── groxy/
│       ├── groxy.css                 # Semantic styles for Generator Studio, Style Pack cards & Tree Preview (zero wrapper-div)
│       ├── generator.js              # GRAB-DESIGN-SYSTEM.md-aware semantic layout composer, Style Packs & pre-dispatch validator
│       └── dashboard.js              # Generator controls, live semantic preview, 4-pillar scorecard & Apply-to-Builder workflow
└── tests/
    ├── unit_generator.test.js        # Blueprints, Style Packs, GrabDecimal pricing, validateElementNode, WCAG AA & approval tests
    ├── unit_ui_dom.test.js           # Extended zero-<div>, zero-innerHTML & auditAccessibility() checks for v0.3.0 Generator UI
    └── integration_e2e.py            # Live 4-layer E2E: design-system.md -> generate-layout -> approve -> Builder /api/mcp/layout + Undo
```

---

## 3. Live Design-System & User-Choice Style Pack Engine

### 3.1 `GRAB-DESIGN-SYSTEM.md` Token & Class Resolution
Before composing any node tree, `generator.js` parses the active `GRAB-DESIGN-SYSTEM.md` contract (fetched live from Grex Theme Builder `GET /api/design-system.md` or supplied in the request payload) via `parseDesignSystemMarkdown()`:
1. **Active `--grex-*` CSS Custom Properties:** Maps semantic surface, text, primary accent, border, radius, and spacing variables (e.g., `var(--grex-surface)`, `var(--grex-text)`, `var(--grex-primary)`, `var(--grex-space-md)`, `var(--grex-radius-md)`) directly onto generated semantic nodes instead of ad-hoc hex values.
2. **Reusable `.grex-c-*` Classes:** Applies documented `.grex-c-*` utility classes (such as `.grex-c-hero`, `.grex-c-card`, `.grex-c-btn-primary`, `.grex-c-grid-3`, `.grex-c-badge`) from the live design system contract so `GROXY-DOM-005` (`unknown_classes_used: []`) passes with `15/15` points.
3. **Contrast Pair Verification (`GROXY-A11Y-001`):** Verifies every surface/foreground token pairing against the parsed Light/Dark palette (`>= 4.5:1` normal text, `>= 3.0:1` large text) before emitting node styles.

### 3.2 Curated Zero-API-Fee Design Style Packs (`GET /api/groxy/style-packs`)
Users can select from four deterministic **Design Style Packs** that adapt cleanly to the active `GRAB-DESIGN-SYSTEM.md` tokens:
| Style Pack ID | Label | Visual Aesthetic & Token Mapping |
|---|---|---|
| `emerald-editorial` | **Emerald Editorial** | High-contrast editorial typography, generous vertical rhythm (`--grex-space-lg`), emerald primary accents (`--grex-primary`), and structured `Card` callouts. |
| `obsidian-tech` | **Obsidian Developer Studio** | Crisp technical hierarchy, high-contrast dark/light surface cards (`--grex-surface-elevated`), compact feature `Grid`s, and scannable metric badges. |
| `warm-commerce` | **Warm Precision Commerce** | Conversion-focused product & pricing hierarchy, `GrabDecimal`-exact price callouts, trust `Accordion` FAQs, and clear primary/secondary `Button` pairs. |
| `swiss-minimal` | **Swiss Grid Minimal** | Clean geometric `Grid` proportions, strong `H1`–`H3` typographic scale, restrained borders (`--grex-border`), and distraction-free reading flow. |

### 3.3 Supported Page & Section Blueprints
| Blueprint ID | Generated Semantic Structure (`grex.elements.json` Only) | Key Invariants Enforced |
|---|---|---|
| `full_landing_page` | Multi-section page combining `Nav` header, Hero `Section` (`H1` + lead `Text` + CTA `Link`/`Button` + `Image`), 3-column Value `Grid` (`Card`s), `GrabDecimal`-exact Pricing `Grid`, `ForEach` dynamic content showcase, and `Accordion` FAQ `Section`. | Single `<h1>`, sequential `<h2>`→`<h3>`, internal canonical links (`GROXY-LINK-001`/`002`), `divCount === 0`, depth `<= 10`. |
| `hero_section` | Landmark `Section` → `Container` → `Grid` with primary `Stack` (`Heading` `H1`, lead `Text`, CTA `Stack` with primary `Link` + secondary `Button`) and media `Card` (`Image` with descriptive `alt` text). | Focus keyword in `H1` + intro copy (`GROXY-SEO-002`), WCAG AA button/link labels (`GROXY-A11Y-005`). |
| `pricing_grid` | Landmark `Section` → `Container` → `Stack` (`Heading` `H2`, intro `Text`, 3-tier `Grid` of `Card` nodes with `Heading` `H3`, exact base-10 `GrabDecimal` price `Text` nodes, feature `Stack`, and action `Link`/`Button`). | Exact base-10 `GrabDecimal` / `GrabInteger` wire string preservation (`"0.00"`, `"29.00"`, `"99.50"` — zero float coercion per `ADR-025c`). |
| `faq_accordion` | Landmark `Section` → `Container` → `Stack` (`Heading` `H2`, summary `Text`, semantic `Accordion` populated with topic-aligned question `Heading` `H3` + answer `Text` items and internal canonical resource `Link`s). | Accessible interactive headers, sequential headings (`H2` → `H3`), zero skipped levels (`GROXY-A11Y-004`). |
| `foreach_showcase` | Landmark `Section` → `Container` → `Stack` (`Heading` `H2`, `ForEach` bound to a live GrabLab `content_type` collection such as `posts` or `products`, rendering a semantic `Card` template with `Image` `alt` binding, `Heading` `H3`, `Text` excerpt, and canonical `Link`). | Valid `ForEach` `source` / `itemAs` contract from `grex.elements.json`, descriptive anchor text, and `GrabDecimal` field bindings. |

---

## 4. Autonomous Semantic Composer & Pre-Dispatch Audit Gate

### 4.1 `POST /api/groxy/generate-layout` Contract
- **Auth & Safety:** Requires valid `X-CSRF-Token` (`403` on missing/invalid). Strictly non-mutating: stages the generated candidate in memory with a single-use `approval_token` and never writes to Grex Theme Builder or GrabLab CMS until human approval.
- **Request JSON:**
  ```json
  {
    "blueprint": "full_landing_page",
    "style_pack": "emerald-editorial",
    "slot": "main",
    "focus_keyword": "semantic theme builder",
    "topic_title": "Semantic Theme Builder Studio for Fast Publishing",
    "target_audience": "Editorial and product teams",
    "pricing_tiers": [
      { "name": "Starter", "price": "0.00", "billing_period": "month", "sku": "10010", "cta_label": "Start Free Draft", "cta_href": "/docs/getting-started" },
      { "name": "Studio Pro", "price": "29.00", "billing_period": "month", "sku": "10020", "cta_label": "Explore Studio Pro", "cta_href": "/pricing/studio-pro" },
      { "name": "Enterprise", "price": "149.95", "billing_period": "month", "sku": "10030", "cta_label": "Read Enterprise Guide", "cta_href": "/docs/enterprise" }
    ],
    "foreach_collection": "posts",
    "design_system_md": "...",
    "site_context": {
      "entries": [],
      "menus": [],
      "media": [],
      "slug_history": []
    },
    "use_local_ai": false
  }
  ```
- **Deterministic Pre-Dispatch Gate (executed inside `generator.js` before returning):**
  1. **Schema & Security Check (`validateElementNode`):** Every node in `candidate_layout` is verified against the 20 `grex.elements.json` types, max depth `<= 24`, zero `<div>` tags, zero `<script>`/`<iframe>`/`on*`/`innerHTML`, and safe URLs (`GREX-SCHEMA-001`, `GREX-SEC-003`/`004`).
  2. **WCAG AA Accessibility Gate (`auditAccessibility`):** Verifies `>= 4.5:1` contrast pairs, non-empty `Image` `alt` (or `isDecorative: true`), accessible `Input`/`Select`/`Button`/`Link` labels, and unbroken `H1`→`H2`→`H3` heading order (`GREX-A11Y-001`..`005`).
  3. **Exact `GrabDecimal` / `GrabInteger` Integrity Lock (`ADR-025c`):** Verifies every supplied `price`, `compare_at_price`, `sku`, and integer count string in `pricing_tiers` and `candidate_entry.custom_fields` is preserved byte-for-byte in the generated layout and companion entry metadata.
  4. **22-Rule 4-Pillar Audit Gate (`auditEntry`):** Runs the full `v0.1.0` auditor across `candidate_entry` + `candidate_layout` + `design_system_md` + `site_context`. The generator guarantees `overall_score >= 90` (`Grade A` or `A+`) and `publish_safe === true`.
- **Response JSON (`200 OK`):**
  ```json
  {
    "schema_version": "0.3.0",
    "generation_id": "gen_<hex>",
    "blueprint": "full_landing_page",
    "style_pack": "emerald-editorial",
    "slot": "main",
    "mode": "deterministic",
    "approval_required": true,
    "approval_token": "tok_<hex>",
    "validation": {
      "grex_schema_valid": true,
      "div_count": 0,
      "max_depth": 6,
      "node_count": 38,
      "wcag_aa_passed": true,
      "decimal_integrity_verified": true
    },
    "audit_report": {
      "overall_score": 96,
      "overall_grade": "A",
      "publish_safe": true,
      "categories": {
        "on_page_seo": { "score": 95, "grade": "A", "label": "On-Page SEO" },
        "content_a11y": { "score": 100, "grade": "A+", "label": "Content & WCAG Accessibility" },
        "performance_dom": { "score": 100, "grade": "A+", "label": "Performance & Clean DOM" },
        "linking_readiness": { "score": 90, "grade": "A", "label": "Off-Page / Internal Linking Readiness" }
      },
      "findings": []
    },
    "design_system_summary": {
      "tokens_applied": ["--grex-surface", "--grex-text", "--grex-primary", "--grex-space-lg", "--grex-radius-md"],
      "reusable_classes_applied": ["grex-c-hero", "grex-c-card", "grex-c-btn-primary", "grex-c-grid-3"],
      "unknown_classes_used": []
    },
    "candidate_entry": {
      "content_type": "page",
      "title": "Semantic Theme Builder Studio for Fast Publishing",
      "slug": "semantic-theme-builder-studio-fast-publishing",
      "excerpt": "Build accessible, zero-div landing pages and dynamic sections with our semantic theme builder studio, exact decimal pricing, and instant undo.",
      "custom_fields": {
        "featured_price": "29.00",
        "featured_sku": "10020"
      }
    },
    "candidate_layout": {
      "id": "root-landing-main",
      "type": "Section",
      "tag": "section",
      "props": { "className": "grex-c-hero" },
      "children": []
    }
  }
  ```

---

## 5. Human-in-the-Loop Preview, MCP Dispatch & 1-Click Undo Parity (`GROXY-SAFE-001`)

### 5.1 Zero-`<div>` Visual Generator Studio UI (`views/dashboard.grab.html` & `public/groxy/dashboard.js`)
Rendered exclusively with semantic HTML5 elements (`<section>`, `<article>`, `<header>`, `<form>`, `<fieldset>`, `<label>`, `<select>`, `<input>`, `<button>`, `<output>`, `<aside>`, `<ul>`, `<li>`) with **zero `<div>` elements** and **zero `innerHTML` writes**:
1. **Blueprint & Style Pack Selector Form:** Allows the user to select a **Blueprint** (`full_landing_page`, `hero_section`, `pricing_grid`, `faq_accordion`, `foreach_showcase`), a **Design Style Pack** (`emerald-editorial`, `obsidian-tech`, `warm-commerce`, `swiss-minimal`), target template `slot` (`main`, `hero`, `footer`), `focus_keyword`, and `GrabDecimal` pricing tiers.
2. **Live Semantic Preview & Node Tree Inspector:** Renders the generated `candidate_layout` using safe `document.createElement` DOM construction alongside node count, tree depth, applied `--grex-*` tokens, `.grex-c-*` classes, and the 4-pillar `A`/`A+` scorecard.
3. **Explicit Human Control Actions:**
   - **🎨 "Generate Preview"**: Calls `POST /api/groxy/generate-layout` and renders the staged preview without touching Grex Theme Builder or GrabLab CMS.
   - **✅ "Approve & Send to Grex Theme Builder"**: Calls `POST /api/groxy/generate-layout/apply` with the single-use `approval_token`.
   - **🗑️ "Discard Preview"**: Clears the staged candidate locally with zero network writes.

### 5.2 `POST /api/groxy/generate-layout/apply` Contract
- **Auth & Single-Use Token Verification (`GROXY-SAFE-001`):**
  - Requires valid `X-CSRF-Token` (`403` if missing/invalid).
  - Requires valid `generation_id` (`404` if unknown) and matching single-use `approval_token` (`403` if invalid, `409` if already consumed).
- **Upstream MCP Dispatch & Command-Stack Undo Parity:**
  1. When `builder_url` is provided (or configured via `mcp-client`), dispatches `{ slot, layout: candidate_layout, actor: "groxy-ai" }` to Grex Theme Builder `POST /api/mcp/layout`, which executes through `createCommandStack` as a reversible `applyAiLayout` command (`GREX-BUILDER-SPEC-100`) so designers can press `Ctrl+Z` (1-click Undo) in Grex Theme Builder at any time.
  2. When `grablab_url` and `create_draft: true` are provided, persists `candidate_entry` + `candidate_layout` to GrabLab CMS via `create_entry_draft`, enforcing `status_enforced: "draft"` (never auto-publishing live visitor traffic).
- **Response JSON (`200 OK`):**
  ```json
  {
    "schema_version": "0.3.0",
    "generation_id": "gen_<hex>",
    "approved": true,
    "actor": "groxy-ai",
    "command_stack_action": "applyAiLayout",
    "undo_available": true,
    "status_enforced": "draft",
    "builder_dispatch": {
      "dispatched": true,
      "slot": "main"
    },
    "draft_persistence": {
      "saved_as_draft": true,
      "status_enforced": "draft"
    }
  }
  ```

---

## 6. `v0.3.0` Acceptance & Verification Gates

`v0.3.0` is eligible for completion and synchronized `origin` + `stable` promotion **only** when **100%** of the following gates pass:
1. **GRAB CLI Static & Format Parity:**
   - `grab check --platform-config grab.platform.json src/groxy.grab` (and all `.grab` / `.grab.html` files) exits `0` with zero errors.
   - Non-destructive `grab format <file>` stdout matches every `.grab` file on disk byte-for-byte.
2. **Generator Unit, Schema, WCAG AA & Decimal Tests (`tests/unit_generator.test.js`):**
   - Verifies all 5 blueprints (`full_landing_page`, `hero_section`, `pricing_grid`, `faq_accordion`, `foreach_showcase`) and all 4 Style Packs (`emerald-editorial`, `obsidian-tech`, `warm-commerce`, `swiss-minimal`) compose valid `grex.elements.json` trees with `divCount === 0`, `validateElementNode()` pass, `auditAccessibility()` pass, and 4-pillar `overall_score >= 90` (`Grade A` / `A+`, `publish_safe: true`).
   - Verifies active `--grex-*` tokens and `.grex-c-*` reusable classes from `GRAB-DESIGN-SYSTEM.md` are applied with `unknown_classes_used.length === 0`.
   - Verifies exact `GrabDecimal` / `GrabInteger` wire strings (`"0.00"`, `"29.00"`, `"149.95"`, `"10020"`) remain byte-for-byte identical across all generated pricing cards and `candidate_entry.custom_fields` (`ADR-025c`).
   - Verifies `POST /api/groxy/generate-layout` never dispatches to Grex Theme Builder or GrabLab CMS until `POST /api/groxy/generate-layout/apply` is called with a valid single-use `approval_token` (`403` on invalid token, `409` on replay).
3. **Zero Wrapper-`<div>`, Zero `innerHTML` & WCAG AA DOM Tests (`tests/unit_ui_dom.test.js`):**
   - Verifies the Visual Page & Section Generator Studio UI and live preview in `views/dashboard.grab.html` and `public/groxy/dashboard.js` produce `divCount === 0`, `innerHTMLWriteCount === 0`, zero unsafe URLs, and `100%` `auditAccessibility()` pass.
4. **Live 4-Layer Cross-Repo E2E Integration (`python tests/integration_e2e.py`):**
   - Spins up **GRAB `v1.1.0`**, **GrabLab CMS `v1.0.1`**, **Grex Theme Builder `v1.0.0`**, and **Groxy AI `v0.3.0`** together:
     - Fetches live `GET /api/design-system.md` from Grex Theme Builder and `GET /api/groxy/style-packs` from Groxy AI.
     - Calls `POST /api/groxy/generate-layout` for a `full_landing_page` and `pricing_grid`, verifying `overall_grade` in `("A", "A+")`, `publish_safe: true`, `div_count === 0`, exact `GrabDecimal` prices, and zero premature mutations on Grex Theme Builder (`GET /api/studio/commands`) or GrabLab CMS (`query_entries`).
     - Calls `POST /api/groxy/generate-layout/apply` with the single-use `approval_token` (and verifies replay returns `409`), confirming Grex Theme Builder receives `POST /api/mcp/layout` with `actor: "groxy-ai"`, records `applyAiLayout` on the command stack with 1-click Undo parity, and GrabLab CMS stores any paired entry strictly as `status: "draft"`.
5. **Plain-English Release Guide & Dual-Repo Promotion (upon `v0.3.0` completion):**
   - Generates `docs/releases/pdf/Groxy-AI-v0.3.0-Guide.pdf` and publishes synchronized `v0.3.0` GitHub Releases with the mandatory **Release Type & Affected Layers** + **Ecosystem Compatibility Matrix** block to `urbanspress/groxy-ai.progress` and `urbanspress/groxy-ai.stable`.
