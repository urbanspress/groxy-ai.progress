# GROXY-AI-SPEC-110: Groxy AI `v1.1.0` Screenshot-to-Grex Visual Replica (`POST /api/groxy/vision-clone`)

- **Status:** Approved target; specification in review
- **Milestone:** `v1.1.0` — Screenshot-to-Grex Visual Replica (`POST /api/groxy/vision-clone` & `POST /api/groxy/vision-clone/apply`)
- **SemVer Tier (`ADR-027c`):** `MINOR (v1.1.0 — Backwards-Compatible Feature Release)` — 100% drop-in compatible with all 22 frozen `v1.0.0` routes and schemas (`GROXY-AI-SPEC-005.md`).
- **Foundational Upstream Baselines (Frozen `v1.x` Contracts):**
  - **GRAB:** `v1.1.0` (`urbanspress/grab` — `grab serve --allow-scripts`, `grab check`, `grab format <file>`, `grab mcp`, `use server`, `use http`, `use json`, `use data`, `use cache`, `use crypto`, `use env`, `server.asset`, `GRAB-E401`, `GRAB-E402`)
  - **Grex JS:** `v1.0.0` (`urbanspress/grex-js` — `grex.elements.json` 20 semantic elements, `validateElementNode()`, `auditAccessibility()`, `computeContrastRatio()`, reactive signals, zero wrapper-`<div>` DOM)
  - **GrabLab CMS:** `v1.0.1` (`urbanspress/grablab-cms`, `GRABLAB-SPEC-100.md` — `create_entry_draft` with `status_enforced: "draft"`, `update_entry_layout`, `query_entries`, `list_content_types`, `list_menus`, `list_media`, JSON-RPC `-32602`)
  - **Grex Theme Builder:** `v1.0.0` (`urbanspress/grex-builder`, `GREX-BUILDER-SPEC-100.md` — `GET /api/design-system.md`, `POST /api/mcp/layout`, `actor: "groxy-ai"`, `applyAiLayout` command-stack 1-click `Ctrl+Z` Undo parity, `GREX-A11Y-*`, `GREX-SCHEMA-001`, `GREX-SEC-003`/`004`)
- **Governance:** Read alongside [`GROXY-EXPERT.md`](../GROXY-EXPERT.md), [`AGENTS.md`](../AGENTS.md), [`docs/ROADMAP.md`](../docs/ROADMAP.md), and [`specifications/GROXY-AI-SPEC-001.md`](GROXY-AI-SPEC-001.md) through [`specifications/GROXY-AI-SPEC-005.md`](GROXY-AI-SPEC-005.md).

---

## 1. Purpose & `v1.1.0` Scope

**Groxy AI `v1.1.0`** introduces the **Screenshot-to-Grex Visual Replica Engine** (`POST /api/groxy/vision-clone` and `POST /api/groxy/vision-clone/apply`), enabling designers, authors, and store operators to upload a reference UI screenshot (`PNG`, `JPEG`, or `WebP`) and compile a clean, responsive, design-system-aligned **Grex Theme Builder `v1.0.0`** layout with zero wrapper `<div>` elements and zero mandatory cloud API fees.

Unlike conventional screenshot-to-code tools that emit deeply nested `<div>` soup, arbitrary inline hex values, inaccessible low-contrast text, or unvalidated raw HTML, **Groxy AI `v1.1.0`** enforces a strict **5-Stage Safe Visual Replication Pipeline**:

1. **Magic-Byte Screenshot Verification & Bounded Payload Guard (`GRAB-E401`):** Verifies raw binary magic bytes (`PNG`, `JPEG`, `WebP` only), enforces bounded payload size caps (`<= 5 MiB` decoded / `<= 7,000,000` base64 chars), and blocks SVG/HTML/executable polyglots or path-traversal references.
2. **Local-First Vision Structural & Token Extraction (`GRAB-E402`):** Extracts structural section hierarchy, column counts, card groupings, CTA placement, spacing rhythm, typographic scale, and Light/Dark color palette candidates via deterministic binary/structural analysis, local **Ollama** vision models (`llama3.2-vision` / `qwen2.5-vl` on `127.0.0.1:11434`), or optional user-configured BYOK vision endpoints governed by `--allow-net` and `GRAB-E402` SSRF blocking.
3. **Strict `GRAB-DESIGN-SYSTEM.md` & 20-Element Semantic Compilation:** Compiles extracted visual descriptors exclusively into the 20 semantic `grex.elements.json` components (`Section`, `Container`, `Grid`, `Stack`, `Card`, `Heading`, `Text`, `RichText`, `Link`, `Button`, `Image`, `Icon`, `Form`, `Input`, `Select`, `Tabs`, `Accordion`, `Modal`, `Nav`, `ForEach`), mapping extracted colors, spacing, and typography onto active `--grex-*` CSS custom properties and registered `.grex-c-*` utility classes from `GET /api/design-system.md`.
4. **Automatic WCAG AA Contrast Repair (`>= 4.5:1`), `ADR-025c` Precision & 22-Rule Audit Gate:** Auto-repairs any low-contrast extracted foreground/surface pairs to satisfy WCAG AA (`>= 4.5:1` normal text, `>= 3.0:1` large text) across both Light and Dark themes, enforces exact base-10 `GrabDecimal`/`GrabInteger` wire strings (`422` on JS floats or IEEE drift strings), and verifies `validateElementNode()`, `auditAccessibility()`, and a 4-pillar score `>= 90` (`Grade A` or `A+`, `publish_safe: true`).
5. **Human-in-the-Loop Preview Canvas, Target-Bound `approval_token` & 1-Click Undo (`GROXY-SAFE-001`):** Stages the replica in a zero-`<div>` interactive preview canvas with a single-use, target-bound `approval_token` (`vtok_<hex>`). Only after an explicit human click on **"Approve & Send Replica to Grex Theme Builder"** does Groxy AI dispatch to `POST /api/mcp/layout` (`actor: "groxy-ai"`, reversible via 1-click `Ctrl+Z` `applyAiLayout` Undo) and optionally create a GrabLab CMS draft (`status_enforced: "draft"`).

---

## 2. Planned `v1.1.0` Repository Additions & Updates

Upon explicit project-owner approval of `GROXY-AI-SPEC-110.md`, implementation will make only additive, backwards-compatible updates while preserving all 22 frozen `v1.0.0` routes and contracts:

```text
groxy-ai/
├── specifications/
│   └── GROXY-AI-SPEC-110.md                  # This v1.1.0 specification
├── src/
│   └── groxy.grab                            # Add POST /api/groxy/vision-clone & POST /api/groxy/vision-clone/apply; bump service version to "1.1.0"
├── views/
│   └── dashboard.grab.html                   # Add zero-<div> Screenshot-to-Grex Visual Replica Studio panel & preview canvas
├── public/
│   └── groxy/
│       ├── vision-clone.js                   # Magic-byte validator, vision structural extractor, WCAG contrast auto-repair & Grex compiler
│       ├── generator.js                      # Export shared Style Pack / Blueprint / Design-System token helpers for vision-clone.js
│       ├── mcp-client.js                     # Add local Ollama (127.0.0.1:11434) / allowlisted BYOK vision transport with GRAB-E402 SSRF guard
│       ├── dashboard.js                      # Wire Screenshot-to-Grex upload, extracted token/rhythm inspector, 4-pillar scorecard & Apply button
│       └── groxy.css                         # Semantic styles for Screenshot-to-Grex Studio panel (zero wrapper <div>s)
├── assets/
│   └── vision-clone.js                       # Mirror of public/groxy/vision-clone.js for server/CLI module parity
├── tests/
│   ├── unit_vision_clone.test.js             # Magic-byte PNG/JPEG/WebP checks, 413/422 guards, contrast auto-repair, ADR-025c & token tests
│   ├── unit_ui_dom.test.js                   # Verify 0 <div> tags, 0 innerHTML writes & auditAccessibility() across updated /groxy UI
│   └── integration_e2e.py                    # Live 4-layer E2E: vision-clone -> preview -> target-bound approval_token -> /api/mcp/layout + Undo
├── docs/
│   ├── ROADMAP.md                            # Mark v1.1.0 Approved -> Complete upon verification
│   └── releases/
│       ├── generate_release_guides.py        # Add Groxy AI v1.1.0 plain-English walkthrough PDF generator
│       └── pdf/Groxy-AI-v1.1.0-Guide.pdf     # Generated v1.1.0 walkthrough guide
├── README.md                                 # Document Screenshot-to-Grex Visual Replica endpoints & studio workflow
├── CHANGELOG.md                              # Add v1.1.0 release notes
└── HANDOFF.md                                # Record v1.1.0 completion & snapshot sync
```

---

## 3. Magic-Byte Screenshot Verification & `GRAB-E401` Input Confinement

### 3.1 Supported Formats & Strict Magic-Byte Signatures
Every `POST /api/groxy/vision-clone` request MUST supply `screenshot_base64` (standard or URL-safe base64, optionally prefixed with `data:image/<fmt>;base64,`) or `screenshot_hex`. Groxy AI decodes the leading bytes and verifies the exact binary magic signature before inspecting dimensions or invoking any vision parser:

| Image Format | Declared MIME (`mime_type`) | Required Binary Magic Bytes (Hex) | Offset & Additional Header Checks |
|---|---|---|---|
| **PNG** | `image/png` | `89 50 4E 47 0D 0A 1A 0A` | Bytes `0..7` must equal `\x89PNG\r\n\x1a\n`; bytes `12..15` must equal `IHDR` (`49 48 44 52`) with positive 32-bit big-endian width (`16..19`) and height (`20..23`). |
| **JPEG** | `image/jpeg` | `FF D8 FF` | Bytes `0..2` must equal `FF D8 FF` (`SOI` + marker prefix such as `E0` JFIF, `E1` Exif, or `DB`/`C0`). |
| **WebP** | `image/webp` | `52 49 46 46 ... 57 45 42 50` | Bytes `0..3` must equal `RIFF` (`52 49 46 46`) and bytes `8..11` must equal `WEBP` (`57 45 42 50`). |

### 3.2 Payload Size Bounds, Polyglot Rejection & `GRAB-E401` Path Guards
1. **Bounded Payload Size (`HTTP 413 Payload Too Large`):**
   - Maximum decoded screenshot binary size: **`5,242,880` bytes (`5 MiB`)** (or `7,000,000` base64 characters).
   - Minimum valid screenshot binary size: **`12` bytes** (sufficient for header signature verification).
   - Payloads exceeding the cap are rejected immediately with HTTP `413` (`error_code: "GROXY-VISION-E002"`, `reason: "screenshot_payload_too_large"`).
2. **Forbidden Formats & Polyglot Rejection (`HTTP 422 Unprocessable Entity`):**
   - Rejects SVG (`<svg`, `<?xml`), HTML (`<!DOCTYPE`, `<html`, `<script`), GIF (`GIF87a`/`GIF89a`), BMP (`BM`), PDF (`%PDF`), Windows PE (`MZ`), Linux ELF (`\x7fELF`), ZIP/JAR (`PK\x03\x04`), and any payload where `mime_type` conflicts with the verified magic bytes (`error_code: "GROXY-VISION-E001"`, `reason: "invalid_image_magic_bytes"`).
   - Rejects any decoded binary buffer containing embedded `<script`, `javascript:`, `onerror=`, or `onload=` strings inside metadata/EXIF chunks (`GREX-SEC-003`).
3. **Workspace Path Confinement (`GRAB-E401`):**
   - If an optional `reference_path` field is supplied in local workspace flows, it MUST resolve strictly under `storage/reference_uploads/` with zero `..` traversal segments and zero access to `.env`, `.git`, `.ssh`, `*.key`, `*.pem`, or outside paths. Violations fail closed with HTTP `403` / `GRAB-E401`.

---

## 4. Vision Structural Extraction, Token Mapping & WCAG AA Auto-Repair

### 4.1 Three Local-First Vision Execution Modes (`GRAB-E402`)
`vision-clone.js` and `src/groxy.grab` support three clean execution modes so operators never pay mandatory recurring cloud API fees:

1. **Deterministic Structural & Palette Analyzer (`vision_provider: "deterministic"`, Default):**
   - Inspects the verified image header (dimensions, aspect ratio, orientation), optional `layout_hints` / `extracted_palette` / `sections_detected` metadata, and the site's live `GRAB-DESIGN-SYSTEM.md` + `SITE-CONTEXT.md` to map the reference screenshot onto the closest semantic **Blueprint** (`full_landing_page`, `hero_section`, `pricing_grid`, `faq_accordion`, `foreach_showcase`) and **Design Style Pack** (`emerald-editorial`, `obsidian-tech`, `warm-commerce`, `swiss-minimal`, `local-service-trust`, `creative-studio-bold`, `creator-academy`, `wellness-organic`).
2. **Local Ollama Vision Model (`vision_provider: "ollama"`, `127.0.0.1:11434`):**
   - When `use_local_vision: true` (or `vision_provider: "ollama"`), connects to the user's local Ollama vision endpoint (`http://127.0.0.1:11434/api/chat`) using `llama3.2-vision` (default) or `qwen2.5-vl`.
   - Requests a structured JSON visual descriptor (`sections`, `column_rhythm`, `typography_scale`, `spacing_rhythm`, `palette_candidates`, `cta_labels`, `pricing_tiers`). If local Ollama is offline or unreachable, gracefully falls back to `deterministic` mode (`fallback_used: true`) unless `require_live_vision: true` is set.
3. **Optional User BYOK Vision Endpoint (`vision_provider: "byok"`):**
   - Connects only to an explicitly allowlisted HTTPS vision endpoint configured in `--allow-net` and `grab.platform.json`, reading credentials strictly via capability-gated `use env` (`--allow-env GROXY_VISION_API_KEY`).
   - Enforces `GRAB-E402` SSRF protection: blocks private/loopback/link-local/cloud-metadata IPs (`169.254.169.254`, `10.0.0.0/8`, `192.168.0.0/16`, `172.16.0.0/12`, and non-Ollama loopback ports) and rejects unallowlisted origins with HTTP `403` (`GRAB-E402`).

### 4.2 Structural Hierarchy, Spacing Rhythm, Typography Scale & Palette Extraction
From the verified screenshot and vision pass, Groxy AI builds a normalized `visual_analysis` profile:
- **Structural Hierarchy (`structural_hierarchy`):** Ordered landmark sequence (`Nav` -> Hero `Section` -> Feature `Grid` -> `GrabDecimal` Pricing `Grid` -> `ForEach` Collection Showcase -> `Accordion` FAQ), column counts (`1`, `2`, `3`, `4`), card groupings, and primary/secondary CTA buttons.
- **Spacing Rhythm (`spacing_rhythm`):** Normalizes detected vertical section padding and grid gaps onto documented `GRAB-DESIGN-SYSTEM.md` `8pt` tokens (`--grex-space-xs`, `--grex-space-sm`, `--grex-space-md`, `--grex-space-lg`, `--grex-space-xl`, `--grex-space-2xl`).
- **Typography Scale (`typography_scale`):** Maps detected display headings, section headings, card subheadings, and body copy onto semantic `Heading` (`h1` -> `h2` -> `h3` with zero skipped levels per `GREX-A11Y-004`) and `Text` / `RichText` nodes (`--grex-font-sans`, `--grex-font-display`, `--grex-text-xl`, `--grex-text-base`) with `60–65ch` readable line measure.
- **Color Palette & Automatic WCAG AA Contrast Repair (`palette_extraction` & `contrast_repairs`):**
  - Evaluates extracted Light and Dark `bg`, `surface`, `text`, `muted`, `primary`, and `on_primary` hex colors using `computeContrastRatio()`.
  - Whenever an extracted foreground/background pair falls below **`4.5:1`** (`3.0:1` for large display text), Groxy AI automatically repairs the foreground or surface token to the nearest WCAG AA-compliant shade from the matched Style Pack / `GRAB-DESIGN-SYSTEM.md` palette and logs `{ pair, original_foreground, original_background, original_ratio, repaired_foreground, repaired_background, repaired_ratio }` in `visual_analysis.contrast_repairs`.

### 4.3 Untrusted Vision Output Sanitization & `ADR-025c` Exact Numeric Lock
- **Zero Raw HTML Trust:** Vision model outputs are never interpolated as HTML. Every node is constructed through `generator.js` / `vision-clone.js` using strictly the 20 allowed `grex.elements.json` types (`divCount === 0`, `innerHTMLWriteCount === 0`, `max_depth <= 24`, `isSafeUrl()` verified).
- **Exact Base-10 Wire Strings (`ADR-025c`):** Any pricing tiers, SKU badges, or item counts supplied in the request or extracted from the screenshot MUST be exact base-10 `GrabDecimal` (`"0.00"`, `"29.00"`, `"149.95"`) or `GrabInteger` (`"10020"`) strings. Raw JS floats (`29.99`) or IEEE-754 drift strings (`"0.30000000000000004"`) are rejected immediately with HTTP `422` (`GrexSecurityError`).

---

## 5. HTTP API Contracts (`POST /api/groxy/vision-clone` & `POST /api/groxy/vision-clone/apply`)

### 5.1 `POST /api/groxy/vision-clone` (Non-Mutating Replica Composer & Audit Gate)
- **Authentication & Safety Gate:** Requires valid `X-CSRF-Token` header (`403 Forbidden` if missing/invalid). Strictly non-mutating: stages the compiled replica in memory with a single-use, target-bound `approval_token` (`vtok_<hex>`) and never touches Grex Theme Builder or GrabLab CMS until human approval.
- **Request JSON:**
  ```json
  {
    "screenshot_base64": "iVBORw0KGgoAAAANSUhEUgAA...",
    "mime_type": "image/png",
    "slot": "main",
    "blueprint_hint": "full_landing_page",
    "style_pack_hint": "obsidian-tech",
    "focus_keyword": "visual theme studio",
    "topic_title": "Visual Theme Studio for High-Velocity Teams",
    "target_audience": "Designers and product engineers",
    "vision_provider": "deterministic",
    "vision_model": "llama3.2-vision",
    "extracted_palette": {
      "light": {
        "bg": "#ffffff",
        "surface": "#f8fafc",
        "text": "#94a3b8",
        "primary": "#2563eb",
        "on_primary": "#ffffff"
      }
    },
    "pricing_tiers": [
      { "name": "Creator", "price": "0.00", "billing_period": "month", "sku": "20010", "cta_label": "Start Creator Plan", "cta_href": "/signup/creator" },
      { "name": "Studio", "price": "49.00", "billing_period": "month", "sku": "20020", "cta_label": "Start Studio Trial", "cta_href": "/signup/studio" },
      { "name": "Scale", "price": "199.95", "billing_period": "month", "sku": "20030", "cta_label": "Explore Scale Plan", "cta_href": "/pricing/scale" }
    ],
    "foreach_collection": "posts",
    "design_system_md": "..."
  }
  ```
- **Response JSON (`200 OK`):**
  ```json
  {
    "schema_version": "1.1.0",
    "clone_id": "vclone_<hex>",
    "slot": "main",
    "blueprint": "full_landing_page",
    "style_pack": "obsidian-tech",
    "vision_provider_used": "deterministic",
    "vision_model": "llama3.2-vision",
    "approval_required": true,
    "approval_token": "vtok_<hex>",
    "target_binding": {
      "clone_id": "vclone_<hex>",
      "slot": "main",
      "layout_sha256": "<64-char-sha256>",
      "actor": "groxy-ai"
    },
    "screenshot_verification": {
      "valid": true,
      "detected_format": "png",
      "mime_type": "image/png",
      "magic_bytes_hex": "89504e470d0a1a0a",
      "byte_length": 68,
      "width": 1440,
      "height": 900,
      "sha256": "<64-char-sha256>"
    },
    "visual_analysis": {
      "structural_hierarchy": [
        { "landmark": "Nav", "role": "primary_navigation", "columns": 1 },
        { "landmark": "Section", "role": "hero_split", "columns": 2 },
        { "landmark": "Section", "role": "feature_grid", "columns": 3 },
        { "landmark": "Section", "role": "pricing_grid", "columns": 3 },
        { "landmark": "Section", "role": "foreach_showcase", "columns": 3 },
        { "landmark": "Section", "role": "faq_accordion", "columns": 1 }
      ],
      "spacing_rhythm": {
        "grid_unit": "8pt",
        "section_padding_token": "--grex-space-xl",
        "container_gap_token": "--grex-space-lg",
        "card_padding_token": "--grex-space-md"
      },
      "typography_scale": {
        "heading_sequence": ["h1", "h2", "h3"],
        "skipped_levels": 0,
        "font_display_token": "--grex-font-display",
        "font_body_token": "--grex-font-sans",
        "max_measure": "65ch"
      },
      "palette_tokens": {
        "light": {
          "bg": "#f8fafc",
          "surface": "#ffffff",
          "text": "#09090b",
          "primary": "#1d4ed8",
          "on_primary": "#ffffff"
        },
        "dark": {
          "bg": "#09090b",
          "surface": "#18181b",
          "text": "#fafafa",
          "primary": "#60a5fa",
          "on_primary": "#09090b"
        }
      },
      "contrast_repairs": [
        {
          "theme": "light",
          "pair": "text_on_bg",
          "original_foreground": "#94a3b8",
          "original_background": "#ffffff",
          "original_ratio": 2.56,
          "repaired_foreground": "#09090b",
          "repaired_background": "#f8fafc",
          "repaired_ratio": 18.73,
          "wcag_aa_minimum": 4.5
        }
      ]
    },
    "validation": {
      "grex_schema_valid": true,
      "div_count": 0,
      "inner_html_write_count": 0,
      "max_depth": 6,
      "node_count": 38,
      "wcag_aa_passed": true,
      "decimal_integrity_verified": true
    },
    "audit_report": {
      "overall_score": 96,
      "overall_grade": "A+",
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
      "tokens_applied": ["--grex-surface-elevated", "--grex-text", "--grex-primary", "--grex-space-md", "--grex-radius-sm"],
      "reusable_classes_applied": ["grex-c-hero", "grex-c-card", "grex-c-btn-primary", "grex-c-grid-3"],
      "unknown_classes_used": []
    },
    "candidate_entry": {
      "content_type": "page",
      "title": "Visual Theme Studio for High-Velocity Teams",
      "slug": "visual-theme-studio-high-velocity-teams",
      "status": "draft",
      "custom_fields": {
        "featured_price": "49.00",
        "featured_sku": "20020"
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

### 5.2 `POST /api/groxy/vision-clone/apply` (Target-Bound Human Approval & Builder Dispatch)
- **Authentication & Single-Use Target-Bound Token Gate (`GROXY-SAFE-001`):**
  - Requires valid `X-CSRF-Token` (`403` on missing/invalid).
  - Requires valid `clone_id` (`404` if unknown) and matching single-use `approval_token` (`vtok_<hex>`).
  - Verifies **Target Binding**: if the request overrides `slot` to a different slot than the one staged in `target_binding.slot` (or tampers with `layout_sha256`), rejects with HTTP `403 Forbidden` (`GROXY-SAFE-001: approval_token target mismatch`).
  - Replaying a consumed `approval_token` returns HTTP `409 Conflict` (`GROXY-SAFE-001: approval_token already consumed`).
- **Upstream Dispatch (`Grex Theme Builder v1.0.0` & `GrabLab CMS v1.0.1`):**
  - Dispatches `{ slot, layout: candidate_layout, actor: "groxy-ai" }` to Grex Theme Builder `POST /api/mcp/layout`, recording an undoable `applyAiLayout` command on `createCommandStack` (`undo_available: true`).
  - When `create_draft: true` and `grablab_url` are provided, persists `candidate_entry` + `candidate_layout` via `create_entry_draft`, enforcing `status_enforced: "draft"` (never auto-publishing live pages).
- **Response JSON (`200 OK`):**
  ```json
  {
    "schema_version": "1.1.0",
    "clone_id": "vclone_<hex>",
    "approved": true,
    "actor": "groxy-ai",
    "command_stack_action": "applyAiLayout",
    "undo_available": true,
    "status_enforced": "draft",
    "target_binding_verified": true,
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

## 6. Zero-`<div>` Screenshot-to-Grex Studio UI (`views/dashboard.grab.html` & `public/groxy/dashboard.js`)

The `/groxy` Inspector & Generator Studio adds a semantic **Screenshot-to-Grex Visual Replica** `<section id="vision-clone-studio">` built strictly from semantic HTML5 tags (`<section>`, `<article>`, `<header>`, `<form>`, `<fieldset>`, `<legend>`, `<label>`, `<input>`, `<select>`, `<button>`, `<output>`, `<dl>`, `<dt>`, `<dd>`, `<ul>`, `<li>`) with **zero `<div>` elements** and **zero `innerHTML` writes**:

1. **Reference Screenshot Upload & Target Controls:** File/base64 input (`accept="image/png,image/jpeg,image/webp"`), target slot selector (`main`, `hero`, `footer`), optional Style Pack & Blueprint hints, focus keyword input, and local Ollama (`llama3.2-vision` / `qwen2.5-vl`) vs. deterministic toggle.
2. **Extracted Visual Hierarchy, Rhythm & Contrast Repair Summary:** Displays verified magic-byte format (`PNG` / `JPEG` / `WebP`), dimensions, detected landmark sequence, `8pt` spacing rhythm tokens, Light/Dark contrast auto-repairs, and the 4-pillar `A`/`A+` scorecard.
3. **Human-in-the-Loop Action Bar (`GROXY-SAFE-001`):**
   - **📸 "Analyze Screenshot & Stage Grex Replica"** (`POST /api/groxy/vision-clone`)
   - **✅ "Approve & Send Replica to Grex Theme Builder"** (`POST /api/groxy/vision-clone/apply` with single-use `vtok_*`)
   - **🗑️ "Discard Staged Replica"** (clears local state without network writes)

---

## 7. `v1.1.0` Acceptance & Verification Gates

`Groxy AI v1.1.0` is eligible for completion, `v1.1.0` tagging, and synchronized `origin` + `stable` release promotion **only** when **100%** of the following gates pass:

1. **GRAB CLI Static & Canonical Format Parity:**
   - `grab check --platform-config grab.platform.json src/groxy.grab` and `.grab.html` template compilation exit `0` with zero errors.
   - Non-destructive `grab format src/groxy.grab` stdout matches `src/groxy.grab` on disk byte-for-byte.
2. **Screenshot-to-Grex Unit, Magic-Byte, Contrast Repair & Security Tests (`tests/unit_vision_clone.test.js`):**
   - Verifies magic-byte validation accepts valid `PNG`, `JPEG`, and `WebP` binary headers and rejects SVG, HTML, GIF, EXE, empty buffers, or mismatched `mime_type` headers with `422` (`GROXY-VISION-E001`).
   - Verifies screenshots exceeding the `5 MiB` cap are rejected with `413` (`GROXY-VISION-E002`).
   - Verifies low-contrast extracted palettes (e.g., `#94a3b8` on `#ffffff`, ratio `2.56:1`) are automatically repaired to WCAG AA `>= 4.5:1` across both Light and Dark themes and recorded in `visual_analysis.contrast_repairs`.
   - Verifies every compiled layout contains `0` `<div>` nodes (`divCount === 0`), `0` `innerHTML` writes, passes `validateElementNode()` and `auditAccessibility()`, reuses active `--grex-*` tokens and `.grex-c-*` classes (`unknown_classes_used: []`), preserves exact base-10 `GrabDecimal`/`GrabInteger` strings (`ADR-025c`, rejecting JS floats with `422`), and achieves `overall_score >= 90` (`Grade A` or `A+`, `publish_safe: true`).
   - Verifies target-bound single-use `approval_token` enforcement (`403` on missing/invalid CSRF or slot/target tampering, `200` on first approval, `409 Conflict` on token replay).
3. **Zero Wrapper-`<div>`, Zero `innerHTML` & WCAG AA DOM Suite (`tests/unit_ui_dom.test.js`):**
   - All existing `37` Node test suites plus `tests/unit_vision_clone.test.js` pass `100%`, confirming `divCount === 0` and `innerHTMLWriteCount === 0` across `views/dashboard.grab.html` and all `public/groxy/*.js` modules.
4. **Live 4-Layer Cross-Repo E2E Integration (`python tests/integration_e2e.py`):**
   - Exercises `POST /api/groxy/vision-clone` (including magic-byte rejection of forged SVG/HTML bytes, `ADR-025c` float rejection, low-contrast auto-repair, and `Grade A/A+` staging) followed by `POST /api/groxy/vision-clone/apply` against live **GRAB `v1.1.0` + GrabLab CMS `v1.0.1` + Grex Theme Builder `v1.0.0` + Groxy AI `v1.1.0`**, verifying `POST /api/mcp/layout` (`actor: "groxy-ai"`), `applyAiLayout` command-stack recording, 1-click Undo restoration, `status_enforced: "draft"`, and `409` on token replay.
5. **Release Artifacts & Ecosystem Snapshot Sync:**
   - Generates `docs/releases/pdf/Groxy-AI-v1.1.0-Guide.pdf`, `dist/groxy-ai-v1.1.0-bundle.zip`, and `dist/SHA256SUMS.txt`, and runs `sync-notebook-sources.ps1` + `generate-codex-handoff.ps1`.
