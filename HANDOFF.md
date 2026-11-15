# HANDOFF.md — Groxy AI

- **Current Owner:** Google Antigravity (`Google Hydrogen (Medium)` — `v0.4.0` **Approved target; specification in review** — `specifications/GROXY-AI-SPEC-004.md` drafted and awaiting explicit project-owner approval before writing `v0.4.0` application code)
- **Current Milestone State:** `v0.3.0` **Complete** (`specifications/GROXY-AI-SPEC-003.md`; synchronized to `origin` & `stable`); `v0.4.0` **Approved target; specification in review** (`specifications/GROXY-AI-SPEC-004.md`)
- **Next Milestone:** `v0.4.0` — Site-Wide Internal Linking Graph, Schema.org JSON-LD, Media `alt`-Text Enrichment & Non-Intrusive Background Snapshot Workflows (see `docs/ROADMAP.md`)

---

## Frozen Upstream Contracts (Unmodified)
- **GRAB:** `v1.1.0` (`urbanspress/grab`)
- **Grex JS:** `v1.0.0` (`urbanspress/grex-js`)
- **GrabLab CMS:** `v1.0.1` (`urbanspress/grablab-cms`)
- **Grex Theme Builder:** `v1.0.0` (`urbanspress/grex-builder`)

---

## `v0.3.0` Completion Summary
1. **`specifications/GROXY-AI-SPEC-003.md` & `docs/ROADMAP.md`:** Both marked `Complete`.
2. **Core Implementation Verified (`100%` pass):**
   - `grab check --platform-config grab.platform.json src/groxy.grab`: exit `0`
   - Non-destructive `grab format src/groxy.grab` byte-for-byte parity: verified exact match
   - `node --test tests/unit_*.test.js`: `28/28` passing (`unit_auditor.test.js`, `unit_booster.test.js`, `unit_generator.test.js`, `unit_mcp_client.test.js`, `unit_playbook.test.js`, `unit_ui_dom.test.js`) covering all 20 Style Pack × Blueprint combinations, live `GRAB-DESIGN-SYSTEM.md` tokens & `.grex-c-*` reuse, contrast repair, `ForEach` `queryLoop`, exact `ADR-025c` `GrabDecimal`/`GrabInteger` wire preservation & JS float rejection, single-use `approval_token`, and zero wrapper `<div>`s / zero `innerHTML` writes across the Visual Generator Studio UI
   - `python tests/integration_e2e.py`: Gates `1`, `2`, `3A` (`GRAB v1.1.0 grab mcp`), and `3B` (live **GrabLab CMS `v1.0.1` + Grex Theme Builder `v1.0.0` + Groxy AI `v0.3.0`** including live `GET /api/design-system.md`, `GET /api/groxy/style-packs`, `POST /api/groxy/generate-layout`, `POST /api/groxy/generate-layout/apply` -> `POST /api/mcp/layout` with `actor: "groxy-ai"`, GrabLab `status_enforced: "draft"`, `applyAiLayout` command verification, and 1-click Undo restoration) passing `100%`
3. **Release Artifacts Generated:**
   - `docs/releases/pdf/Groxy-AI-v0.3.0-Guide.pdf` (`docs/releases/generate_release_guides.py 0.3.0`)
   - `dist/groxy-ai-v0.3.0-bundle.zip` & `dist/SHA256SUMS.txt` (`scripts/package_release.py 0.3.0`)

## `v0.2.0` Completion Summary
- Opt-in Pre-Publish SEO & Performance Grade Review Gate (`POST /api/groxy/prepublish-review`) and 🚀 `"Let Groxy Boost This"` Side-by-Side Diff engine (`POST /api/groxy/boost`, `POST /api/groxy/boost/approve`), walkthrough PDF, and synchronized `origin`/`stable` `v0.2.0` releases complete.

## `v0.1.0` Completion Summary
- Core `grab mcp` bridge, curated 22-rule SEO playbook, deterministic 4-pillar auditor (`0–100`, `A+`–`F`), zero-`<div>` `/groxy` Inspector UI, walkthrough PDF, and synchronized `origin`/`stable` `v0.1.0` releases complete.

---

## Next Step Guidance (for `v0.4.0`)
1. **Spec-First Approval Gate:** `specifications/GROXY-AI-SPEC-004.md` is drafted and in review (`Approved target; specification in review`). Do NOT write `v0.4.0` application code until the project owner explicitly approves `specifications/GROXY-AI-SPEC-004.md`.
2. **Recommended Model for Next Step:** Once `specifications/GROXY-AI-SPEC-004.md` is explicitly approved by the project owner, switch to **`Google Hydrogen (High)`** to implement `v0.4.0` cleanly across all modules and verification gates.
