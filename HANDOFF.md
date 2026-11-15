# HANDOFF.md — Groxy AI

- **Current Owner:** Google Antigravity -> **Recommended Pause for `Orchestrator (Argon)`** (`v0.4.0` **Complete** & synchronized to `origin` & `stable`; mandatory Pre-`v1.0.0` Cross-Layer Security, DOM & Contract Audit required before starting `v1.0.0`)
- **Current Milestone State:** `v0.4.0` **Complete** (`specifications/GROXY-AI-SPEC-004.md`; synchronized to `origin` & `stable`)
- **Next Milestone:** Pre-`v1.0.0` Cross-Layer Audit (`Orchestrator (Argon)`) -> `v1.0.0` Production Release, Hardened `--read-only` Container Packaging & Full Ecosystem E2E Verification (see `docs/ROADMAP.md`)

---

## Frozen Upstream Contracts (Unmodified)
- **GRAB:** `v1.1.0` (`urbanspress/grab`)
- **Grex JS:** `v1.0.0` (`urbanspress/grex-js`)
- **GrabLab CMS:** `v1.0.1` (`urbanspress/grablab-cms`)
- **Grex Theme Builder:** `v1.0.0` (`urbanspress/grex-builder`)

---

## `v0.4.0` Completion Summary
1. **`specifications/GROXY-AI-SPEC-004.md` & `docs/ROADMAP.md`:** Both marked `Complete`.
2. **Core Implementation Verified (`100%` pass):**
   - `grab check --platform-config grab.platform.json src/groxy.grab`: exit `0`
   - Non-destructive `grab format src/groxy.grab` byte-for-byte parity: verified exact match
   - `node --test tests/*.test.js`: `35/35` passing (`unit_auditor.test.js`, `unit_booster.test.js`, `unit_enrichment.test.js`, `unit_generator.test.js`, `unit_mcp_client.test.js`, `unit_playbook.test.js`, `unit_site_intelligence.test.js`, `unit_ui_dom.test.js`) covering all 40 Style Pack × Blueprint combinations, `?goal=`/`?industry=` filtering, live `SITE-CONTEXT.md` sync with `ADR-025c` pricing, internal linking graph + strict `301` loop exclusion, XSS-safe `</script>`-escaped `schema.org` JSON-LD + `422` float rejection, Media `alt` enrichment with decorative preservation + single-use `approval_token`, Nightly Watch Morning Boost Report, Portable Site DNA export, and zero wrapper `<div>`s / zero `innerHTML` across `/groxy`
   - `python tests/integration_e2e.py`: Gates `1`, `2`, `3A` (`GRAB v1.1.0 grab mcp`), and `3B` (live **GrabLab CMS `v1.0.1` + Grex Theme Builder `v1.0.0` + Groxy AI `v0.4.0`**) passing `100%`
3. **Release Artifacts Generated:**
   - `docs/releases/pdf/Groxy-AI-v0.4.0-Guide.pdf` (`docs/releases/generate_release_guides.py 0.4.0`)
   - `dist/groxy-ai-v0.4.0-bundle.zip` & `dist/SHA256SUMS.txt` (`scripts/package_release.py 0.4.0`)

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

## Next Step Guidance (Mandatory Pre-`v1.0.0` Audit)
1. **Pause & Switch to `Orchestrator (Argon)`:** Before drafting `specifications/GROXY-AI-SPEC-005.md` or implementing `v1.0.0`, switch to **`Orchestrator (Argon)`** to run the mandatory Pre-`v1.0.0` Cross-Layer Security, DOM & Contract Audit across GRAB `v1.1.0`, Grex JS `v1.0.0`, GrabLab CMS `v1.0.1`, Grex Theme Builder `v1.0.0`, and Groxy AI `v0.4.0`.
2. **After Audit Approval:** Draft `specifications/GROXY-AI-SPEC-005.md` for `v1.0.0` (Hardened `--read-only` Container Packaging, SemVer `v1.x` Freeze & Full Ecosystem E2E) and obtain explicit project-owner approval before coding.
