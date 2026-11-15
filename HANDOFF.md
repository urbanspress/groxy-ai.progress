# HANDOFF.md — Groxy AI

- **Current Owner:** Google Antigravity (`Google Hydrogen (High)` — `v0.2.0` complete; switch to `Google Hydrogen (Medium)` before drafting `specifications/GROXY-AI-SPEC-003.md` for `v0.3.0`)
- **Current Milestone State:** `v0.2.0` **Complete** (`specifications/GROXY-AI-SPEC-002.md`)
- **Next Milestone:** `v0.3.0` — Autonomous `GRAB-DESIGN-SYSTEM.md`-Aware Visual Page & Section Generator for Grex Theme Builder (see `docs/ROADMAP.md`)

---

## Frozen Upstream Contracts (Unmodified)
- **GRAB:** `v1.1.0` (`urbanspress/grab`)
- **Grex JS:** `v1.0.0` (`urbanspress/grex-js`)
- **GrabLab CMS:** `v1.0.1` (`urbanspress/grablab-cms`)
- **Grex Theme Builder:** `v1.0.0` (`urbanspress/grex-builder`)

---

## `v0.2.0` Completion Summary
1. **`specifications/GROXY-AI-SPEC-002.md` & `docs/ROADMAP.md`:** Both marked `Complete`.
2. **Core Implementation Verified (`100%` pass):**
   - `grab check --platform-config grab.platform.json src/groxy.grab`: exit `0`
   - Non-destructive `grab format src/groxy.grab` byte-for-byte parity: verified exact match
   - `node --test tests/unit_*.test.js`: `19/19` passing (`unit_auditor.test.js`, `unit_booster.test.js`, `unit_mcp_client.test.js`, `unit_playbook.test.js`, `unit_ui_dom.test.js`) with zero wrapper `<div>`s, zero `innerHTML`, exact `ADR-025c` `GrabDecimal`/`GrabInteger` preservation, and 100% WCAG AA pass across the Pre-Publish Grade Review Screen and Side-by-Side Diff Viewer
   - `python tests/integration_e2e.py`: Gates `1`, `2`, `3A` (`GRAB v1.1.0 grab mcp`), and `3B` (live **GrabLab CMS `v1.0.1` + Grex Theme Builder `v1.0.0` + Groxy AI `v0.2.0`**) passing `100%`
3. **Release Artifacts Generated:**
   - `docs/releases/pdf/Groxy-AI-v0.2.0-Guide.pdf` (`docs/releases/generate_release_guides.py 0.2.0`)
   - `dist/groxy-ai-v0.2.0-bundle.zip` & `dist/SHA256SUMS.txt` (`scripts/package_release.py 0.2.0`)

## `v0.1.0` Completion Summary
- Core `grab mcp` bridge, curated 22-rule SEO playbook, deterministic 4-pillar auditor (`0–100`, `A+`–`F`), zero-`<div>` `/groxy` Inspector UI, walkthrough PDF, and synchronized `origin`/`stable` `v0.1.0` releases complete.

---

## Next Step Guidance (for `v0.3.0`)
1. Switch to **`Google Hydrogen (Medium)`** to draft `specifications/GROXY-AI-SPEC-003.md` for `v0.3.0` (Autonomous `GRAB-DESIGN-SYSTEM.md`-Aware Visual Page & Section Generator for Grex Theme Builder) and pause for explicit project-owner approval (`Spec-First Approval Gate`).
2. After `specifications/GROXY-AI-SPEC-003.md` is approved, implement `v0.3.0` using **`Google Hydrogen (High)`** (or **`Google Hydrogen (Extra)`** / **`Orchestrator (Argon)`** if deep multi-section Theme Builder layout synthesis and live cross-layer undo/preview checks require extra coordination).
