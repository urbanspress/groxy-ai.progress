# GROXY-AI-SPEC-004: Groxy AI `v0.4.0` Site-Wide Internal Linking Graph, Schema.org JSON-LD, Media `alt`-Text Enrichment & Non-Intrusive Background Snapshot Workflows

- **Status:** Complete
- **Milestone:** `v0.4.0` — Site-Wide Internal Linking Graph, Schema.org JSON-LD, Media `alt`-Text Enrichment & Non-Intrusive Background Snapshot Workflows
- **Foundational Upstream Baselines:**
  - **GRAB:** `v1.1.0` (`grab serve --allow-scripts`, `grab check`, `grab format <file>`, `grab mcp`, `use server`, `use http`, `use json`, `use data`, `use cache`, `use crypto`, `use env`, `server.asset`)
  - **Grex JS:** `v1.0.0` (`grex.elements.json`, `validateElementNode()`, `auditAccessibility()`, signals, semantic elements, zero wrapper-`<div>` DOM)
  - **GrabLab CMS:** `v1.0.1` (`GRABLAB-SPEC-100.md` — `POST /api/auth/mcp-token`, `POST /api/mcp`, `GET /api/mcp/tools`, `POST /api/mcp/tools/{name}`, `create_entry_draft`, `update_entry_layout`, `query_entries`, `list_content_types`, `list_menus`, `list_media`, `301` redirect loop/reserved guards)
  - **Grex Theme Builder:** `v1.0.0` (`GREX-BUILDER-SPEC-100.md` — `GET /api/design-system.md`, `POST /api/mcp/layout`, `actor: "groxy-ai"`, `applyAiLayout` command-stack Undo parity, `GREX-A11Y-*`, `GREX-SCHEMA-001`, `GREX-SEC-003`/`004`)
- **Governance:** Read alongside [`GROXY-EXPERT.md`](../GROXY-EXPERT.md), [`AGENTS.md`](../AGENTS.md), [`docs/ROADMAP.md`](../docs/ROADMAP.md), [`specifications/GROXY-AI-SPEC-001.md`](GROXY-AI-SPEC-001.md), [`specifications/GROXY-AI-SPEC-002.md`](GROXY-AI-SPEC-002.md), and [`specifications/GROXY-AI-SPEC-003.md`](GROXY-AI-SPEC-003.md).

---

## 1. Purpose & `v0.4.0` Scope

**Groxy AI `v0.4.0`** elevates Groxy from single-page auditing and layout generation to **site-wide SEO intelligence, structured data, media accessibility, and quiet background site health**—all without interrupting active writers or designers and without ever auto-publishing or silently overwriting human content (`GROXY-SAFE-001`).

### Included in `v0.4.0`
1. **Expanded 8 Industry & Goal-Aware Design Style Packs (`GET /api/groxy/style-packs`):**
   - Expands the curated, zero-API-fee Design Style Pack catalog from 4 to **8 Industry & Goal-Aware Style Packs** while preserving `emerald-editorial`, `obsidian-tech`, `warm-commerce`, and `swiss-minimal` 100% backwards-compatibly.
   - Adds `local-service-trust`, `creative-studio-bold`, `creator-academy`, and `wellness-organic`, each tagged with industry & conversion-goal metadata (`lead_gen`, `ecommerce`, `editorial`, `saas`, `portfolio`) and verified WCAG AA `>= 4.5:1` Light/Dark contrast pairs.
2. **Live `SITE-CONTEXT.md` Background Sync (`POST /api/groxy/site-context/sync` & `GET /api/groxy/site-context.md`):**
   - Non-intrusively indexes live GrabLab CMS entries, categories/tags, exact `GrabDecimal`/`GrabInteger` product prices, navigation menus (`primary`, `footer`, `mobile`), and `slug_history` `301` redirects into a compact, read-only `storage/SITE-CONTEXT.md` map without interrupting active writers or designers.
3. **Site-Wide Internal Linking Graph (`POST /api/groxy/links/analyze`):**
   - Uses `SITE-CONTEXT.md` (or live site context) to detect orphan pages, compute internal link authority, suggest natural contextual internal links with descriptive anchor text, and flag broken paths or outdated `301` redirect chains/loops—never touching live copy without human approval (`GROXY-SAFE-001`).
4. **Deterministic `schema.org` JSON-LD Generator (`POST /api/groxy/schema/generate`):**
   - Generates valid, XSS-safe (`</script>`-escaped) `schema.org` JSON-LD blocks (`Article`, `BlogPosting`, `Product` with exact `GrabDecimal` price strings, `FAQPage`, `BreadcrumbList`, `WebSite`) matched to entry content and active site context.
5. **Media Library `alt`-Text Enrichment (`POST /api/groxy/media/enrich-alt`):**
   - Scans GrabLab Media Library items via `list_media` for missing or low-quality filenames-as-alt (`IMG_1234.jpg`) and generates descriptive WCAG AA `alt` text proposals (respecting `decorative: true` items) for 1-click human approval.
6. **Non-Intrusive `Groxy Nightly Watch` Digest & Portable `Site DNA` Snapshot (`POST /api/groxy/watch/run`, `GET /api/groxy/watch/digest`, `GET /api/groxy/site-dna/export`):**
   - Off-peak background audit producing a quiet **Morning Boost Report** (zero popups, zero silent edits) with 1-click **🚀 "Let Groxy Boost This"** actions, plus a portable **Site DNA** export combining `GRAB-DESIGN-SYSTEM.md` + `SITE-CONTEXT.md` + active style tokens for **Gashboard + `grabman`**.

### Deferred to Later Milestones (`v1.0.0`)
- Pre-`v1.0.0` second-opinion security, DOM, contract, and human-in-the-loop audit (`Orchestrator (Argon)`).
- Hardened `--read-only` Docker deployment manifests (`deploy/docker-compose.yml`), SemVer `v1.x` contract freeze, and `v1.0.0` synchronized `origin` + `stable` release.

---

## 2. Planned `v0.4.0` Repository Additions & Updates

```text
groxy-ai/
├── specifications/
│   └── GROXY-AI-SPEC-004.md          # This specification
├── storage/
│   └── SITE-CONTEXT.md               # Runtime-generated read-only site index (gitignored local snapshot)
├── src/
│   └── groxy.grab                    # Add /api/groxy/site-context/*, /links/analyze, /schema/generate, /media/enrich-alt, /watch/*, /site-dna/export
├── views/
│   └── dashboard.grab.html           # Add zero-<div> Site Context, Link Graph, JSON-LD, Media Alt & Morning Boost Digest panels
├── public/
│   └── groxy/
│       ├── groxy.css                 # Semantic styles for v0.4.0 panels (zero wrapper-div)
│       ├── generator.js              # Expand Style Packs from 4 -> 8 with industry & conversion-goal metadata + WCAG AA Light/Dark pairs
│       ├── site-context.js           # SITE-CONTEXT.md builder/parser, Link Graph analyzer, JSON-LD builder, Media alt & Nightly Watch engines
│       └── dashboard.js              # Interactive controls for Site Context, Link Graph, JSON-LD preview, Media alt approval & Morning Boost Report
└── tests/
    ├── unit_generator.test.js        # Expanded to all 8 Style Packs x 5 Blueprints (40 combinations) WCAG AA & GrabDecimal checks
    ├── unit_site_intelligence.test.js # SITE-CONTEXT.md sync, Link Graph (orphans/301 loops), JSON-LD (XSS escape/GrabDecimal), Media alt & Watch/Site DNA tests
    ├── unit_ui_dom.test.js           # Extended zero-<div>, zero-innerHTML & auditAccessibility() checks for all v0.4.0 UI panels
    └── integration_e2e.py            # Live 4-layer E2E: GrabLab + Grex Builder + Groxy AI v0.4.0 site-context, link graph, schema, media alt, watch & Site DNA
```

---

## 3. Expanded 8 Industry & Goal-Aware Design Style Packs (`GET /api/groxy/style-packs`)

### 3.1 Backwards-Compatible Catalog Expansion
`GET /api/groxy/style-packs` expands the curated, zero-API-fee catalog from 4 to **8** Design Style Packs. Every existing pack (`emerald-editorial`, `obsidian-tech`, `warm-commerce`, `swiss-minimal`) keeps its exact `id`, `label`, and visual tokens 100% backwards-compatible while gaining `industries` and `conversion_goals` tags.

| Style Pack ID | Label | Industries | Conversion Goals | Light & Dark WCAG AA Contrast Guarantee |
|---|---|---|---|---|
| `emerald-editorial` *(existing)* | **Emerald Editorial** | `publishing`, `media`, `b2b_content`, `nonprofit` | `["editorial", "lead_gen"]` | Light (`#FFFFFF` / `#0F172A`, `#047857`) & Dark (`#0B1220` / `#F8FAFC`, `#34D399`) verified `>= 4.5:1`. |
| `obsidian-tech` *(existing)* | **Obsidian Developer Studio** | `developer_tools`, `cloud`, `ai_infra`, `saas` | `["saas", "editorial"]` | Light (`#F8FAFC` / `#0F172A`, `#1D4ED8`) & Dark (`#090D16` / `#F1F5F9`, `#60A5FA`) verified `>= 4.5:1`. |
| `warm-commerce` *(existing)* | **Warm Precision Commerce** | `retail`, `dtc_brands`, `specialty_goods` | `["ecommerce"]` | Light (`#FFFBF5` / `#1C1917`, `#B45309`) & Dark (`#181411` / `#FAF7F2`, `#FBBF24`) verified `>= 4.5:1`. |
| `swiss-minimal` *(existing)* | **Swiss Grid Minimal** | `architecture`, `design`, `consulting`, `portfolio` | `["portfolio", "editorial"]` | Light (`#FFFFFF` / `#111827`, `#1F2937`) & Dark (`#111827` / `#F9FAFB`, `#D1D5DB`) verified `>= 4.5:1`. |
| `local-service-trust` *(new)* | **Local Service Trust** | `home_services`, `legal`, `dental_medical`, `local_trades` | `["lead_gen"]` | Light (`#F8FAFC` / `#0F172A`, `#0369A1`) & Dark (`#0F172A` / `#F8FAFC`, `#38BDF8`) verified `>= 4.5:1`. |
| `creative-studio-bold` *(new)* | **Creative Studio Bold** | `agencies`, `creative_studios`, `photography`, `video` | `["portfolio", "lead_gen"]` | Light (`#FAFAFA` / `#18181B`, `#6D28D9`) & Dark (`#121216` / `#FAFAFA`, `#C084FC`) verified `>= 4.5:1`. |
| `creator-academy` *(new)* | **Creator Academy** | `courses`, `memberships`, `newsletters`, `coaching` | `["editorial", "lead_gen", "ecommerce"]` | Light (`#FFFFFF` / `#1E293B`, `#0F766E`) & Dark (`#0F172A` / `#F1F5F9`, `#2DD4BF`) verified `>= 4.5:1`. |
| `wellness-organic` *(new)* | **Wellness Organic** | `health_wellness`, `botanical`, `hospitality`, `fitness` | `["ecommerce", "lead_gen"]` | Light (`#F7FAF7` / `#14261C`, `#15803D`) & Dark (`#0E1A14` / `#ECFDF5`, `#4ADE80`) verified `>= 4.5:1`. |

### 3.2 `GET /api/groxy/style-packs` Contract
- **Optional Query Filters:** `?goal=lead_gen` or `?industry=courses` filters returned packs deterministically while omitting filters returns all 8 packs.
- **Per-Pack Contract:** Each pack includes `id`, `label`, `description`, `industries`, `conversion_goals`, `tokens` (`--grex-*` Light & Dark maps), `contrast_report` (`light_ratio >= 4.5`, `dark_ratio >= 4.5`, `wcag_aa: true`), and `reusable_classes`.
- **Blueprint Matrix:** All **8 Style Packs × 5 Blueprints (`40` combinations)** are valid inputs to `POST /api/groxy/generate-layout` and must achieve `Grade A` / `A+` (`>= 90`), `divCount === 0`, and `wcag_aa_passed === true`.

---

## 4. Live `SITE-CONTEXT.md` Background Sync (`POST /api/groxy/site-context/sync` & `GET /api/groxy/site-context.md`)

### 4.1 Non-Intrusive Indexing Behavior
1. **Read-Only Upstream Pull:** Fetches current site data via GrabLab CMS MCP tools (`list_content_types`, `query_entries`, `list_menus`, `list_media`) and `slug_history` (`301` redirect entries) without locking or mutating any CMS entry or interrupting active editors.
2. **Exact Numeric Preservation (`ADR-025c`):** Product prices, `compare_at_price`, SKUs, and inventory counts are copied verbatim as base-10 wire strings (e.g., `"49.99"`, `"149.95"`, `"10020"`)—never coerced through `Number()` or `parseFloat()`.
3. **Atomic Compact Snapshot (`storage/SITE-CONTEXT.md`):** Writes a clean, deterministic Markdown index containing:
   - Site summary & sync timestamp (`synced_at`)
   - **Entries Index:** `id`, `content_type`, `status`, `title`, `canonical_slug`, `categories`, `tags`, `custom_fields` (with exact `GrabDecimal`/`GrabInteger` prices), and outbound internal links
   - **Navigation Menus:** `primary`, `footer`, and `mobile` menu items (`label`, `href`, `target_slug`)
   - **301 Redirect Map (`slug_history`):** `from_slug -> canonical_slug`
   - **Media Inventory Summary:** `id`, `filename`, `url`, `alt`, `decorative`

### 4.2 Endpoints
- `POST /api/groxy/site-context/sync`:
  - Requires valid `X-CSRF-Token` (`403` on missing/invalid).
  - Accepts optional `{ grablab_url, mcp_token, site_context }` (if `site_context` is supplied directly for offline/unit execution, builds `storage/SITE-CONTEXT.md` deterministically without network calls).
  - Returns `200 OK` with `{ schema_version: "0.4.0", synced_at, path: "storage/SITE-CONTEXT.md", counts: { entries, menus, media, redirects }, markdown }`.
- `GET /api/groxy/site-context.md`:
  - Read-only endpoint returning `200 OK` (`Content-Type: text/markdown; charset=utf-8`) with the latest `storage/SITE-CONTEXT.md` snapshot (or `404` / clean initial header if not yet synced).

---

## 5. Site-Wide Internal Linking Graph (`POST /api/groxy/links/analyze`)

### 5.1 Deterministic Graph & Authority Engine
Using the indexed `SITE-CONTEXT.md` (or supplied `site_context`):
1. **Directed Link Graph Construction:** Maps every entry and menu (`primary`, `footer`, `mobile`) as nodes, and every internal `Link` / anchor (`href`) as a directed edge.
2. **Orphan Page Detection:** Flags any published or draft entry with `inbound_link_count === 0` (neither linked in `primary`/`footer`/`mobile` menus nor linked from any sibling entry).
3. **Internal Link Authority Score (`0–100`):** Computes deterministic authority per page from inbound link count, menu prominence (`primary` > `footer` > `mobile` > body link), and outbound link hygiene.
4. **Contextual Internal Link Suggestions (`GROXY-LINK-001`):**
   - Matches candidate target entries by shared `categories`/`tags`, `focus_keyword`, and topic overlap.
   - Generates **descriptive anchor text** (e.g., `"Explore the Semantic Theme Builder Guide"`)—strictly forbidding vague anchors (`"click here"`, `"read more"`, `"link"`, `"here"`).
5. **Broken Path & `301` Redirect Chain / Loop Guard (`GROXY-LINK-002`):**
   - Flags outbound links pointing to non-existent slugs (`broken_internal_link`).
   - Flags outbound links pointing to a `301`-superseded `from_slug` in `slug_history` (`redirect_chain`) and resolves the canonical destination (`canonical_slug`).
   - **Loop Exclusion Invariant:** Any slug involved in a `301` cycle or self-loop is strictly excluded from suggested link targets and flagged as `redirect_loop` (`critical`).

### 5.2 `POST /api/groxy/links/analyze` Contract
- **Auth & Safety (`GROXY-SAFE-001`):** Requires `X-CSRF-Token` (`403` on missing/invalid). Strictly read-only: **never modifies live entry copy**. Applying any suggested link requires routing through `POST /api/groxy/boost` + explicit human approval (`POST /api/groxy/boost/approve`).
- **Response JSON (`200 OK`):**
  ```json
  {
    "schema_version": "0.4.0",
    "analyzed_at": "2026-11-15T00:35:00Z",
    "summary": {
      "total_pages": 12,
      "total_internal_edges": 28,
      "orphan_count": 2,
      "broken_link_count": 1,
      "redirect_chain_count": 1,
      "redirect_loop_count": 0
    },
    "orphan_pages": [],
    "broken_links": [],
    "redirect_issues": [],
    "authority_ranking": [
      { "entry_id": "1", "slug": "/getting-started", "inbound_count": 6, "in_primary_menu": true, "authority_score": 94 }
    ],
    "suggestions": [
      {
        "source_entry_id": "4",
        "source_slug": "/blog/semantic-cms-workflow",
        "target_entry_id": "9",
        "target_slug": "/guides/wcag-contrast-checklist",
        "suggested_anchor": "WCAG AA Contrast Checklist",
        "reason": "Shares tag 'accessibility' and rescues orphan page '/guides/wcag-contrast-checklist'.",
        "approval_required": true
      }
    ]
  }
  ```

---

## 6. Deterministic `schema.org` JSON-LD Generator (`POST /api/groxy/schema/generate`)

### 6.1 Supported `schema.org` Types & Exact Numeric Fidelity
Generates valid, deterministic JSON-LD `@graph` or single-type blocks matched to `entry.content_type`, `grex_layout`, and active `SITE-CONTEXT.md`:

| Schema Type | Trigger / Source | Key Fields & Invariants |
|---|---|---|
| `Article` / `BlogPosting` | `content_type` in `("post", "article", "blog")` | `@type`, `headline`, `description`, `url`, `datePublished`, `dateModified`, `author` (`Person`/`Organization`), `image`, `keywords`. |
| `Product` | `content_type === "product"` or `custom_fields.price` present | `@type: "Product"`, `name`, `description`, `sku`, `offers: { "@type": "Offer", "priceCurrency", "price": "<exact GrabDecimal string>", "availability" }`. **Strict `ADR-025c` invariant:** `offers.price` MUST remain an exact base-10 string (e.g., `"49.99"`, `"149.95"`) and never a JS float. |
| `FAQPage` | `Accordion` nodes in `grex_layout` or `faq_items` | `@type: "FAQPage"`, `mainEntity` array of `Question` / `acceptedAnswer` (`Answer`) pairs extracted deterministically. |
| `BreadcrumbList` | `SITE-CONTEXT.md` menu hierarchy + canonical slug | `@type: "BreadcrumbList"`, `itemListElement` ordered `ListItem`s (`position: 1..N`, `name`, `item`). |
| `WebSite` | Site-level metadata (`site_name`, `base_url`) | `@type: "WebSite"`, `name`, `url` (always included in `@graph` when `include_website: true`). |

### 6.2 XSS-Safe Serialization (`GREX-SEC-003`)
- Serialized JSON-LD (`script_tag_payload` and `json_ld_string`) MUST escape `<`, `>`, `&`, and `</script>` sequences (`<` → `\u003c`, `>` → `\u003e`, `&` → `\u0026`) so an adversarial entry title or description containing `</script><script>alert(1)</script>` can **never** break out of `<script type="application/ld+json">`.
- `POST /api/groxy/schema/generate` requires `X-CSRF-Token` (`403` on missing/invalid) and is strictly read-only (returns `json_ld`, `json_ld_escaped`, `types_generated`, `decimal_integrity_verified: true`, and `xss_safe: true`).

---

## 7. Media Library `alt`-Text Enrichment (`POST /api/groxy/media/enrich-alt`)

### 7.1 Low-Quality & Decorative Detection Rules (`GROXY-A11Y-002`)
Scans GrabLab Media Library items (fetched via `list_media` or supplied in `media`):
1. **Needs Enrichment:**
   - Missing or empty `alt` (`null`, `undefined`, `""`) when `decorative !== true` / `isDecorative !== true`.
   - Filename-as-alt or placeholder patterns (case-insensitive): `IMG_1234.jpg`, `DSC_0042.png`, `Screenshot 2026-...`, `image1.webp`, `photo.jpg`, `untitled.png`, or raw file extensions (`\.(jpe?g|png|webp|gif|svg|avif)$`).
2. **Decorative Respect Invariant:**
   - Items marked `decorative: true` or `isDecorative: true` are **never** rewritten with descriptive text; they are explicitly preserved as `{ alt: "", aria_hidden: "true", decorative: true, status: "decorative_preserved" }`.
3. **Deterministic WCAG AA Proposal (`3–125` chars):**
   - Synthesizes clean, descriptive `alt` text from `title`, `caption`, `category`/`folder`, referencing entry context (`SITE-CONTEXT.md`), or tokenized human-readable filename words (stripping camera prefixes/extensions), with optional local-first AI phrasing (`use_local_ai: true`).

### 7.2 1-Click Human Approval (`GROXY-SAFE-001`)
- `POST /api/groxy/media/enrich-alt` returns `proposals` with `approval_required: true` and a single-use `approval_token`—never mutating GrabLab Media Library metadata automatically.
- `POST /api/groxy/media/enrich-alt/approve` requires `X-CSRF-Token` + single-use `approval_token` (`403` invalid, `409` replay) and persists only the explicitly approved `media_id`s via GrabLab MCP.

---

## 8. Non-Intrusive `Groxy Nightly Watch` Digest & Portable `Site DNA` Snapshot

### 8.1 `Groxy Nightly Watch` (`POST /api/groxy/watch/run` & `GET /api/groxy/watch/digest`)
- **Zero-Popup, Zero-Silent-Edit Design:** Runs on demand or during off-peak schedules (`POST /api/groxy/watch/run`), refreshing `storage/SITE-CONTEXT.md`, evaluating the site-wide internal linking graph, `schema.org` coverage, and Media Library `alt` health, and writing a quiet digest.
- **Morning Boost Report (`GET /api/groxy/watch/digest`):**
  - Returns a calm, prioritized summary:
    - `site_health_score` (`0–100`) and letter grade (`A+`–`F`)
    - `counts`: `{ entries_audited, orphan_pages, broken_or_301_links, missing_schema_entries, media_missing_alt }`
    - `boost_opportunities`: actionable items with `target_id`, `category`, `plain_english`, and a 1-click **🚀 "Let Groxy Boost This"** action descriptor (`action_endpoint`, `payload_hint`, `requires_human_approval: true`).

### 8.2 Portable `Site DNA` Snapshot (`GET /api/groxy/site-dna/export`)
- Exports a single, read-only, portable **Site DNA** bundle (`application/json` or `?format=markdown` `text/markdown`) tailored for **Gashboard + `grabman`**:
  - `schema_version`: `"0.4.0"`
  - `design_system`: parsed `GRAB-DESIGN-SYSTEM.md` tokens, `.grex-c-*` classes, and Light/Dark contrast pairs
  - `active_style_pack`: active Style Pack metadata (`industries`, `conversion_goals`, `--grex-*` tokens)
  - `site_context_md`: current `storage/SITE-CONTEXT.md` snapshot
  - `nightly_watch_digest`: latest Morning Boost Report summary
  - `decimal_integrity_verified`: `true` (`ADR-025c`)

---

## 9. Zero-`<div>` Semantic UI Additions (`views/dashboard.grab.html` & `public/groxy/dashboard.js`)

All `v0.4.0` panels are rendered strictly with semantic HTML5 elements (`<section>`, `<article>`, `<header>`, `<nav>`, `<form>`, `<fieldset>`, `<label>`, `<select>`, `<input>`, `<button>`, `<output>`, `<aside>`, `<table>`, `<ul>`, `<li>`, `<pre>`, `<code>`) with **zero `<div>` elements**, **zero `innerHTML` writes**, and **100% `auditAccessibility()` pass**:
1. **Site Context & `Site DNA` Bar:** Displays last sync timestamp, indexed counts, **"Sync Site Context"** button, and **"Export Site DNA"** download/copy action.
2. **Internal Linking Graph Panel:** Lists orphan pages, `authority_ranking`, `301` redirect issues, and contextual link suggestions with **🚀 "Let Groxy Boost This"** triggers.
3. **`schema.org` JSON-LD Previewer:** Generates and displays XSS-safe `Article` / `Product` / `FAQPage` / `BreadcrumbList` / `WebSite` JSON-LD with copyable output.
4. **Media `alt`-Text Enrichment Queue:** Lists flagged media items side-by-side (`current alt` vs. `proposed alt`, plus `decorative` badge) with **"Approve Selected `alt` Text"** (`GROXY-SAFE-001`).
5. **Morning Boost Report (`Groxy Nightly Watch`):** Quiet, collapsible digest card with 1-click **🚀 "Let Groxy Boost This"** actions.

---

## 10. `v0.4.0` Acceptance & Verification Gates

`v0.4.0` is eligible for completion and synchronized `origin` + `stable` promotion **only** when **100%** of the following gates pass:
1. **GRAB CLI Static & Format Parity:**
   - `grab check --platform-config grab.platform.json src/groxy.grab` (and all `.grab` / `.grab.html` files) exits `0` with zero errors.
   - Non-destructive `grab format <file>` stdout matches every `.grab` file on disk byte-for-byte.
2. **8 Style Packs × 5 Blueprints (`40` Combinations) WCAG AA & Schema Gate (`tests/unit_generator.test.js`):**
   - Verifies all **40** combinations (`8` Style Packs × `5` Blueprints) pass `validateElementNode()`, `auditAccessibility()` (Light & Dark `>= 4.5:1`), `divCount === 0`, exact `GrabDecimal`/`GrabInteger` preservation, and 4-pillar `overall_score >= 90` (`Grade A` / `A+`, `publish_safe: true`).
3. **Site Intelligence, Linking, JSON-LD, Media `alt` & Watch Unit Tests (`tests/unit_site_intelligence.test.js`):**
   - Verifies `SITE-CONTEXT.md` sync preserves exact `GrabDecimal` prices (`"49.99"`, `"149.95"`), menus (`primary`, `footer`, `mobile`), and `slug_history` `301` redirects.
   - Verifies `POST /api/groxy/links/analyze` detects orphan pages, ranks authority, excludes `301` redirect loops/superseded slugs from suggestions, and never mutates live copy.
   - Verifies `POST /api/groxy/schema/generate` preserves exact `GrabDecimal` string `offers.price` (`ADR-025c`) and escapes `</script>` payloads (`GREX-SEC-003`).
   - Verifies `POST /api/groxy/media/enrich-alt` detects `IMG_1234.jpg` filename-as-alt, respects `decorative: true`, and enforces single-use `approval_token` (`GROXY-SAFE-001`).
   - Verifies `Groxy Nightly Watch` digest and `Site DNA` export integrity.
4. **Zero Wrapper-`<div>`, Zero `innerHTML` & WCAG AA DOM Tests (`tests/unit_ui_dom.test.js`):**
   - Verifies all `v0.4.0` UI panels (Internal Linking, Schema.org, Media `alt`, and Morning Boost Digest) in `views/dashboard.grab.html` and `public/groxy/dashboard.js` produce `divCount === 0`, `innerHTMLWriteCount === 0`, zero unsafe URLs, and `100%` `auditAccessibility()` pass.
5. **Live 4-Layer Cross-Repo E2E Integration (`python tests/integration_e2e.py`):**
   - Spins up **GRAB `v1.1.0`**, **GrabLab CMS `v1.0.1`**, **Grex Theme Builder `v1.0.0`**, and **Groxy AI `v0.4.0`** together:
     - Exercises `GET /api/groxy/style-packs` (8 packs), `POST /api/groxy/site-context/sync`, and `GET /api/groxy/site-context.md`.
     - Exercises `POST /api/groxy/links/analyze`, `POST /api/groxy/schema/generate` (`Product` + `Article` + `BreadcrumbList`), `POST /api/groxy/media/enrich-alt` (+ `/approve`), `POST /api/groxy/watch/run`, `GET /api/groxy/watch/digest`, and `GET /api/groxy/site-dna/export`.
     - Confirms zero unapproved live mutations (`GROXY-SAFE-001`) and 1-click Undo parity (`actor: "groxy-ai"`) on any human-approved layout boost.
6. **Plain-English Release Guide & Dual-Repo Promotion (upon `v0.4.0` completion):**
   - Generates `docs/releases/pdf/Groxy-AI-v0.4.0-Guide.pdf` and publishes synchronized `v0.4.0` GitHub Releases with the mandatory **Release Type & Affected Layers** + **Ecosystem Compatibility Matrix** block to `urbanspress/groxy-ai.progress` and `urbanspress/groxy-ai.stable`.
