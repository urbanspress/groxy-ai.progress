# Changelog

All notable changes to **Groxy AI** (`urbanspress/groxy-ai`) are documented in this file.
Versioning follows `MAJOR.MINOR.PATCH` SemVer rules per [`AGENTS.md`](AGENTS.md).

## [v1.2.0] - 2026-11-15

### Added
- **Brand DNA & Voice Wizard:** Adds revisioned Brand DNA profile validation, human-readable Markdown, exact decimal safeguards, and portable Site DNA inclusion.
- **Batch Campaign Studio:** Adds deterministic content and product campaign planning, per-item score previews, XSS-safe JSON-LD, and explicit draft-only batch approval.

## [v1.1.0] - 2026-11-15

### Added
- **Screenshot-to-Grex Visual Replica:** Added `POST /api/groxy/vision-clone` and `/apply`, screenshot magic-byte validation, decoded 5 MiB bounds, base64/hex decoding, path confinement, exact numeric checks, and deterministic/optional local Ollama/allowlisted BYOK routing.
- **Safe semantic preview studio:** Added a zero-wrapper-`<div>` `/groxy` panel with screenshot upload, extraction summary, a DOM-built preview, explicit apply/discard actions, and a target-bound single-use `vtok_*` approval flow.
- **Contrast and precision gates:** Repairs low-contrast palette metadata for Light and Dark themes, preserves active Grex design tokens, validates generated nodes with `validateElementNode()` and `auditAccessibility()`, and rejects JavaScript numeric prices/counts.
- **Verification coverage:** Added screenshot security, size, MIME, path, contrast, precision, transport fallback, and target digest tests; expanded live E2E coverage for stage/apply/replay behavior.
- **Release status:** Approved & Frozen — Complete. `grab check`, byte-for-byte `grab format`, `45/45` Node tests, and integration Gates 1, 2, 3A, and live 3B pass; the guide, bundle, checksums, ecosystem snapshot, and synchronized releases are complete.

## [v1.0.0] — 2026-11-15

### Added & Frozen
- **Pre-`v1.0.0` 5-Layer Cross-Repository Security, DOM & Contract Audit (`100%` Pass):**
  - Verified `0` wrapper `<div>` tags across all `25` ecosystem `.grab.html` templates, `0` `.innerHTML` / `eval()` usages, 100% WCAG AA contrast across all `40` Style Pack × Blueprint combinations, byte-exact `ADR-025c` `GrabDecimal`/`GrabInteger` precision, single-use `approval_token` + `X-CSRF-Token` human-in-the-loop safety (`GROXY-SAFE-001`), `--read-only` rootfs isolation, `GRAB-E401`/`GRAB-E402` guards, and full MCP/design-system parity across **GRAB `v1.1.0`**, **Grex JS `v1.0.0`**, **GrabLab CMS `v1.0.1`**, **Grex Theme Builder `v1.0.0`**, and **Groxy AI `v1.0.0`**.
- **SemVer `v1.x` Contract & Service Version Freeze (`ADR-027c`, [`specifications/GROXY-AI-SPEC-005.md`](specifications/GROXY-AI-SPEC-005.md)):**
  - Freezes all `22` HTTP routes in [`src/groxy.grab`](src/groxy.grab) (`/_health`, `/_ready`, `/api/groxy/playbook` (`service_version: "1.0.0"`), `/api/groxy/mcp/inspect`), the 22-rule Playbook ([`playbook/seo-playbook.v1.json`](playbook/seo-playbook.v1.json)), all `8` Industry & Goal-Aware Style Packs × `5` Blueprints, and `GROXY_VERSION = "1.0.0"` exports across all [`public/groxy/`](public/groxy/) and [`assets/`](assets/) runtime modules (including [`assets/booster.js`](assets/booster.js) and [`assets/site-context.js`](assets/site-context.js)), plus [`views/dashboard.grab.html`](views/dashboard.grab.html).
  - Preserves backwards-compatible endpoint payload `schema_version` identifiers (`"0.1.0"`–`"0.4.0"`) across the `v1.x` release line.
- **Hardened `--read-only` Container Deployment Bundle ([`deploy/docker-compose.yml`](deploy/docker-compose.yml), [`deploy/README.md`](deploy/README.md)):**
  - Ships standalone (`groxy-ai`) and 4-layer integrated (`--profile ecosystem-stack` with `grablab-cms:v1.0.1` and `grex-builder-studio:v1.0.0`) Compose manifests enforcing `read_only: true`, `cap_drop: ["ALL"]`, `no-new-privileges:true`, `tmpfs: /tmp:rw,noexec,nosuid`, loopback binding (`127.0.0.1:${GROXY_PORT:-8090}:8090`), writable mounts scoped strictly to `storage/` and `cache/`, and zero hardcoded secrets or private IPs.
- **Production Verification, Packaging & Release Guide:**
  - Added [`tests/unit_v100_production_audit.test.js`](tests/unit_v100_production_audit.test.js) (`37/37` Node tests passing), updated [`tests/integration_e2e.py`](tests/integration_e2e.py) (Gates `1`, `2`, `3A`, `3B` passing 100%), updated [`scripts/package_release.py`](scripts/package_release.py) to include `deploy/` in `dist/groxy-ai-v1.0.0-bundle.zip` + `dist/SHA256SUMS.txt`, and added the plain-English `v1.0.0` guide in [`docs/releases/generate_release_guides.py`](docs/releases/generate_release_guides.py).

## [v0.4.0] — 2026-11-15

### Added
- **Expanded 8 Industry & Goal-Aware Design Style Packs (`GET /api/groxy/style-packs`, [`public/groxy/generator.js`](public/groxy/generator.js), [`src/groxy.grab`](src/groxy.grab)):**
  - Keeps `emerald-editorial`, `obsidian-tech`, `warm-commerce`, and `swiss-minimal` 100% backwards-compatible while adding `local-service-trust`, `creative-studio-bold`, `creator-academy`, and `wellness-organic` with `industries`, `conversion_goals` (`lead_gen`, `ecommerce`, `editorial`, `saas`, `portfolio`), `?goal=`/`?industry=` filtering, and verified WCAG AA `>= 4.5:1` Light/Dark contrast across all **40 Style Pack × Blueprint combinations**.
- **Live `SITE-CONTEXT.md` Background Sync (`POST /api/groxy/site-context/sync`, `GET /api/groxy/site-context.md`, [`public/groxy/site-context.js`](public/groxy/site-context.js)):**
  - Read-only background indexing of GrabLab CMS entries, categories/tags, exact base-10 `GrabDecimal`/`GrabInteger` product prices (`ADR-025c`), navigation menus (`primary`, `footer`, `mobile`), media items, and `slug_history` `301` redirects into gitignored `storage/SITE-CONTEXT.md` and cache (`mutates_live_cms: false`).
- **Site-Wide Internal Linking Graph (`POST /api/groxy/links/analyze`):**
  - Computes internal authority scores (`0–100`), detects orphan pages, identifies broken targets and multi-hop `301` redirect chains, detects `301` redirect cycles/loops and strictly excludes loop targets from contextual link suggestions, and proposes descriptive non-generic anchor text cleanly without touching live copy (`GROXY-SAFE-001`).
- **Deterministic `schema.org` JSON-LD Generator (`POST /api/groxy/schema/generate`):**
  - Emits valid structured data for `Article`, `BlogPosting`, `Product` (retaining exact `ADR-025c` `GrabDecimal` price strings and rejecting JavaScript float prices with HTTP `422`), `FAQPage`, `BreadcrumbList`, and `WebSite`, with strict XSS escaping (`\u003c`, `\u003e`, `\u0026`) so `</script>` payloads cannot break out.
- **Media Library `alt`-Text Enrichment (`POST /api/groxy/media/enrich-alt`, `POST /api/groxy/media/enrich-alt/approve`):**
  - Scans `list_media` items for empty or raw filename `alt` values (`IMG_1234.jpg`, etc.), strictly preserves `decorative: true` / `is_decorative: true` items (`alt: ""`, `aria_hidden: "true"`, `status: "decorative_preserved"`), and gates descriptive WCAG AA proposals (`3–125` chars) behind `X-CSRF-Token` + single-use `approval_token` (`403` invalid, `409` replay).
- **Non-Intrusive `Groxy Nightly Watch` Digest & Portable `Site DNA` Snapshot (`POST /api/groxy/watch/run`, `GET /api/groxy/watch/digest`, `GET /api/groxy/site-dna/export`):**
  - Generates a quiet **Morning Boost Report** (`popups: false`, `silent_edits: false`, 1-click **🚀 "Let Groxy Boost This"** actions) and exports a portable JSON/Markdown **Site DNA** snapshot bundling `GRAB-DESIGN-SYSTEM.md` + `SITE-CONTEXT.md` + active style pack tokens + Nightly Watch summary for **Gashboard + `grabman`**.
- **Zero-`<div>` Semantic Site Intelligence Studio Panels ([`views/dashboard.grab.html`](views/dashboard.grab.html), [`public/groxy/dashboard.js`](public/groxy/dashboard.js), [`public/groxy/groxy.css`](public/groxy/groxy.css)):**
  - Adds Style Pack industry/goal filters plus dedicated semantic panels for `SITE-CONTEXT.md` Sync, Internal Linking Graph, `schema.org` JSON-LD, Media `alt` Enrichment, and Morning Boost Digest with `divCount === 0` and `innerHTMLWriteCount === 0`.
- **Verification & Release Guide:**
  - Added [`tests/unit_site_intelligence.test.js`](tests/unit_site_intelligence.test.js) and [`tests/unit_enrichment.test.js`](tests/unit_enrichment.test.js), expanded [`tests/unit_generator.test.js`](tests/unit_generator.test.js) and [`tests/unit_ui_dom.test.js`](tests/unit_ui_dom.test.js) (`35/35` passing), extended Gate 3B live 4-layer integration tests in [`tests/integration_e2e.py`](tests/integration_e2e.py), and added `v0.4.0` walkthrough guide in [`docs/releases/generate_release_guides.py`](docs/releases/generate_release_guides.py).

## [v0.3.0] — 2026-11-15

### Added
- **Live Design-System & Style Pack Engine (`GET /api/groxy/style-packs`, [`public/groxy/generator.js`](public/groxy/generator.js), [`src/groxy.grab`](src/groxy.grab)):**
  - Consumes live `--grex-*` custom properties, Light/Dark WCAG AA pairs, and `.grex-c-*` utility classes from **Grex Theme Builder `v1.0.0`** (`GET /api/design-system.md`), automatically normalizing low-contrast token overrides before composition.
  - Ships 4 curated zero-API-fee Design Style Packs (`emerald-editorial`, `obsidian-tech`, `warm-commerce`, `swiss-minimal`) and 5 Blueprints (`full_landing_page`, `hero_section`, `pricing_grid`, `faq_accordion`, `foreach_showcase`).
- **Autonomous Semantic Composer & Pre-Dispatch Validation (`POST /api/groxy/generate-layout`):**
  - Composes candidate layouts purely from the 20 semantic `grex.elements.json` components (`div_count === 0`, zero `innerHTML`, zero scripts or unsafe URLs, unbroken `H1 -> H2 -> H3` hierarchy, descriptive image `alt` attributes, and dynamic `ForEach` `queryLoop` bindings).
  - Enforces `ADR-025c` exact base-10 `GrabDecimal` / `GrabInteger` wire string preservation (`"0.00"`, `"29.00"`, `"149.95"`, `"10020"`) and rejects JavaScript float pricing with HTTP `422`.
  - Runs `validateElementNode({ strictProps: true })`, `auditAccessibility()`, and Groxy AI's 22-rule 4-pillar auditor prior to previewing, guaranteeing `Grade A` or `A+` (`>= 90`) and `publish_safe: true`.
- **Visual Generator Studio UI & 1-Click Builder Undo Parity (`POST /api/groxy/generate-layout/apply`, [`views/dashboard.grab.html`](views/dashboard.grab.html), [`public/groxy/dashboard.js`](public/groxy/dashboard.js), [`public/groxy/mcp-client.js`](public/groxy/mcp-client.js), [`public/groxy/groxy.css`](public/groxy/groxy.css)):**
  - Renders a zero-`<div>`, zero-`innerHTML` studio preview canvas, semantic node tree inspector, applied token/class strip, and 4-pillar scorecard in `/groxy`.
  - Enforces single-use `approval_token` + `X-CSRF-Token` (`403` invalid, `409` replay), maps slots cleanly via `mapGroxySlotToBuilderSlot()`, dispatches approved layouts to Grex Theme Builder `POST /api/mcp/layout` with `actor: "groxy-ai"` (`applyAiLayout` command stack for 1-click Undo), and saves GrabLab CMS companion drafts with schema-checked `custom_fields` and enforced `status_enforced: "draft"`.
- **Verification & Release Guide:**
  - Added [`tests/unit_generator.test.js`](tests/unit_generator.test.js) and Visual Generator Studio DOM tests in [`tests/unit_ui_dom.test.js`](tests/unit_ui_dom.test.js) (`28/28` passing), extended 4-layer Gate 3B live integration + 1-click Builder Undo verification in [`tests/integration_e2e.py`](tests/integration_e2e.py), and added `v0.3.0` plain-English walkthrough guide in [`docs/releases/generate_release_guides.py`](docs/releases/generate_release_guides.py).

## [v0.2.0] — 2026-11-14

### Added
- **Pre-Publish SEO & Performance Grade Review Gate (`POST /api/groxy/prepublish-review`, [`public/groxy/booster.js`](public/groxy/booster.js), [`src/groxy.grab`](src/groxy.grab)):**
  - Respects editor opt-in `groxy_assist_enabled` (`false` -> `gate_status: "bypassed"`, `true` -> runs the 22-rule 4-pillar auditor and opens an accessible, zero-wrapper-`<div>` Pre-Publish Grade Review Screen with `0–100` / `A+`–`F` scores, findings, **"Make This Live"**, and **🚀 "Let Groxy Boost This"**).
- **🚀 "Let Groxy Boost This" Side-by-Side Diff & Remediation Engine (`POST /api/groxy/boost` + `POST /api/groxy/boost/approve`, [`public/groxy/dashboard.js`](public/groxy/dashboard.js), [`public/groxy/groxy.css`](public/groxy/groxy.css)):**
  - Deterministically fixes short/weak titles and excerpts, noisy admin slugs, skipped `H1 -> H3` headings, missing WCAG AA image `alt` text, low contrast, wrapper `<div>` elements, XSS/unsafe URLs, vague anchor copy, and stale `301` redirect links against `slug_history` (`GROXY-LINK-002`).
  - Strictly preserves exact base-10 `GrabDecimal` / `GrabInteger` wire strings (`ADR-025c`) and re-audits boosted candidates to guarantee `divCount === 0` and `publish_safe === true`.
  - Renders a structured **Before vs. After Diff** (`field`, `label`, `before`, `after`, `rule_ids_fixed`) and requires clicking **"Approve & Make This Live"** (`POST /api/groxy/boost/approve` with single-use `approval_token` + `X-CSRF-Token`, `403` on bad token, `409` on replay) before persisting drafts via GrabLab CMS `create_entry_draft` (`status: "draft"`) and Grex Theme Builder `POST /api/mcp/layout` (`actor: "groxy-ai"`).
- **Expanded Verification & Release Guide:**
  - Added [`tests/unit_booster.test.js`](tests/unit_booster.test.js), expanded [`tests/unit_ui_dom.test.js`](tests/unit_ui_dom.test.js) (`19/19` passing), extended Gate 3B live 4-layer E2E in [`tests/integration_e2e.py`](tests/integration_e2e.py), and added `v0.2.0` plain-English guide generation in [`docs/releases/generate_release_guides.py`](docs/releases/generate_release_guides.py).

## [v0.1.0] — 2026-11-14

### Added
- **Unified `grab mcp` & Grex Theme Builder Client ([`public/groxy/mcp-client.js`](public/groxy/mcp-client.js), [`src/groxy.grab`](src/groxy.grab)):**
  - Capability-gated client for **GrabLab CMS v1.0.1** (`list_content_types`, `query_entries`, `create_entry_draft` with forced `status: "draft"` / `GROXY-SAFE-001`, `update_entry_layout`, `list_media`, `list_menus`, `/static/grex/grex.elements.json`).
  - Live bridge to **Grex Theme Builder v1.0.0** (`GET /api/design-system.md` parser, candidate layout submission via `POST /api/mcp/layout` attributed with `actor: "groxy-ai"`, and `-32602` validation error propagation).
  - Read-only default JSON-RPC 2.0 request builder (`buildGrabMcpRpcRequest`) for Core **GRAB v1.1.0** `grab mcp` tools (`grab_check`, `grab_format`, `grab_inspect_routes`, `grab_inspect_schema`, `grab_scaffold`), plus SSRF/default-deny URL guard (`GRAB-E402`) and sensitive path denial (`GRAB-E401`).
- **Curated 22-Rule SEO, WCAG AA & Clean-DOM Playbook ([`playbook/seo-playbook.v1.json`](playbook/seo-playbook.v1.json), [`public/groxy/playbook.js`](public/groxy/playbook.js)):**
  - Machine-readable, zero-API-fee knowledge base covering **On-Page SEO (`GROXY-SEO-001..008`)**, **Content & WCAG Accessibility (`GROXY-A11Y-001..005`)**, **Performance & Clean DOM (`GROXY-DOM-001..005`)**, and **Off-Page / Internal Linking Readiness (`GROXY-LINK-001..004`)**.
- **Deterministic 4-Pillar Auditor ([`public/groxy/auditor.js`](public/groxy/auditor.js), `src/groxy.grab`):**
  - Evaluates entries, Grex layouts, HTML fragments, and `site_context` deterministically into repeatable `0–100` / `A+`–`F` `AuditReport` payloads with `ADR-025c` exact `GrabDecimal`/`GrabInteger` precision validation and hard `F` safety caps (`publish_safe: false`) on wrapper `<div>` or script/URL violations.
- **Zero-`<div>` Semantic Inspector UI & HTTP Endpoints ([`views/dashboard.grab.html`](views/dashboard.grab.html), [`public/groxy/dashboard.js`](public/groxy/dashboard.js), [`public/groxy/groxy.css`](public/groxy/groxy.css)):**
  - Serves `GET /groxy`, `GET /_health`, `GET /_ready`, `GET /api/groxy/playbook`, and CSRF-protected `POST /api/groxy/audit` and `POST /api/groxy/mcp/inspect` built strictly with `Grex JS v1.0.0` signals and semantic HTML5.
- **Automated Verification & Release Packaging:**
  - Zero-dependency DOM shim ([`tests/helpers/dom-shim.js`](tests/helpers/dom-shim.js)), 14 Node unit & DOM tests (`tests/unit_*.test.js`), 4-layer live cross-layer E2E suite ([`tests/integration_e2e.py`](tests/integration_e2e.py)), plain-English HTML/PDF walkthrough generator ([`docs/releases/generate_release_guides.py`](docs/releases/generate_release_guides.py)), and zip/SHA-256 packager ([`scripts/package_release.py`](scripts/package_release.py)).
