# Groxy AI v1.6.0 — Release Notes

**Released:** 2026-11-17  
**Status:** Approved & Frozen — Complete  
**Release tier:** Backwards-compatible minor feature release (`1.x.0`)

## Release Type & Affected Layers

- **Release Version & SemVer Tier:** `v1.6.0` (`MINOR 1.x.0` — Backwards-Compatible Feature Release)
- **Affected Layer(s):** Autonomous Design, Content & SEO Agent (`urbanspress/groxy-ai`)
- **Neighboring Layer Upgrade Required?** No — 100% drop-in compatible

| Ecosystem Layer | Repository | Required Version Range | Touched in This Release? | Neighbor Upgrade Required? |
|---|---|---|---|---|
| **Core Language, Bytecode VM & Grisp Server** | `urbanspress/grab` | `>= v1.1.0 (< v2.0.0)` | No | No |
| **Reactive Frontend Runtime & 20-Element Library** | `urbanspress/grex-js` | `>= v1.0.0 (< v2.0.0)` | No | No |
| **Flagship Zero-Plugin CMS** | `urbanspress/grablab-cms` | `>= v1.0.1 (< v2.0.0)` | No | No |
| **Exclusive `mode: "visual"` Theme & Studio** | `urbanspress/grex-builder` | `>= v1.0.0 (< v2.0.0)` | No | No |
| **Autonomous Design, Content & SEO Agent** | `urbanspress/groxy-ai` | `>= v0.1.0` | Yes (`v1.6.0`) | No |

## What’s included

- **Iterative Section Co-Pilot (`POST /api/groxy/section-refine` & `POST /api/groxy/section-refine/apply`):** Conversational per-section editing inside Grex Theme Builder patching *only* the target semantic subtree (`C1`) while preserving all sibling sections and ancestors byte-for-byte.
- **Golden-Ratio Design-Craft Playbook (`playbook/design-craft.v1.json`):** Fail-closed deterministic rulebook (`GROXY-CRAFT-001..005`) enforcing `8pt` spacing rhythm (`4pt` tight inline pairs only), `60–65ch` readable line measure, 1-primary-CTA-per-fold hierarchy, Light/Dark surface elevation (`--grex-surface-1` / `--grex-surface-2`, reporting `token_unavailable` per `C4` without inventing missing tokens or `65ch`), Light/Dark WCAG AA `>= 4.5:1` auto-contrast repair (`C6`), and live GrabLab CMS `ForEach`/`Form` wiring without fabricated form `action` URLs (`C7`).
- **Atomic Single-Use Approval & Sibling-Drift Protection (`C2`, `C3`, `C8`):** Stages side-by-side diffs with single-use `rtok_<hex>` tokens stored as hashes in `groxy_section_refine_ledger` (`scripts/migrate_commerce.grab` v3), rejects duplicate JSON keys (`400`), enforces full-slot `slot_sha256` freshness before and after atomic claim (`409 SECTION_SLOT_DRIFT`), resolves concurrent apply races (`201` winner, `403` mismatch, `409` replay/race), dispatches strictly via one-slot `POST /api/mcp/layout` (`actor: "groxy-ai"`), verifies readback digest parity, preserves 1-click `Ctrl+Z` `applyAiLayout` undo, and records terminal `dispatch_failed` outcomes on downstream outages.
- **Pure `Grex JS v1.0.0` Section Co-Pilot Studio UI (`views/dashboard.grab.html`, `public/groxy/dashboard.js`, `public/groxy/section-copilot.js`, `assets/section-copilot.js`):** Zero wrapper `<div>` elements, zero `innerHTML` writes, zero `eval()`, native `<details>` diff viewer, `<dialog>` confirmation with `Escape` + focus restoration, and Light/Dark WCAG AA contrast.

## Verification

- `C:\Development\GRAB\dist\grab-windows-amd64.exe check --platform-config grab.platform.json src/groxy.grab` and `scripts/migrate_commerce.grab` passed with zero errors.
- Canonical `grab format` matched `src/groxy.grab` and `scripts/migrate_commerce.grab` byte-for-byte.
- `node --test tests/*.test.js`: `87/87` passed (`0` failed), including `tests/unit_section_copilot.test.js` and `tests/unit_v100_production_audit.test.js`.
- `python tests/integration_e2e.py`: passed 100% across Gates 1, 2, 3A, and live 4-layer Gate 3B with `release-ready: True`.
- All 8 frozen sibling repositories in `C:\Development\*` verified clean with zero modifications; untracked `playbook/genres/` preserved.

See `Groxy-AI-v1.6.0-Guide.pdf` for the complete plain-English walkthrough.
