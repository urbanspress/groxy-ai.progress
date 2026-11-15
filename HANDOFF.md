# Groxy AI — Handoff Ledger

**Last Updated:** 2026-11-14  
**Current Owner:** Google Antigravity  
**Current Milestone State:** **`v0.1.0` — Specification in Review** ([`specifications/GROXY-AI-SPEC-001.md`](specifications/GROXY-AI-SPEC-001.md) drafted; awaiting project-owner approval before writing any application code)

---

## Frozen Upstream Ecosystem Baselines
- **Core Language, Bytecode VM & Grisp Server:** **GRAB `v1.1.0`** (`urbanspress/grab.progress` / `urbanspress/grab.stable`) — provides `grab serve --allow-scripts`, `grab check`, `grab format`, `grab mcp`, `use http`, `use json`, `use data`, `use cache`, `use crypto`, `use env`, and `server.asset`.
- **Reactive Frontend Runtime & 20-Element Library:** **Grex JS `v1.0.0`** (`urbanspress/grex-js.progress` / `urbanspress/grex-js.stable`) — provides `grex.elements.json`, `validateElementNode()`, `auditAccessibility()`, `createTheme()`, `createClassManager()`, and `GrexPreviewBridge`.
- **Flagship Zero-Plugin CMS:** **GrabLab CMS `v1.0.1`** (`urbanspress/grablab-cms.progress` / `urbanspress/grablab-cms.stable`) — provides `GRABLAB-SPEC-100.md` frozen `grab mcp` tools (`list_content_types`, `query_entries`, `create_entry_draft`, `update_entry_layout`, `list_media`, `list_menus`), JSON-RPC `-32602` error reporting, `/static/grex/grex.elements.json`, and `301` redirect loop guards.
- **Exclusive Visual Theme & Studio:** **Grex Theme Builder `v1.0.0`** (`urbanspress/grex-builder.progress` / `urbanspress/grex-builder.stable`) — provides `GREX-BUILDER-SPEC-100.md`, live `GRAB-DESIGN-SYSTEM.md` (`GET /api/design-system.md`), `POST /api/mcp/layout` with `actor: "groxy-ai"`, deterministic `createCommandStack` 1-click Undo parity, and WCAG AA enforcement.

---

## Completed Setup Tasks
- Created twin GitHub repositories `urbanspress/groxy-ai.progress` (`origin`) and `urbanspress/groxy-ai.stable` (`stable`).
- Authored repository governance ([`GROXY-EXPERT.md`](GROXY-EXPERT.md), [`AGENTS.md`](AGENTS.md)), committed emerald `#10B981` badges (`docs/badges/`), full milestone roadmap ([`docs/ROADMAP.md`](docs/ROADMAP.md)), `README.md`, `LICENSE` (MIT), and pre-implementation specification [`specifications/GROXY-AI-SPEC-001.md`](specifications/GROXY-AI-SPEC-001.md).
- Locked strict `MAJOR.MINOR.PATCH` SemVer and Release Compatibility Matrix rules into `AGENTS.md` across all five ecosystem repositories.

---

## Next Pending Task
1. **Await Project Owner Approval** of [`specifications/GROXY-AI-SPEC-001.md`](specifications/GROXY-AI-SPEC-001.md).
2. Upon approval, implement **Groxy AI `v0.1.0`** (`src/groxy.grab`, `playbook/seo-playbook.v1.json`, `assets/playbook.js`, `assets/auditor.js`, `assets/mcp-client.js`, `views/dashboard.grab.html`, and unit/DOM/a11y/live E2E tests).
3. **Recommended Next Model Routing:** Once `GROXY-AI-SPEC-001.md` is approved, select **`Google Hydrogen (High)`** for standard `v0.1.0` module implementation (or **`Google Hydrogen (Extra)`** if tackling autonomous LLM reasoning / multi-server MCP orchestration).
