# GROXY-AI-SPEC-001: Groxy AI `v0.1.0` Core `grab mcp` Client, SEO Playbook & Deterministic Auditor

- **Status:** Specification in Review *(Awaiting Project-Owner Approval Before Code Implementation)*
- **Milestone:** `v0.1.0` — Step 4 Foundation (Core `grab mcp` Client, Curated SEO Reasoning Playbook & Deterministic 4-Pillar Auditor)
- **Foundational Upstream Baselines:**
  - **GRAB:** `v1.1.0` (`grab serve --allow-scripts`, `grab check`, `grab format <file>`, `grab mcp`, `use server`, `use http`, `use json`, `use data`, `use cache`, `use crypto`, `use env`, `server.asset`)
  - **Grex JS:** `v1.0.0` (`grex.elements.json`, `validateElementNode()`, `auditAccessibility()`, signals, semantic elements, zero wrapper-`<div>` DOM)
  - **GrabLab CMS:** `v1.0.1` (`GRABLAB-SPEC-100.md` — `POST /api/auth/mcp-token`, `POST /api/mcp`, `GET /api/mcp/tools`, `POST /api/mcp/tools/{name}`, `/static/grex/grex.elements.json`, JSON-RPC `-32602`, `301` redirect loop/reserved guards)
  - **Grex Theme Builder:** `v1.0.0` (`GREX-BUILDER-SPEC-100.md` — `GET /api/design-system.md`, `POST /api/mcp/layout`, `actor: "groxy-ai"`, `applyAiLayout` command-stack Undo parity, `GREX-A11Y-*`, `GREX-SCHEMA-001`, `GREX-SEC-003`/`004`)
- **Governance:** Read alongside [`GROXY-EXPERT.md`](../GROXY-EXPERT.md), [`AGENTS.md`](../AGENTS.md), and [`docs/ROADMAP.md`](../docs/ROADMAP.md).

---

## 1. Purpose & `v0.1.0` Scope

**Groxy AI `v0.1.0`** establishes the deterministic reasoning, auditing, and MCP integration core for Step 4 of the Post-1.0 **GRAB Ecosystem**. Rather than wrapping an opaque paid LLM API or generating messy HTML strings, `v0.1.0` builds a strict, inspectable, **human-in-the-loop** foundation:

### Included in `v0.1.0`
1. **Unified `grab mcp` & Upstream Contract Bridge (`assets/mcp-client.js` & `src/groxy.grab`):**
   - Connects cleanly to **GrabLab CMS `v1.0.1`** (`POST /api/mcp` JSON-RPC 2.0 and `GET /api/mcp/tools` / `POST /api/mcp/tools/{name}`), **Grex Theme Builder `v1.0.0`** (`GET /api/design-system.md`, `POST /api/mcp/layout`), and native **GRAB `v1.1.0`** `grab mcp` tool schemas.
   - Parses `GRAB-DESIGN-SYSTEM.md` into structured active `--grex-*` tokens, Light/Dark palettes, `.grex-c-*` reusable utility classes, and conditional template slots.
2. **Curated SEO Knowledge & Reasoning Playbook (`playbook/seo-playbook.v1.json` & `assets/playbook.js`):**
   - Versioned, human-readable JSON playbook encoding industry best practices distilled from **Google Search Central**, **Semrush On-Page SEO Checker**, and **Ahrefs Site Audit** alongside Grex WCAG AA and clean-DOM rules (`22` deterministic checks across `4` pillars).
3. **Deterministic 4-Pillar Grading & Audit Engine (`assets/auditor.js`):**
   - Evaluates any GrabLab entry + optional Grex layout tree + optional site index (`query_entries`, `list_menus`, `list_media`) + `GRAB-DESIGN-SYSTEM.md` contract into an exact `0–100` score and `A+`–`F` letter grade across four equal pillars:
     1. **On-Page SEO** (`25` weight / `0–100` subscore)
     2. **Content & WCAG Accessibility** (`25` weight / `0–100` subscore)
     3. **Performance & Clean DOM** (`25` weight / `0–100` subscore)
     4. **Off-Page / Internal Linking Readiness** (`25` weight / `0–100` subscore)
4. **Zero-`<div>` Semantic Audit Inspector UI & GRAB HTTP Endpoints (`src/groxy.grab` & `views/dashboard.grab.html`):**
   - Lightweight `Grex JS v1.0.0` semantic UI (`GET /groxy`) and CSRF-protected JSON APIs (`/_health`, `/_ready`, `/api/groxy/playbook`, `/api/groxy/audit`, `/api/groxy/mcp/inspect`) serving cleanly under `grab serve --allow-scripts`.

### Deferred to Later Milestones
- **GrabLab CMS `v1.1.0` Pre-Publish Grade Review Gate UI & 🚀 "Let Groxy Boost This" Side-by-Side Diff Engine** (`v0.2.0`)
- **Autonomous `GRAB-DESIGN-SYSTEM.md`-Aware Visual Page & Section Generator** (`v0.3.0`)
- **Site-Wide Internal Linking Graph Crawler, `schema.org` JSON-LD Builder & Batch Media `alt`-Text Enrichment** (`v0.4.0`)
- **Pre-`v1.0.0` Audit, `--read-only` Docker Packaging & Walkthrough PDF** (`v1.0.0`)

---

## 2. Planned `v0.1.0` Repository Layout

```text
groxy-ai/
├── GROXY-EXPERT.md
├── AGENTS.md
├── HANDOFF.md
├── README.md
├── LICENSE
├── .gitignore
├── docs/
│   ├── ROADMAP.md
│   └── badges/
│       ├── built-with-grab.svg
│       └── powered-by-grex-js.svg
├── specifications/
│   └── GROXY-AI-SPEC-001.md
├── playbook/
│   └── seo-playbook.v1.json          # Curated Semrush/Ahrefs/Google Search Central + Grex rulebook
├── src/
│   └── groxy.grab                    # GRAB v1.1.0 HTTP/MCP bridge & audit service
├── views/
│   └── dashboard.grab.html           # Zero-<div> semantic Groxy Audit & Playbook Inspector shell
├── public/
│   └── groxy/
│       ├── groxy.css                 # Semantic CSS (zero wrapper-div assumptions)
│       ├── playbook.js               # Playbook loader & GRAB-DESIGN-SYSTEM.md parser
│       ├── auditor.js                # Deterministic 4-pillar 0-100 / A+-F grading engine
│       ├── mcp-client.js             # Unified grab mcp / GrabLab / Grex Builder client
│       └── dashboard.js              # Grex JS v1.0.0 reactive Inspector UI
└── tests/
    ├── unit_playbook.test.js         # Playbook schema & GRAB-DESIGN-SYSTEM.md parser tests
    ├── unit_auditor.test.js          # Deterministic 4-pillar scoring, WCAG AA, DOM & Decimal tests
    ├── unit_mcp_client.test.js       # Mocked JSON-RPC 2.0, -32602, draft & actor="groxy-ai" tests
    ├── unit_ui_dom.test.js           # Zero wrapper-<div> & zero innerHTML audit on views/dashboard.js
    └── integration_e2e.py            # Live GRAB v1.1.0 + GrabLab v1.0.1 + Grex Builder v1.0.0 E2E suite
```

---

## 3. Unified `grab mcp` Client & Upstream Contract Bridge

### 3.1 Supported Upstream Interfaces
| Target Layer | Endpoint / Transport | Tools & Actions Used in `v0.1.0` | Frozen Safety Invariant |
|---|---|---|---|
| **GrabLab CMS `v1.0.1`** | `POST /api/mcp` (JSON-RPC 2.0), `GET /api/mcp/tools`, `POST /api/mcp/tools/{name}` | `list_content_types`, `query_entries`, `create_entry_draft`, `update_entry_layout`, `list_media`, `list_menus`, plus `GET /static/grex/grex.elements.json` | Auth via `Bearer` token (`POST /api/auth/mcp-token`) or session cookie + `X-CSRF-Token`. `create_entry_draft` always enforces `status_enforced: "draft"`. Validation failures return HTTP `422` (`error: "grex_validation_failed"`) and JSON-RPC `-32602`. |
| **Grex Theme Builder `v1.0.0`** | `GET /api/design-system.md`, `POST /api/mcp/layout`, `GET /api/studio/commands`, `GET /api/revisions` | Read active `--grex-*` tokens, `.grex-c-*` classes, slots; submit candidate draft/slot layouts | Every layout submission includes `actor: "groxy-ai"`, routes through `createCommandStack` (`applyAiLayout`), never touches live published visitor traffic without human Publish, and enforces `GREX-SCHEMA-001` / `GREX-A11Y-*`. |
| **Core GRAB CLI MCP (`v1.1.0`)** | `grab mcp --workspace <dir>` (`stdio` JSON-RPC 2.0) | `grab_check`, `grab_format`, `grab_inspect_routes`, `grab_inspect_schema`, `grab_scaffold` | Strictly read-only by default (`--allow-write` opt-in only when explicitly approved), blocks `.git`/`.env`/`.ssh`/`*.key`/`*.pem` with `GRAB-E401`. |

### 3.2 SSRF, Capability & Exact Numeric Integrity
1. **Default-Deny Networking (`GRAB-E402`):** Outbound calls from `src/groxy.grab` use GRAB `use http` gated strictly by operator-supplied `--allow-net <host>` flags and explicit HTTPS/configured local origin allowlists.
2. **Exact Numeric Fidelity (`ADR-025c`):** `custom_fields` containing `decimal` or `integer` values (prices, ratings, inventory counts, IDs) MUST remain exact base-10 wire strings through MCP JSON serialization and audit inspection—never coerced through `parseFloat()` or `Number()` when rendering or diffing.
3. **`GRAB-DESIGN-SYSTEM.md` Deterministic Parser:** Parses the four frozen sections emitted by Grex Theme Builder (`--grex-*` design tokens & Light/Dark contrast pairs, `.grex-c-*` reusable class definitions, 20-element `grex.elements.json` constraints, and conditional template slots) into an immutable `DesignSystemContract` object.

---

## 4. Curated SEO Knowledge & Reasoning Playbook (`playbook/seo-playbook.v1.json`)

The playbook embeds **22 versioned, citation-backed rules** across four audit pillars so every grade deduction and future boost recommendation explains *why* it matters in plain English:

### Pillar A — On-Page SEO (`GROXY-SEO-001` .. `GROXY-SEO-008`)
| Rule ID | Benchmark Source | Deterministic Evaluation Rule | Max Points |
|---|---|---|---|
| `GROXY-SEO-001` | Google Search Central / Semrush | Title tag / `entry.title` exists and length is `30–65` characters (optimal `50–60` chars; `0` penalty inside optimal window, partial credit `30–49` or `61–70`). | `15` |
| `GROXY-SEO-002` | Semrush / Ahrefs | Target focus keyword (or inferred topic term when explicit keyword omitted) appears naturally in `title` and opening `<h1>` / first paragraph without keyword stuffing (`<= 3%` density). | `15` |
| `GROXY-SEO-003` | Google Search Central / Semrush | Meta description / `entry.excerpt` is non-empty and `120–158` characters (`<= 160` max to avoid SERP truncation). | `15` |
| `GROXY-SEO-004` | Google Search Central / GrabLab | Clean lowercase hyphenated URL `slug` (`^[a-z0-9]+(?:-[a-z0-9]+)*$`), length `<= 75` chars, zero stop-word bloat or collision with reserved prefixes (`/admin`, `/api`, `/static`, `/_health`, `/_ready`). | `10` |
| `GROXY-SEO-005` | Ahrefs / Google Search Central | Exactly one `<h1>` (`Heading` level `1`) in the primary content flow matching page search intent. | `15` |
| `GROXY-SEO-006` | Semrush / Ahrefs | Content depth & scannability: substantive editorial copy (`>= 300` words for `post` / `article` or `>= 120` words for `page` / `product`) broken up with `<h2>`/`<h3>` subheadings every `<= 350` words. | `15` |
| `GROXY-SEO-007` | Ahrefs Site Audit | Uniqueness against `query_entries` site index: no duplicate `title` or colliding `slug` across existing published/draft entries when site context is provided (full credit when standalone check shows non-generic title). | `10` |
| `GROXY-SEO-008` | GRAB `ADR-025c` / Google Merchant | Exact `GrabDecimal` / `GrabInteger` structured custom fields (e.g., product `price`, `sku`, `reading_minutes`) preserve exact base-10 string precision (`^\d+(?:\.\d+)?$`) with zero `NaN`/`float` drift. | `5` |

### Pillar B — Content & WCAG Accessibility (`GROXY-A11Y-001` .. `GROXY-A11Y-005`)
Aligned 1:1 with `Grex JS v1.0.0` `auditAccessibility()` and `GREX-BUILDER-SPEC-100`:
| Rule ID | Upstream Parity | Deterministic Evaluation Rule | Max Points |
|---|---|---|---|
| `GROXY-A11Y-001` | `GREX-A11Y-001` | Text/background color pairs (evaluated across node styles and inherited `--grex-*` tokens from `GRAB-DESIGN-SYSTEM.md`) meet WCAG AA contrast `>= 4.5:1` (`>= 3.0:1` for large text `>= 24px` or bold `>= 18.66px`). | `25` |
| `GROXY-A11Y-002` | `GREX-A11Y-002` | Every `Image` node has descriptive `alt` text (`3–125` chars, not generic `"image.jpg"`) or explicit `isDecorative: true` (`alt: ""`, `ariaHidden: "true"`). | `25` |
| `GROXY-A11Y-003` | `GREX-A11Y-003` | Every `Input` and `Select` node inside `Form`s exposes a non-empty `label` or `aria-label`. | `15` |
| `GROXY-A11Y-004` | `GREX-A11Y-004` | Heading levels (`<h1>` → `<h2>` → `<h3>`…) progress sequentially with zero skipped heading levels. | `20` |
| `GROXY-A11Y-005` | `GREX-A11Y-005` | Every `Button` and `Link` has accessible non-empty text (or `aria-label`) and never strips `:focus` / `:focus-visible` outlines (`outline: none` / `0` rejected). | `15` |

### Pillar C — Performance & Clean DOM (`GROXY-DOM-001` .. `GROXY-DOM-005`)
| Rule ID | Upstream Parity | Deterministic Evaluation Rule | Max Points |
|---|---|---|---|
| `GROXY-DOM-001` | `GREX-SCHEMA-001` | **Zero wrapper-`<div>` guarantee:** `div` tag count `=== 0` across the entire layout tree and rendered HTML fragment. | `25` |
| `GROXY-DOM-002` | `grex.elements.json` | Every node `type` belongs strictly to the 20 frozen Grex semantic elements (`Section`, `Container`, `Grid`, `Stack`, `Card`, `Heading`, `Text`, `RichText`, `Link`, `Button`, `Image`, `Icon`, `Form`, `Input`, `Select`, `Tabs`, `Accordion`, `Modal`, `Nav`, `ForEach`) with semantic landmark tags (`header`, `nav`, `main`, `section`, `article`, `aside`, `footer`). | `20` |
| `GROXY-DOM-003` | `GREX-SEC-003` / `004` | Zero `<script>`, `<iframe>`, `<object>`, `<style>`, `on*` handlers, `innerHTML`/`srcdoc`, unsafe URL protocols (`javascript:`, `vbscript:`, `file:`, unsanitized `data:`), or CSS `expression(...)` (any violation caps Clean DOM subscore at `0` and flags `critical`). | `25` |
| `GROXY-DOM-004` | `GREX-BUILDER-SPEC-100` | Tree depth `<= 24` levels (optimal `<= 10` levels) and lean DOM node budget (`<= 150` nodes for standard pages). | `15` |
| `GROXY-DOM-005` | `GRAB-DESIGN-SYSTEM.md` | Design system fidelity: reuses active `--grex-*` tokens and `.grex-c-*` reusable classes rather than hard-coded hex colors or redundant inline style overrides. | `15` |

### Pillar D — Off-Page / Internal Linking Readiness (`GROXY-LINK-001` .. `GROXY-LINK-004`)
| Rule ID | Benchmark Source | Deterministic Evaluation Rule | Max Points |
|---|---|---|---|
| `GROXY-LINK-001` | Ahrefs / Google Search Central | Internal link presence & descriptive anchor text: at least `1–2` internal links per `500` words using descriptive anchor phrases (penalizes vague anchors like `"click here"`, `"read more"`, `"link"`). | `30` |
| `GROXY-LINK-002` | GrabLab `301` Loop & Redirect Guard | Link integrity against `query_entries`, `list_menus`, and GrabLab `slug_history`: detects broken internal paths, self-loops, or links still pointing to superseded `301` redirect slugs instead of canonical URLs. | `30` |
| `GROXY-LINK-003` | Ahrefs Site Audit | Orphan/navigation discoverability: checks whether an entry is reachable via `list_menus` or sibling content links when site graph data is supplied (partial/neutral guidance when audited standalone). | `20` |
| `GROXY-LINK-004` | Google Search Central Rich Results | Structured data (`schema.org` JSON-LD) readiness: verifies presence of author/date metadata (`post`), exact `GrabDecimal` price/availability (`product`), or clean breadcrumb/FAQ hierarchy. | `20` |

---

## 5. Deterministic Grading Formula & Output Contract

### 5.1 Score & Letter-Grade Calculation
Each of the four pillars starts at `0` and sums the deterministic rule scores (`0..100` integer per pillar). Overall score is the exact integer average rounded half-up:
```text
overall_score = Math.round((on_page_seo + content_a11y + performance_dom + linking_readiness) / 4)
```
**Safety Override Gate:** Any `critical` security violation (`GROXY-DOM-001` `<div>` injection or `GROXY-DOM-003` XSS/unsafe URL) caps `overall_score` at `<= 59` (`F`) and sets `publish_safe: false`.

### 5.2 Grade Scale (`A+`–`F`)
| Score Range | Letter Grade | Meaning in Plain English |
|---|---|---|
| `97–100` | `A+` | Exceptional — ready to publish with top search, accessibility, and clean-DOM signals |
| `90–96` | `A` | Strong — passes all critical standards with only minor polish ideas |
| `80–89` | `B` | Good — solid foundation; quick Groxy improvements will raise search & UX quality |
| `70–79` | `C` | Fair — noticeable SEO, heading, `alt`-text, or contrast gaps to address |
| `60–69` | `D` | Needs Work — significant structural, SEO, or accessibility defects |
| `0–59` | `F` | Failing / Unsafe — critical SEO, WCAG AA, wrapper-`<div>`, or security issues present |

### 5.3 Deterministic `AuditReport` JSON Contract
Every `POST /api/groxy/audit` response (and future `v0.2.0` Pre-Publish Gate payload) returns:
```json
{
  "schema_version": "0.1.0",
  "playbook_version": "1.0.0",
  "audited_at": "2026-11-14T19:20:00Z",
  "target": {
    "entry_id": "42",
    "content_type": "post",
    "title": "...",
    "slug": "..."
  },
  "overall_score": 92,
  "overall_grade": "A",
  "publish_safe": true,
  "categories": {
    "on_page_seo": { "score": 90, "grade": "A", "label": "On-Page SEO" },
    "content_a11y": { "score": 95, "grade": "A", "label": "Content & WCAG Accessibility" },
    "performance_dom": { "score": 100, "grade": "A+", "label": "Performance & Clean DOM" },
    "linking_readiness": { "score": 83, "grade": "B", "label": "Off-Page / Internal Linking Readiness" }
  },
  "findings": [
    {
      "rule_id": "GROXY-SEO-003",
      "category": "on_page_seo",
      "severity": "warning",
      "points_earned": 10,
      "points_possible": 15,
      "plain_english": "Your summary excerpt is 94 characters. Expanding it to 120-158 characters helps search results show a fuller preview.",
      "suggested_action": "Let Groxy Boost expand the excerpt to ~145 characters matching your focus keyword.",
      "source": "Google Search Central / Semrush"
    }
  ],
  "design_system_summary": {
    "tokens_loaded": 24,
    "reusable_classes_loaded": 8,
    "unknown_classes_used": []
  }
}
```

---

## 6. HTTP Endpoints & Semantic Inspector UI (`src/groxy.grab` & `views/dashboard.grab.html`)

| Route | Auth / Safety | Behavior |
|---|---|---|
| `GET /_health` | Public read-only | `200 OK` `{"status":"ok","service":"groxy-ai","version":"0.1.0"}` |
| `GET /_ready` | Public read-only | `200 OK` verifying `playbook/seo-playbook.v1.json` loaded and valid |
| `GET /groxy` | CSRF token minted for UI | Renders zero-`<div>` semantic Inspector UI (`Grex JS v1.0.0`, `--allow-scripts`) showing the 4-pillar audit form, live sample runner, Playbook rule explorer, and MCP Bridge diagnostic panel. |
| `GET /api/groxy/playbook` | Read-only JSON | Returns the versioned `playbook/seo-playbook.v1.json` metadata and 22 rule definitions. |
| `POST /api/groxy/audit` | `X-CSRF-Token` verified (`403` on missing/invalid) | Runs deterministic 4-pillar audit against `{ entry, grex_layout, focus_keyword, design_system_md, site_context }` (or fetches live data via `mcp-client` when `target_url` / `entry_id` is configured) and returns `AuditReport`. |
| `POST /api/groxy/mcp/inspect` | `X-CSRF-Token` verified (`403` on missing/invalid) | Connects to configured GrabLab CMS / Grex Theme Builder endpoints (or `grab mcp` capability list) to verify live tool schemas, `/static/grex/grex.elements.json` parity, and `GRAB-DESIGN-SYSTEM.md` ingestion—strictly read-only (zero mutations). |

---

## 7. `v0.1.0` Acceptance & Verification Gates

`v0.1.0` is eligible for completion and synchronized `origin` + `stable` promotion **only** when **100%** of the following gates pass:
1. **GRAB CLI Static & Format Parity:**
   - `grab check` reports `0` errors across all `.grab` and `.grab.html` files.
   - `grab format <file>` stdout matches every `.grab` file byte-for-byte (non-destructive verification).
2. **Playbook & Deterministic Auditor Unit Tests (`node --test tests/unit_*.test.js`):**
   - Repeated identical runs produce identical `AuditReport` JSON (`100%` deterministic).
   - Verifies all 22 rule IDs (`GROXY-SEO-*`, `GROXY-A11Y-*`, `GROXY-DOM-*`, `GROXY-LINK-*`), `A+`–`F` grade boundaries, exact `GrabDecimal`/`GrabInteger` string retention, wrapper-`<div>` & XSS hard caps (`<= 59` / `F` / `publish_safe: false`), and `GRAB-DESIGN-SYSTEM.md` parsing.
3. **Zero Wrapper-`<div>` & CSP/XSS UI Audit (`tests/unit_ui_dom.test.js`):**
   - `views/dashboard.grab.html` and `public/groxy/dashboard.js` produce `divCount === 0`, `innerHTMLWriteCount === 0`, zero `eval`/`javascript:`/`data:` URLs, and `100%` `auditAccessibility()` pass.
4. **Live Cross-Layer MCP E2E Integration (`python tests/integration_e2e.py`):**
   - Spins up **GRAB `v1.1.0`**, **GrabLab CMS `v1.0.1`**, **Grex Theme Builder `v1.0.0`**, and **Groxy AI `v0.1.0`** together:
     - Verifies `GET /_health`, `GET /_ready`, `GET /groxy`, `GET /api/groxy/playbook`.
     - Verifies `POST /api/groxy/mcp/inspect` discovers live GrabLab `grab mcp` tools (`list_content_types`, `query_entries`, `create_entry_draft`, `update_entry_layout`, `list_media`, `list_menus`), `/static/grex/grex.elements.json`, and Grex Theme Builder's `GET /api/design-system.md`.
     - Verifies `POST /api/groxy/audit` accurately grades both a clean WCAG AA/SEO entry (`A` / `A+`) and a deliberately flawed entry (wrapper `<div>`, missing `alt`, low contrast, missing excerpt → `F` / `publish_safe: false`).
     - Verifies safe `create_entry_draft` (`status_enforced: "draft"`) and `POST /api/mcp/layout` (`actor: "groxy-ai"`, `422` / `-32602` on invalid trees and `200` with undoable `applyAiLayout` on valid trees) without ever auto-publishing live pages.
5. **Plain-English Release Guide & Dual-Repo Promotion (upon `v0.1.0` completion):**
   - Generates `docs/releases/pdf/Groxy-AI-v0.1.0-Guide.pdf` and publishes synchronized `v0.1.0` GitHub Releases with the mandatory **Release Type & Affected Layers** + **Ecosystem Compatibility Matrix** block to `urbanspress/groxy-ai.progress` and `urbanspress/groxy-ai.stable`.
