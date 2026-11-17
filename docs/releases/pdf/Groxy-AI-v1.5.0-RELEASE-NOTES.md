# Groxy AI v1.5.0 — Release Notes

**Released:** 2026-11-16  
**Status:** Approved & Frozen — Complete  
**Release tier:** Backwards-compatible minor feature release (`1.x.0`)

## Release Type & Affected Layers

- **Release Version & SemVer Tier:** `v1.5.0` (MINOR `1.x.0` — Backwards-Compatible Feature Release)
- **Affected Layer(s):** Autonomous Design, Content & SEO Agent (`urbanspress/groxy-ai`)
- **Neighboring Layer Upgrade Required?** No — 100% drop-in compatible

| Ecosystem Layer | Repository | Required Version Range | Touched in This Release? | Neighbor Upgrade Required? |
|---|---|---|---|---|
| **Core Language, Bytecode VM & Grisp Server** | `urbanspress/grab` | `>= v1.1.0 (< v2.0.0)` | No | No |
| **Reactive Frontend Runtime & 20-Element Library** | `urbanspress/grex-js` | `>= v1.0.0 (< v2.0.0)` | No | No |
| **Flagship Zero-Plugin CMS** | `urbanspress/grablab-cms` | `>= v1.0.1 (< v2.0.0)` | No | No |
| **Exclusive `mode: "visual"` Theme & Studio** | `urbanspress/grex-builder` | `>= v1.0.0 (< v2.0.0)` | No | No |
| **Autonomous Design, Content & SEO Agent** | `urbanspress/groxy-ai` | `>= v0.1.0` | Yes (v1.5.0) | No |

## What’s included

- **Bespoke Store Architecture Quiz (`POST /api/groxy/db/architect-quiz`):** An 8-step semantic interview generating lean, zero-bloat `.grab` database migrations (`ADR-024f` + `ADR-025c`) with exact numeric validation, single-use `dtok_<hex>` approval tokens, and impact assessments (*Safe*, *Caution*, *High-Risk Data Loss*).
- **Opt-In "Talk to Groxy" Database & Store Consultant (`POST /api/groxy/db/consult`):** Default-disabled 403 protection (`GROXY_DB_CONSULTANT_ENABLED: true`), grounded in live `sqlite_master` row counts and tables via statically configured `commerce_inspect:read` alias, `SCHEMA-CONTEXT.md`, and `SITE-CONTEXT.md`. High-risk operations require explicit `risk_acknowledged: true`, and turning off the consultant revokes outstanding consultant approvals at apply time.
- **Target Locks & Pre-Mutation Logical Snapshots (`POST /api/groxy/db/apply`):** Durable per-target locking (`db_target_locks`) and atomic single-winner approval consumption (`db_consultant_ledger`) with single-winner race resolution (`201` winner, `409` conflict/replay). Captures canonical UTF-8 JSON Pre-Mutation Snapshots (`storage/snapshots/snap_db_<id>.json` + `snapshot_sha256`) before mutation, with deterministic fixture restore logic that protects subsequent live orders.
- **Separation of HTTP & DDL / Post-Maintenance Reconciliation (`POST /api/groxy/db/reconcile`):** HTTP handlers never execute DDL. The server writes canonical CLI maintenance programs (`storage/approved_migrations/mig_<plan_id>.grab` + `.receipt.json`) returning status `maintenance_ready`, or dispatches to verified loopback executors (`127.0.0.1:9490`) returning status `applied`. Reconcile verifies live table creation, transitions maintenance receipts to `applied`, and releases target locks.
- **Semantic Store & Consultant Studio UI:** Labeled, accessible semantic DOM with zero `<div>` wrappers, zero `innerHTML` writes, and 100% WCAG AA contrast conformance across Light and Dark themes.

## Verification

- `grab check --platform-config grab.platform.json src/groxy.grab` passed with zero errors.
- Canonical `grab format` matched `src/groxy.grab` and `scripts/migrate_commerce.grab` byte-for-byte.
- `node --test tests/*.test.js`: 80 passed, 0 failed (including zero `<div>` tags, zero `innerHTML` writes, and WCAG AA Light/Dark contrast).
- `python tests/integration_e2e.py`: passed 100% with `release-ready: True`, including live CMS/Builder recovery, pre-mutation snapshot SHA-256 verification, CLI maintenance execution, post-maintenance reconciliation, and two-worker `201`/`409` atomic single-winner contention.
- All 8 frozen sibling repositories in `C:\Development\*` verified 100% clean with zero modifications.

See `Groxy-AI-v1.5.0-Guide.pdf` for the complete plain-English walkthrough.
