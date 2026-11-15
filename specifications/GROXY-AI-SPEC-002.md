# GROXY-AI-SPEC-002: Groxy AI `v0.2.0` Pre-Publish Grade Review Gate & 🚀 "Let Groxy Boost This" Side-by-Side Diff Engine

- **Status:** Specification in Review (awaiting explicit project-owner approval before `v0.2.0` implementation)
- **Milestone:** `v0.2.0` — Pre-Publish SEO & Performance Grade Review Gate (`A+`–`F` / `0–100`) & 🚀 "Let Groxy Boost This" Side-by-Side Diff & Remediation Engine
- **Foundational Upstream Baselines:**
  - **GRAB:** `v1.1.0` (`grab serve --allow-scripts`, `grab check`, `grab format <file>`, `grab mcp`, `use server`, `use http`, `use json`, `use data`, `use cache`, `use crypto`, `use env`, `server.asset`)
  - **Grex JS:** `v1.0.0` (`grex.elements.json`, `validateElementNode()`, `auditAccessibility()`, signals, semantic elements, zero wrapper-`<div>` DOM)
  - **GrabLab CMS:** `v1.0.1` (`GRABLAB-SPEC-100.md` — `POST /api/auth/mcp-token`, `POST /api/mcp`, `GET /api/mcp/tools`, `POST /api/mcp/tools/{name}`, `create_entry_draft`, `update_entry_layout`, `query_entries`, `list_menus`, `list_media`, `301` redirect loop/reserved guards)
  - **Grex Theme Builder:** `v1.0.0` (`GREX-BUILDER-SPEC-100.md` — `GET /api/design-system.md`, `POST /api/mcp/layout`, `actor: "groxy-ai"`, `applyAiLayout` command-stack Undo parity, `GREX-A11Y-*`, `GREX-SCHEMA-001`, `GREX-SEC-003`/`004`)
- **Governance:** Read alongside [`GROXY-EXPERT.md`](../GROXY-EXPERT.md), [`AGENTS.md`](../AGENTS.md), [`docs/ROADMAP.md`](../docs/ROADMAP.md), and [`specifications/GROXY-AI-SPEC-001.md`](GROXY-AI-SPEC-001.md).

---

## 1. Purpose & `v0.2.0` Scope

**Groxy AI `v0.2.0`** builds directly on the `v0.1.0` deterministic 22-rule 4-pillar auditor and `grab mcp` bridge to deliver an interactive, **human-in-the-loop Pre-Publish Quality Gate** and a non-destructive **🚀 "Let Groxy Boost This" Side-by-Side Diff & Remediation Engine**.

Instead of silently rewriting an author's copy or auto-publishing unverified pages, `v0.2.0` intercepts the pre-publish moment when `groxy_assist_enabled` is turned ON, grades the entry (`A+`–`F` / `0–100`), explains every finding in plain English, and—if the author chooses **🚀 "Let Groxy Boost This"**—produces a concrete, inspectable **Before vs. After Diff** with refreshed grades that still requires an explicit click on **"Approve & Make This Live"** (`GROXY-SAFE-001`).

### Included in `v0.2.0`
1. **Pre-Publish SEO & Performance Grade Review Gate (`POST /api/groxy/prepublish-review` + Semantic Review Screen):**
   - Triggered before a `post`, `product`, or `page` goes live whenever `groxy_assist_enabled` is toggled `true` in the editor.
   - Runs the 22-rule 4-pillar auditor (`On-Page SEO`, `Content & WCAG Accessibility`, `Performance & Clean DOM`, `Off-Page / Internal Linking Readiness`) and renders an accessible, zero-wrapper-`<div>` **Pre-Publish Grade Review Screen** (`A+`–`F` + `0–100` breakdown, rule-by-rule findings, and plain-English explanations).
   - Exposes two explicit human-controlled actions: **"Make This Live"** (proceed immediately as-is) and **🚀 "Let Groxy Boost This"** (rocket icon button invoking the Boost Engine).
2. **🚀 "Let Groxy Boost This" Side-by-Side Diff & Remediation Engine (`POST /api/groxy/boost` + `public/groxy/booster.js`):**
   - Automatically remediates flagged SEO, copy clarity, heading hierarchy (`H1`–`H3`), meta title/excerpt length, internal-linking opportunities (against live GrabLab entries/menus without pointing to `301` redirect loops), and missing WCAG AA image `alt` attributes—while strictly preserving exact `GrabDecimal`/`GrabInteger` numbers (`ADR-025c`), zero wrapper `<div>`s (`GREX-SCHEMA-001`), and `GRAB-DESIGN-SYSTEM.md` tokens/classes.
   - Supports deterministic rule-based remediation by default (zero mandatory API fees) with optional local-first AI copy/alt enrichment (`Ollama` / `OpenCode` over `--allow-net`).
   - Returns a structured **Before vs. After Diff** (`field`, `before`, `after`, `rule_ids_fixed`) plus **Refreshed 4-Pillar Grades** (`before_score` → `after_score`).
3. **Explicit Human Approval & Safe Persistence Gate (`POST /api/groxy/boost/approve` — `GROXY-SAFE-001`):**
   - Requires the author to click **"Approve & Make This Live"** before any boosted draft or layout is persisted via GrabLab `create_entry_draft` / Grex Theme Builder `POST /api/mcp/layout` (`actor: "groxy-ai"`, `applyAiLayout` Undo parity) or handed off to the CMS publish flow.

### Deferred to Later Milestones
- **Autonomous `GRAB-DESIGN-SYSTEM.md`-Aware Visual Page & Section Generator** (`v0.3.0`)
- **Site-Wide Internal Linking Graph Crawler, `schema.org` JSON-LD Builder & Batch Media `alt`-Text Enrichment** (`v0.4.0`)
- **Pre-`v1.0.0` Security/DOM Audit, `--read-only` Docker Packaging & Walkthrough PDF** (`v1.0.0`)

---

## 2. Planned `v0.2.0` Repository Additions & Updates

```text
groxy-ai/
├── specifications/
│   └── GROXY-AI-SPEC-002.md          # This specification
├── src/
│   └── groxy.grab                    # Add /api/groxy/prepublish-review, /api/groxy/boost, /api/groxy/boost/approve
├── views/
│   └── dashboard.grab.html           # Add zero-<div> Pre-Publish Grade Review Screen & Side-by-Side Diff Viewer regions
├── public/
│   └── groxy/
│       ├── groxy.css                 # Semantic styles for Pre-Publish Review Gate & Side-by-Side Diff (zero wrapper-div)
│       ├── booster.js                # Deterministic + optional local-AI remediation & structured Before/After diff engine
│       └── dashboard.js              # Pre-Publish Review Screen, 🚀 Boost trigger, Side-by-Side Diff & Approval UI
└── tests/
    ├── unit_booster.test.js          # Boost remediation, F->A/A+ lift, GrabDecimal preservation, 301-loop & approval tests
    ├── unit_ui_dom.test.js           # Extended zero-<div>, zero-innerHTML & auditAccessibility() checks for v0.2.0 UI
    └── integration_e2e.py            # Live GRAB v1.1.0 + GrabLab v1.0.1 + Grex Builder v1.0.0 Pre-Publish & Boost E2E
```

---

## 3. Pre-Publish SEO & Performance Grade Review Gate

### 3.1 Trigger & Opt-In Behavior
- **Editor Toggle (`groxy_assist_enabled`):**
  - When `groxy_assist_enabled` is `true` and an author initiates publish on a `post`, `product`, or `page`, the editor calls `POST /api/groxy/prepublish-review` before the entry transitions to live status.
  - When `groxy_assist_enabled` is `false`, Groxy AI stays out of the publish path (`gate_status: "bypassed"`) and returns immediately without modifying or blocking publication.

### 3.2 `POST /api/groxy/prepublish-review` Contract
- **Auth & Safety:** Requires valid `X-CSRF-Token` (`403` on missing/invalid). Strictly read-only: never mutates the entry, never creates a draft, and never publishes.
- **Request JSON:**
  ```json
  {
    "groxy_assist_enabled": true,
    "entry": {
      "id": "42",
      "content_type": "post",
      "title": "...",
      "slug": "...",
      "excerpt": "...",
      "body": "...",
      "custom_fields": { "price": "49.99", "sku": "10042" }
    },
    "grex_layout": { "type": "Section", "children": [] },
    "focus_keyword": "semantic cms",
    "design_system_md": "...",
    "site_context": {
      "entries": [],
      "menus": [],
      "media": [],
      "slug_history": []
    }
  }
  ```
- **Response JSON (`200 OK`):**
  ```json
  {
    "schema_version": "0.2.0",
    "review_id": "rev_<hex>",
    "groxy_assist_enabled": true,
    "gate_status": "review_required",
    "audit_report": {
      "overall_score": 54,
      "overall_grade": "F",
      "publish_safe": false,
      "categories": {
        "on_page_seo": { "score": 50, "grade": "F", "label": "On-Page SEO" },
        "content_a11y": { "score": 60, "grade": "D", "label": "Content & WCAG Accessibility" },
        "performance_dom": { "score": 55, "grade": "F", "label": "Performance & Clean DOM" },
        "linking_readiness": { "score": 50, "grade": "F", "label": "Off-Page / Internal Linking Readiness" }
      },
      "findings": []
    },
    "actions": [
      { "id": "make_live", "label": "Make This Live", "requires_confirmation": true },
      { "id": "boost", "label": "Let Groxy Boost This", "icon": "rocket" }
    ]
  }
  ```

### 3.3 Semantic Pre-Publish Grade Review Screen
Rendered using strictly `grex.elements.json` semantic elements (`Section`, `Card`, `Heading`, `Text`, `Stack`, `Grid`, `Button`, `Icon`, `Modal`) with **zero wrapper `<div>` elements** and **zero `innerHTML` writes**:
1. **Overall & 4-Pillar Grade Header:** Displays `overall_grade` (`A+`–`F`), `overall_score` (`0–100`), and individual scores/grades for **On-Page SEO**, **Content & WCAG Accessibility**, **Performance & Clean DOM**, and **Off-Page / Internal Linking Readiness**.
2. **Rule-by-Rule Findings List:** Groups all triggered `GROXY-SEO-*`, `GROXY-A11Y-*`, `GROXY-DOM-*`, and `GROXY-LINK-*` findings with severity badge, points lost, plain-English explanation, and suggested remediation.
3. **Safety Notice (when `publish_safe === false`):** Highlights critical blockers (such as wrapper `<div>`s or unsafe URLs) in plain English and recommends clicking **🚀 "Let Groxy Boost This"**.
4. **Two Explicit Human-Controlled Actions:**
   - **"Make This Live"**: Proceeds to publish the entry immediately as-is under human authority.
   - **🚀 "Let Groxy Boost This"** *(rocket icon button)*: Invokes `POST /api/groxy/boost` and transitions to the Side-by-Side Diff Viewer.

---

## 4. 🚀 "Let Groxy Boost This" Side-by-Side Diff & Remediation Engine

### 4.1 Deterministic Remediation Rules (`public/groxy/booster.js`)
The Boost Engine operates deterministically by default (zero mandatory external API calls) and optionally accepts a local-first AI adapter (`Ollama` / `OpenCode` via GRAB `--allow-net`) for natural-language copy/alt phrasing while enforcing all deterministic post-checks:

| Target Rule IDs | Deterministic Boost Remediation Behavior | Strict Preservation Guard |
|---|---|---|
| `GROXY-SEO-001`, `GROXY-SEO-002` | Normalizes `title` to the `50–60` char optimal window and weaves `focus_keyword` naturally into `title` and opening `<h1>` / intro paragraph (`<= 3%` density). | Never alters `GrabDecimal` / `GrabInteger` figures embedded in titles (e.g., `"$49.99"` or `"2026"`). |
| `GROXY-SEO-003` | Expands or trims `excerpt` / meta description to `120–158` chars using entry summary context and `focus_keyword`. | Preserves exact numbers, units, and SKUs verbatim. |
| `GROXY-SEO-004` | Normalizes `slug` to lowercase hyphenated `^[a-z0-9]+(?:-[a-z0-9]+)*$` (`<= 75` chars), avoiding reserved prefixes (`/admin`, `/api`, `/static`, `/_health`, `/_ready`) and stop-word bloat. | Checks `site_context.entries` & `slug_history` to prevent duplicate or `301` redirect collisions. |
| `GROXY-SEO-005`, `GROXY-SEO-006`, `GROXY-A11Y-004` | Repairs heading hierarchy (`H1` → `H2` → `H3`) so exactly one `<h1>` exists and no heading levels are skipped; inserts scannable `<h2>`/`<h3>` subheadings where long prose lacks structure. | Preserves author facts and all numeric `custom_fields`. |
| `GROXY-A11Y-002` | Generates descriptive WCAG AA `alt` text (`3–125` chars) for `Image` nodes missing `alt` (derived from `media` metadata, filename, or surrounding heading context), or marks explicit decorative icons/dividers `isDecorative: true` (`alt: ""`). | Never leaves generic filenames (`"IMG_001.jpg"`) as `alt` text. |
| `GROXY-A11Y-001`, `GROXY-DOM-005` | Replaces low-contrast or ad-hoc inline colors/styles with active `--grex-*` tokens and `.grex-c-*` utility classes parsed from `GRAB-DESIGN-SYSTEM.md`. | Maintains `>= 4.5:1` (`>= 3.0:1` large text) WCAG AA contrast. |
| `GROXY-DOM-001`, `GROXY-DOM-002`, `GROXY-DOM-003` | Converts any wrapper `<div>` nodes into semantic `grex.elements.json` components (`Section`, `Container`, `Stack`, `Grid`, `Card`) and strips `<script>`, `<iframe>`, `on*` handlers, `innerHTML`, and unsafe URLs (`javascript:`, `vbscript:`, `file:`, unsanitized `data:`). | Guarantees `divCount === 0` and `validateElementNode()` pass. |
| `GROXY-LINK-001`, `GROXY-LINK-002` | Inserts or upgrades internal links using descriptive anchor phrases pointing to live canonical URLs from `site_context.entries` / `list_menus`, automatically resolving or skipping any target in `slug_history` (`301` redirect chains/loops). | Never injects `"click here"` / `"read more"` anchors or `301` redirect loop targets. |

### 4.2 Exact Numeric & Structural Integrity (`ADR-025c` & `GREX-SCHEMA-001`)
Before returning any `BoostResult`, `booster.js` runs an immutable **Invariant Verification Pass**:
1. **Exact `GrabDecimal` / `GrabInteger` Lock:** Compares every `custom_fields` numeric wire string (`price`, `compare_at_price`, `sku`, `inventory_count`, `weight`, etc.) between `before` and `after`; any mismatch aborts the mutation and restores the exact original string.
2. **Zero Wrapper-`<div>` & XSS Re-Audit:** Re-runs `auditEntry()` (`v0.1.0` `auditor.js`) on the boosted candidate to produce `after_report`, guaranteeing `divCount === 0` and `publish_safe === true`.

### 4.3 `POST /api/groxy/boost` Contract
- **Auth & Safety:** Requires `X-CSRF-Token` (`403` on missing/invalid). Does **NOT** persist to GrabLab CMS or publish live traffic.
- **Request JSON:** Accepts `{ review_id, entry, grex_layout, focus_keyword, design_system_md, site_context, use_local_ai }`.
- **Response JSON (`200 OK`):**
  ```json
  {
    "schema_version": "0.2.0",
    "boost_id": "bst_<hex>",
    "review_id": "rev_<hex>",
    "mode": "deterministic",
    "approval_required": true,
    "approval_token": "tok_<hex>",
    "before_report": {
      "overall_score": 54,
      "overall_grade": "F",
      "publish_safe": false,
      "categories": {}
    },
    "after_report": {
      "overall_score": 96,
      "overall_grade": "A",
      "publish_safe": true,
      "categories": {}
    },
    "diffs": [
      {
        "field": "title",
        "label": "SEO Title",
        "before": "Post",
        "after": "Semantic CMS Guide: Faster, Cleaner Publishing with Groxy",
        "rule_ids_fixed": ["GROXY-SEO-001", "GROXY-SEO-002"],
        "changed": true
      },
      {
        "field": "excerpt",
        "label": "Meta Description / Excerpt",
        "before": "",
        "after": "Learn how Semantic CMS workflows keep pages fast, accessible, and search-ready with zero wrapper divs.",
        "rule_ids_fixed": ["GROXY-SEO-003"],
        "changed": true
      }
    ],
    "candidate_entry": {},
    "candidate_layout": {}
  }
  ```

### 4.4 Side-by-Side Diff Viewer & **"Approve & Make This Live"** (`GROXY-SAFE-001`)
1. **Side-by-Side Diff UI:** Renders each changed `field` in a semantic two-column comparison (`Before` vs. `After`) tagged with `rule_ids_fixed`, alongside the **Refreshed 4-Pillar Grades** (`before_score` → `after_score`, e.g., `54 (F)` → `96 (A)`).
2. **Explicit Human Approval (`POST /api/groxy/boost/approve`):**
   - Nothing is saved or published until the author clicks **"Approve & Make This Live"**.
   - `POST /api/groxy/boost/approve` verifies `X-CSRF-Token`, `boost_id`, and single-use `approval_token` (`403` / `409` if missing, invalid, or replayed).
   - Persists the approved entry via GrabLab `create_entry_draft` (`status_enforced: "draft"`) and, when a layout was boosted, submits via Grex Theme Builder `POST /api/mcp/layout` (`actor: "groxy-ai"`, `applyAiLayout` command-stack Undo parity), returning `approved: true` and `ready_for_publish: true` so the host CMS completes publication under human authority.
   - Clicking **"Discard Boost"** clears the staged `boost_id` with zero writes to GrabLab or Grex Theme Builder.

---

## 5. `v0.2.0` Acceptance & Verification Gates

`v0.2.0` is eligible for completion and synchronized `origin` + `stable` promotion **only** when **100%** of the following gates pass:
1. **GRAB CLI Static & Format Parity:**
   - `grab check --platform-config grab.platform.json src/groxy.grab` (and all `.grab` / `.grab.html` files) exits `0` with zero errors.
   - Non-destructive `grab format <file>` stdout matches every `.grab` file on disk byte-for-byte.
2. **Zero Wrapper-`<div>`, Zero `innerHTML` & WCAG AA DOM Tests (`tests/unit_ui_dom.test.js`):**
   - Verifies the Pre-Publish Grade Review Screen and Side-by-Side Before/After Diff Viewer in `views/dashboard.grab.html` and `public/groxy/dashboard.js` produce `divCount === 0`, `innerHTMLWriteCount === 0`, zero unsafe URLs, and `100%` `auditAccessibility()` pass.
3. **Deterministic Boost & Human-Approval Unit Tests (`tests/unit_booster.test.js`):**
   - Verifies a failing entry (`F` / `<= 59`, missing excerpt, broken `H1`→`H3` heading jump, missing `Image` `alt`, wrapper `<div>`, `301` redirect link) is deterministically boosted to `A` / `A+` (`>= 90`) with `publish_safe: true` and `divCount === 0`.
   - Verifies exact `GrabDecimal` / `GrabInteger` wire strings (`"49.99"`, `"10042"`) remain byte-for-byte identical after boost.
   - Verifies `POST /api/groxy/boost` never persists or publishes without an explicit `POST /api/groxy/boost/approve` call carrying a valid `approval_token` (`GROXY-SAFE-001`).
4. **Live Cross-Layer E2E Integration (`python tests/integration_e2e.py`):**
   - Spins up **GRAB `v1.1.0`**, **GrabLab CMS `v1.0.1`**, **Grex Theme Builder `v1.0.0`**, and **Groxy AI `v0.2.0`** together:
     - Exercises `groxy_assist_enabled: false` (bypassed) and `groxy_assist_enabled: true` (`POST /api/groxy/prepublish-review` returning `F` grade + findings).
     - Exercises `POST /api/groxy/boost` returning structured `diffs` (`field`, `before`, `after`, `rule_ids_fixed`) and refreshed `before_report` → `after_report` (`F` → `A`/`A+`), while verifying the live GrabLab entry remains unmodified before approval.
     - Exercises `POST /api/groxy/boost/approve` persisting the boosted draft via `create_entry_draft` (`status_enforced: "draft"`) and layout via `POST /api/mcp/layout` (`actor: "groxy-ai"`, `applyAiLayout` Undo parity).
5. **Plain-English Release Guide & Dual-Repo Promotion (upon `v0.2.0` completion):**
   - Generates `docs/releases/pdf/Groxy-AI-v0.2.0-Guide.pdf` and publishes synchronized `v0.2.0` GitHub Releases with the mandatory **Release Type & Affected Layers** + **Ecosystem Compatibility Matrix** block to `urbanspress/groxy-ai.progress` and `urbanspress/groxy-ai.stable`.
