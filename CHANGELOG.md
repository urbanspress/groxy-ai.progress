# Changelog

All notable changes to **Groxy AI** (`urbanspress/groxy-ai`) are documented in this file.
Versioning follows `MAJOR.MINOR.PATCH` SemVer rules per [`AGENTS.md`](AGENTS.md).

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
