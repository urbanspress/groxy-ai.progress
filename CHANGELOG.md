# Changelog

All notable changes to **Groxy AI** (`urbanspress/groxy-ai`) are documented in this file.
Versioning follows `MAJOR.MINOR.PATCH` SemVer rules per [`AGENTS.md`](AGENTS.md).

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
