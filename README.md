# Groxy AI

![Built with GRAB v1.1.0](docs/badges/built-with-grab.svg)
![Powered by Grex JS v1.0.0](docs/badges/powered-by-grex-js.svg)

**Groxy AI** (`urbanspress/groxy-ai`) is **Step 4 of the Post-1.0 GRAB Ecosystem** — an autonomous design, content, and SEO intelligence agent built purely on **GRAB `v1.1.0`**, **Grex JS `v1.0.0`**, **GrabLab CMS `v1.0.1`**, and **Grex Theme Builder `v1.0.0`**.

It pairs a curated **SEO Knowledge & Reasoning Playbook** (modeled on **Semrush**, **Ahrefs**, and **Google Search Central** best practices) with deterministic on-page DOM/WCAG AA auditing, `GRAB-DESIGN-SYSTEM.md` layout guardrails, and safe human-in-the-loop `grab mcp` workflows—without mandatory third-party cloud API fees or wrapper-`<div>` bloat.

---

## Key Architecture Pillars
1. **Human-in-the-Loop Safety:** Never auto-publishes live pages or silently overwrites human copy. Content is drafted via `create_entry_draft` (`status: "draft"`), visual layouts are dispatched via `POST /api/mcp/layout` (`actor: "groxy-ai"`) with full 1-click Undo parity, and **🚀 "Let Groxy Boost This"** changes always present a before/after diff for explicit human approval.
2. **Curated SEO Playbook & 4-Pillar Deterministic Grading (`0–100` / `A+`–`F`):** Audits **On-Page SEO**, **Content & WCAG Accessibility**, **Performance & Clean DOM**, and **Off-Page / Internal Linking Readiness** deterministically from versioned rules grounded in Semrush, Ahrefs, and Google Search Central standards.
3. **100% Design System & `grex.elements.json` Fidelity:** Consumes live `GRAB-DESIGN-SYSTEM.md` tokens (`--grex-*`) and reusable classes (`.grex-c-*`), composes strictly from the 20 zero-wrapper-`<div>` semantic elements, preserves `GrabDecimal` / `GrabInteger` string precision, and enforces `auditAccessibility()` (`4.5:1` contrast, `alt` text, heading hierarchy, form labels).
4. **Local-First & Zero Bloat:** Runs directly on **GRAB `v1.1.0`** (`Grisp` / `grab mcp`) and **Grex JS `v1.0.0`** with optional local model reasoning (Ollama / OpenCode), `--read-only` container readiness, and strict SSRF protections.

---

## Ecosystem Compatibility Matrix

| Ecosystem Layer | Repository | Required Version Range | Role in Stack |
|---|---|---|---|
| **Core Language, Bytecode VM & Grisp Server** | `urbanspress/grab` | `>= v1.1.0 (< v2.0.0)` | Runtime, `grab mcp`, `use http`/`json`/`data`/`cache`/`crypto` |
| **Reactive Frontend Runtime & 20-Element Library** | `urbanspress/grex-js` | `>= v1.0.0 (< v2.0.0)` | Signals, 20 semantic elements, `validateElementNode`, `auditAccessibility` |
| **Flagship Zero-Plugin CMS** | `urbanspress/grablab-cms` | `>= v1.0.1 (< v2.0.0)` | Content types, `query_entries`, `create_entry_draft`, `list_media`, `list_menus` |
| **Exclusive `mode: "visual"` Theme & Studio** | `urbanspress/grex-builder` | `>= v1.0.0 (< v2.0.0)` | `GRAB-DESIGN-SYSTEM.md`, `POST /api/mcp/layout`, undo/redo command stack |
| **Autonomous Design, Content & SEO Agent** | `urbanspress/groxy-ai` | `v0.1.0` *(Spec in Review)* | SEO Playbook, deterministic auditor, boost diffs, safe AI layout composer |

---

## Current Status & Governance
- **Repositories:** `urbanspress/groxy-ai.progress` (active development) / `urbanspress/groxy-ai.stable` (verified milestone releases only)
- **Current Milestone:** `v0.1.0` — **Specification in Review** ([`specifications/GROXY-AI-SPEC-001.md`](specifications/GROXY-AI-SPEC-001.md) awaits project-owner approval before code implementation begins).
- **Governance & Roadmap:** See [`GROXY-EXPERT.md`](GROXY-EXPERT.md), [`AGENTS.md`](AGENTS.md), [`HANDOFF.md`](HANDOFF.md), and [`docs/ROADMAP.md`](docs/ROADMAP.md).

---

## License
MIT License — see [`LICENSE`](LICENSE).
