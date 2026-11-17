# AGENTS.md — Groxy AI

**Groxy AI** (`urbanspress/groxy-ai.progress` / `urbanspress/groxy-ai.stable`, local directory `C:\Development\groxy-ai`) is **Step 4 of the Post-1.0 GRAB Ecosystem**: an autonomous design, content, and SEO intelligence agent built purely on **GRAB `v1.1.0`**, **Grex JS `v1.0.0`**, **GrabLab CMS `v1.0.1`**, and **Grex Theme Builder `v1.0.0`**.

---

## 1. Core Invariants & Upstream Scope
1. **Read `GROXY-EXPERT.md` first** before drafting any specification, editing any file, or reviewing any pull request.
2. **Respect Ecosystem Layer Boundaries:** Treat **GRAB `v1.1.0`** (`grab` CLI, `Grisp`, `grab mcp`, `use http`, `use json`, `use data`, `use cache`, `use crypto`, `use env`), **Grex JS `v1.0.0`** (`grex.elements.json`, `validateElementNode`, `auditAccessibility`, reactive signals), **GrabLab CMS `v1.0.1`** (`GRABLAB-SPEC-100.md`), and **Grex Theme Builder `v1.0.0`** (`GREX-BUILDER-SPEC-100.md`, `GRAB-DESIGN-SYSTEM.md`, `POST /api/mcp/layout`) as already-unlocked upstream contracts. Never duplicate upstream GRAB compiler internals or `grex-js` core runtime source code inside `groxy-ai`.
3. **Human-in-the-Loop Safety:** Never auto-publish live GrabLab entries or silently overwrite human copy/templates. Route drafts via `create_entry_draft`, layout updates via `POST /api/mcp/layout` (`actor: "groxy-ai"`), and optimizations via explicit before/after diff previews.
4. **Zero Build-Step / Zero Wrapper-`<div>` UI:** All Groxy UI views and generated layouts use clean semantic HTML5 elements from `grex.elements.json` on `Grex JS v1.0.0` with zero Vue, React, Node build bundlers, Webpack, Vite, or wrapper `<div>` elements.

---

## 2. Workflow, Spec Gate & Verification Gates
- **Spec-First Approval Gate:** Do NOT write `groxy-ai` application implementation code (`src/`, `assets/`, `playbook/`, `views/`, `tests/`) until the active milestone specification (starting with `specifications/GROXY-AI-SPEC-001.md`) has been reviewed and explicitly approved by the project owner.
- **Plain-English User Communication:** The project owner directs development in plain English. Always explain architecture, errors, and design decisions clearly without unnecessary jargon. Handle all file edits, git commands, and terminal verification directly.
- **No Unapproved Commits/Pushes:** Do not commit, push, or publish releases without explicit project-owner approval (explicitly requested repository bootstraps excepted).
- **Mandatory Test & Lint Gate:** Before marking any implementation milestone complete or requesting release promotion:
  1. Run `grab check` on all `.grab` and `.grab.html` files with zero errors.
  2. Verify canonical formatting non-destructively by comparing `grab format <file>` stdout byte-for-byte against each `.grab` file on disk (note: `grab format` in GRAB `v1.1.0` does not take `--check`).
  3. Verify **zero wrapper `<div>` elements**, zero `innerHTML` writes, zero unsafe URLs, and 100% WCAG AA pass (`auditAccessibility()`) across all views and generated/audited layouts.
  4. Run the full automated unit, DOM, accessibility, playbook, and live cross-layer MCP integration test suite (`node --test tests/*.test.js` and `python tests/integration_e2e.py`) with **100% passing results**.

---

## 3. Two-Repository Workflow & Release Protection
- **Repository Roles:**
  - `origin` (`https://github.com/urbanspress/groxy-ai.progress.git`): Active development repository for specifications, drafts, work-in-progress checkpoints, and milestone commits.
  - `stable` (`https://github.com/urbanspress/groxy-ai.stable.git`): Production release repository for 100% verified milestone releases only.
- **Strict `stable` Protection:** All AI agents and models MUST push work-in-progress commits, unapproved specs, and partial checkpoints ONLY to `origin` (`urbanspress/groxy-ai.progress`). Pushing to `stable` (`urbanspress/groxy-ai.stable`) is strictly forbidden unless the milestone is 100% `Complete` in `docs/ROADMAP.md`, all verification gates pass 100%, and `HANDOFF.md` records no pending milestone tasks.
- **Synchronized Releases & Walkthrough PDFs:** Whenever a completed milestone (`v0.1.0` onward) is promoted to `stable`, push `main` and annotated version tags in strict ascending chronological order to both `origin` and `stable`, generate the plain-English walkthrough PDF (`docs/releases/pdf/Groxy-AI-v<X.Y.Z>-Guide.pdf`), packaged release archive, and `SHA256SUMS.txt`, and publish matching GitHub Releases + assets on **both** repositories (`urbanspress/groxy-ai.progress` and `urbanspress/groxy-ai.stable`).

### SemVer (MAJOR.MINOR.PATCH) & Release Compatibility Matrix Standard
1. **Strict `MAJOR.MINOR.PATCH` Semantic Versioning (`ADR-027c`):**
   - **`1.0.x` (`PATCH`):** Strictly for non-breaking bug fixes, security hardening, documentation polish, and cross-layer audit patches (`100%` drop-in compatible).
   - **`1.x.0` (`MINOR`):** For backwards-compatible new features, additive standard library/runtime capabilities, or new MCP/CMS/Builder endpoints.
   - **`2.0.0` (`MAJOR`):** Reserved for breaking architectural or contract changes—**never used without explicit project-owner approval (`ADR-027c`)**.
2. **Mandatory Release Compatibility Badge & Matrix Block:**
   - Every GitHub Release (`v1.0.1`, `v1.1.0`, etc.) across both `.progress` and `.stable` repositories MUST display at the top of its release notes:
     1. A **Release Type & Affected Layers** summary callout (`PATCH (v1.0.x)` vs. `MINOR (v1.x.0)`, which layer(s) changed, and whether any neighboring layer requires an upgrade).
     2. An **Ecosystem Compatibility Matrix** Markdown table covering all five layers:

````markdown
### Release Type & Affected Layers
- **Release Version & SemVer Tier:** `v<X.Y.Z>` (`PATCH 1.0.x — Non-Breaking Bug/Security/Audit Patch` | `MINOR 1.x.0 — Backwards-Compatible Feature Release`)
- **Affected Layer(s):** `<Layer Name>` (`urbanspress/<repo>`)
- **Neighboring Layer Upgrade Required?** `No — 100% drop-in compatible` (or explicit version requirement if `Yes`)

| Ecosystem Layer | Repository | Required Version Range | Touched in This Release? | Neighbor Upgrade Required? |
|---|---|---|---|---|
| **Core Language, Bytecode VM & Grisp Server** | `urbanspress/grab` | `>= v1.1.0 (< v2.0.0)` | `Yes` / `No` | `No` |
| **Reactive Frontend Runtime & 20-Element Library** | `urbanspress/grex-js` | `>= v1.0.0 (< v2.0.0)` | `Yes` / `No` | `No` |
| **Flagship Zero-Plugin CMS** | `urbanspress/grablab-cms` | `>= v1.0.1 (< v2.0.0)` | `Yes` / `No` | `No` |
| **Exclusive `mode: "visual"` Theme & Studio** | `urbanspress/grex-builder` | `>= v1.0.0 (< v2.0.0)` | `Yes` / `No` | `No` |
| **Autonomous Design, Content & SEO Agent** | `urbanspress/groxy-ai` | `>= v0.1.0` | `Yes` / `No` | `No` |
````

### Mandatory Milestone Snapshot Rule
- **Ecosystem Snapshot Sync:** At the end of every milestone (before closing the milestone or pushing release promotions), every agent MUST run:
  ```powershell
  powershell -ExecutionPolicy Bypass -File C:\Development\GRAB\scripts\sync-notebook-sources.ps1
  ```
  so `C:\Development\ECOSYSTEM-SNAPSHOT.md` always reflects the latest Git branches, commits, tags, `AGENTS.md`, `*-EXPERT.md`, `HANDOFF.md`, `docs\ROADMAP.md`, and `specifications\*.md` across all discovered `C:\Development\*` repositories.

---

## 4. Model Routing, Effort Levels & Tandem Handoff Protocol

### Internal Antigravity & Codex Model + Effort Routing (4-Pool Quota-Aware Matrix)
Route every phase to the exact **Model + Effort Tier** below so no single weekly quota pool depletes. Every Antigravity and Codex agent MUST follow this matrix and recommend the next tier at the end of every checkpoint:
- **Stage 1 - Pre-Implementation Specs & Roadmaps (`*-SPEC-*.md`):** **Claude Sonnet (Medium)** or **Hydrogen (Medium)** (backup: **GPT-OSS 120B (Medium)**).
- **Stage 2 - Pre-Implementation Cross-Layer Security & Contract Audits:** Alternate between **Claude Opus (High)** and **Orchestrator (Argon)** (reserved strictly for cross-layer boundaries, concurrency, and security audits).
- **Stage 3 - Core Multi-File Feature Implementation & Unit/DOM Tests:** Alternate across releases between **Claude Sonnet (High)**, **GPT-OSS 120B (High)**, and **Hydrogen (High)** so no single weekly quota pool depletes.
- **Stage 4 - Final Gate 3B E2E Closure, Walkthrough PDF & Dual-Remote Packaging:** **Gemini 3.8 Flash (`Single Package` mode)** or **Hydrogen (High)** (escalate to **Hydrogen (Extra)** or **Claude Opus (High)** only if a stubborn cross-layer bug requires deep root-cause debugging).
- **Mandatory Closing Handoff Rule:** Every agent response MUST end with a clear **"Recommended Next Model & Effort Tier"** recommendation naming both the exact model and effort level (e.g., `Switch to Claude Opus (High) for the cross-layer audit` or `Switch to Claude Sonnet (High) for the v1.6.0 implementation`) and why.
- **Mandatory Pause & Swap Prompt Rule:** Every active AI agent MUST pause at milestone boundaries or before high-risk cross-layer/pre-`v1.0.0` audits and explicitly tell the user which Model + Effort Tier to switch to next (per the matrix above), including a clear 1-sentence reason.

### Tiered Model Routing
- **Tier 1 — Frontier Models (`Google Hydrogen`, `Gemini 4 Argon`, `GPT-6.1 Sol`, `Claude Opus/Sonnet`):**
  - Authorized to draft specifications, implement multi-module MCP/SEO/design engines, and execute cross-layer verification suites.
- **Tier 2 — Fast Workhorse & Backup Models (`Gemini 3.8 Flash`, `OpenCode`, `Cline`, `Kilo Code`):**
  - Must operate in **Strict Single-Module Mode** for all changes:
    1. **Read `GROXY-EXPERT.md` first** before making any edit.
    2. **Scope edits to one module or test file at a time**.
    3. **Verify immediately after every edit** (`grab check`, `grab format` stdout comparison, and targeted module tests) before moving to the next file.

### Tandem Handoff Protocol (`Google Antigravity <-> OpenAI Codex`)
- **Google Antigravity -> Codex:** If an issue remains unresolved after 2 attempts on `Google Hydrogen (Extra)` or `Orchestrator (Argon)`, stop editing, revert only the specific files edited during the failed attempt (asking the owner first if pre-existing uncommitted work would be affected), record what was tried in `HANDOFF.md`, update `Current Owner: OpenAI Codex`, and say: `"Ready to hand off to Codex. Type use-codex to continue."`
- **Codex -> Google Antigravity:** When Codex completes an architectural or verification task, update `HANDOFF.md`, set `Current Owner: Google Antigravity`, and say: `"Core task complete—ready to hand off to Google Antigravity. Type use-antigravity to continue."`
- **Automatic Pickup:** On pickup (`use-antigravity` or `use-codex`), immediately read `GROXY-EXPERT.md`, `AGENTS.md`, and `HANDOFF.md`, verify baseline checks, and continue the next pending task.
