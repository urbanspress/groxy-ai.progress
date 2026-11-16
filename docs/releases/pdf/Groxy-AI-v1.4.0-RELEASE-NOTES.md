# Groxy AI v1.4.0 — Release Notes

**Released:** 2026-11-16  
**Status:** Approved & Frozen — Complete  
**Release tier:** Backwards-compatible minor feature release (`1.x.0`)

## Release Type & Affected Layers

- **Release Version & SemVer Tier:** `v1.4.0` (MINOR `1.x.0` — Backwards-Compatible Feature Release)
- **Affected Layer(s):** Autonomous Design, Content & SEO Agent (`urbanspress/groxy-ai`)
- **Neighboring Layer Upgrade Required?** No — 100% drop-in compatible

| Ecosystem Layer | Repository | Required Version Range | Touched in This Release? | Neighbor Upgrade Required? |
|---|---|---|---|---|
| **Core Language, Bytecode VM & Grisp Server** | `urbanspress/grab` | `>= v1.1.0 (< v2.0.0)` | No | No |
| **Reactive Frontend Runtime & 20-Element Library** | `urbanspress/grex-js` | `>= v1.0.0 (< v2.0.0)` | No | No |
| **Flagship Zero-Plugin CMS** | `urbanspress/grablab-cms` | `>= v1.0.1 (< v2.0.0)` | No | No |
| **Exclusive `mode: "visual"` Theme & Studio** | `urbanspress/grex-builder` | `>= v1.0.0 (< v2.0.0)` | No | No |
| **Autonomous Design, Content & SEO Agent** | `urbanspress/groxy-ai` | `>= v0.1.0` | Yes | No |

## What’s included

- Five grounded commerce engines for recovery, concierge, bundles, review mining and coordinated campaigns.
- Exact decimal-string arithmetic and validation for prices, discounts, totals and currencies.
- Safe, review-first output with draft-only CMS staging and undoable Builder changes. Sending, publication and campaign activation remain disabled.
- Target-bound, single-use approval with durable race protection and explicit reconciliation after partial downstream failures.
- Semantic Commerce Studio controls and previews with Light/Dark accessibility validation, keyboard operation, safe text rendering, and provider-secret redaction.

## Verification

- `grab check --platform-config grab.platform.json src/groxy.grab` passed.
- Canonical `grab format` output matched `src/groxy.grab` and `scripts/migrate_commerce.grab` byte-for-byte.
- `node --test tests/*.test.js`: 72 passed, 0 failed.
- `python tests/integration_e2e.py`: passed; release-ready status `True`, including live CMS/Builder recovery and the two-process `201`/`409` approval race.

See `Groxy-AI-v1.4.0-Guide.pdf` for the plain-English walkthrough.
