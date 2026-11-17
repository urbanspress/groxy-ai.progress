# GROXY-AI-SPEC-160 — Lovable/Base44-Style Iterative Section Co-Pilot & Golden-Ratio Design-Craft Engine

- **Version:** Groxy AI `v1.6.0`
- **Status:** Approved target; specification in review
- **Draft Date:** 2026-11-16
- **SemVer:** MINOR — backwards-compatible feature release (`ADR-027c`).
- **Frozen baselines:** Groxy AI `v1.0.0` through `v1.5.0`; GRAB `v1.1.0`; Grex JS `v1.0.0`; GrabLab CMS `v1.0.1`; Grex Theme Builder `v1.0.0`; Gashboard `v1.0.0`; Groxy Desk `v1.0.0`.
- **Governance:** [AGENTS.md](../AGENTS.md), [GROXY-EXPERT.md](../GROXY-EXPERT.md), [HANDOFF.md](../HANDOFF.md), [Roadmap](../docs/ROADMAP.md), [SPEC-150](GROXY-AI-SPEC-150.md).

## 1. Purpose, Scope & Approval Boundary

Let an operator refine one section of a Grex Theme Builder layout in plain conversation ("make this hero calmer, one button, shorter line length") and review a side-by-side diff before anything changes. Only the selected semantic subtree is patched; every sibling section stays byte-for-byte identical.

This milestone is **target-approved but the specification is not approved**. No v1.6.0 code in `src/`, `views/`, `assets/`, `playbook/`, `public/`, or `tests/` may be written until the owner explicitly approves this document. Preserve untracked `playbook/genres/`, frozen specs/releases `v1.0.0`–`v1.5.0`, and all sibling repositories. No upstream change is required or permitted; if a needed capability is missing, report it for owner review instead of inventing an endpoint.

Out of scope: auto-publish, silent overwrite, whole-page regeneration, new Grex elements, new CMS/Builder endpoints, hosted-AI requirements.

## 2. Shared Route Contract

Both routes require existing authenticated operator authorization and `X-CSRF-Token`; failures return `403` before any layout read or staging. Requests reject unknown fields, duplicate JSON keys, wrong types, and invalid identifiers (`HTTP 400`). Requests never accept raw URLs, paths, SQL, shell, or credentials.

| Route | Request | Result |
|---|---|---|
| `POST /api/groxy/section-refine` | `slot`, `section_id`, plain-English `instruction`, optional `generation_mode` | `200`: staged proposal with `refine_id`, before/after subtree, diff, audit report, `approval_token`; staging only, no layout write |
| `POST /api/groxy/section-refine/apply` | `refine_id`, `slot`, `section_id`, `subtree_sha256`, `approval_token` | `201` winner after dispatch to `POST /api/mcp/layout`; `403` token/binding mismatch or missing CSRF; `409` replay, stale layout, or lost race |

`generation_mode` is `deterministic` by default; `ollama` and `byok` are optional (Section 7). The `instruction` is untrusted: it is JSON-encoded before any provider prompt and can never alter routing, targets, or approval.

## 3. Targeted Subtree Patching

1. Read the current layout for `slot` via the existing Builder contract and locate `section_id`. Unknown slot or section → `404`; ambiguous or duplicate id → `422`.
2. Compute `subtree_sha256` over the canonical UTF-8 JSON of the selected subtree. Generate a replacement subtree only for that node.
3. Splice the replacement into the original layout; assert all siblings and ancestors are unchanged (canonical-JSON equality). Any sibling drift aborts with `422` and no staging.
4. If the layout changes between propose and apply (subtree hash differs), apply returns `409` with a message to re-run refinement.
5. Preserve existing human copy unless the instruction explicitly targets it; changed text is shown highlighted in the diff.

## 4. Design-System & Safety Enforcement (Fail Closed)

Every proposed subtree must pass before staging; failures return `422` with rule ids and no token.

- **Grex elements:** only the 20 semantic elements in `grex.elements.json`; `divCount === 0` and `innerHTMLWriteCount === 0`; no unsafe URLs or inline script.
- **Tokens & classes:** only live `--grex-*` tokens and `.grex-c-*` classes from `GET /api/design-system.md`; unknown tokens/classes are rejected, not invented.
- **Contrast:** Light and Dark WCAG AA `>= 4.5:1` for normal text; auto-repair swaps to the nearest passing token pair and records the repair in the report. Unrepairable → `422`.
- **Exact numbers (`ADR-025c`):** `GrabDecimal` values travel as exact base-10 wire strings; JS floats or non-canonical numerics in prices/quantities are rejected with HTTP `422`.
- **Quality gate:** the existing 22-rule, 4-pillar audit must grade `A` or `A+` with `publish_safe: true`; otherwise no approval token is issued.

## 5. Approval Token, Diff & Apply

- The proposal shows a side-by-side subtree diff (before / after, rendered text-only and as structure) plus the audit and repair report.
- `approval_token` is single-use, format `rtok_<hex>` (CSPRNG, ≥128 bits), stored as a hash, bound to `{ refine_id, slot, section_id, subtree_sha256 }`, and expires after a bounded TTL (default 15 minutes).
- Apply validates `X-CSRF-Token`, then atomically consumes the token in a durable ledger (single-winner): `201` winner; `403` binding mismatch; `409` replay, expiry-after-use, or concurrent race. A losing worker never dispatches.
- The winner dispatches the full spliced layout to `POST /api/mcp/layout` with `actor: "groxy-ai"`, preserving 1-click `Ctrl+Z` `applyAiLayout` undo parity. Downstream failure records a recoverable partial outcome and does not leave the token reusable.
- The UI is Grex semantic HTML only: labeled textarea, native `<details>` for the diff, `<dialog>`/aside confirmation with Escape handling and focus restoration, text-only rendering, zero wrapper `<div>`.

## 6. Golden-Ratio Design-Craft & Visual Rhythm Playbook (`playbook/design-craft.v1.json`)

A deterministic, versioned rulebook with an offline auditor (no network, no fees). Each rule has an id, severity, checker, and a deterministic repair where safe.

| Rule family | Check |
|---|---|
| Spacing rhythm | All gaps/padding map to the `8pt` scale (4pt allowed only for tight inline pairs) via `--grex-*` spacing tokens |
| Line measure | Body copy measure `60–65ch`; wider/narrower containers flagged and repaired with the measure token |
| CTA hierarchy | Exactly one primary CTA per fold; extra primaries demoted to secondary |
| Surface elevation | Light/Dark cards and panels use `--grex-surface-1` / `--grex-surface-2` in consistent order; contrast re-verified in both themes |
| Full-stack wiring | Generated forms and `ForEach` grids bind to live GrabLab CMS content types and fields; `GrabDecimal` fields keep exact wire strings; unknown content types or fields are reported, never fabricated |

The playbook is data, loaded by the auditor; user-provided instructions cannot disable rules. Results appear in the proposal report and feed the Section 4 quality gate. Playbook files are schema-validated at startup; a malformed playbook fails closed.

## 7. Generation Modes & Outbound Safety

- **Deterministic (default):** template/rule-based refinement from the playbook and design system; works offline with zero API fees.
- **Optional local Ollama:** only `127.0.0.1:11434`, opt-in, bounded timeout and response size.
- **Optional BYOK:** opt-in; destinations must pass the `GRAB-E402` SSRF allowlist (no private, loopback-other, link-local, or metadata IPs; redirects revalidated). Credentials are never returned or logged.
- Provider output is untrusted: it goes through the same Section 3–4 validation as deterministic output. Provider failure falls back to deterministic output or returns a clear error, never an unvalidated layout.

## 8. Storage, Bounds & Audit Trail

Proposals, tokens (hashed), and a ledger live under `storage/` with bounds: instruction ≤ 2,000 chars, subtree ≤ 64 KB, ≤ 20 pending proposals per operator, TTL cleanup. The audit trail records refine id, actor, slot, section, hashes, rule results, outcome, and timestamps; never secrets or full provider prompts. No migration or change to frozen database schemas outside additive tables for this ledger.

## 9. Acceptance & Verification Gates — Required After Owner Approval

1. `grab check --platform-config grab.platform.json` passes on all `.grab` / `.grab.html` with zero errors; `grab format <file>` stdout matches each `.grab` file byte-for-byte.
2. **Unit/DOM/a11y (`node --test tests/*.test.js`):** subtree isolation (siblings identical), unknown/duplicate section ids, `divCount === 0`, `innerHTMLWriteCount === 0`, unsafe-URL rejection, unknown token/class rejection, Light/Dark WCAG AA `>= 4.5:1` with auto-repair, `auditAccessibility()` pass on the UI and proposals.
3. **Numerics:** JS-float price/decimal rejected `422`; exact strings round-trip.
4. **Playbook:** each design-craft rule has pass/fail/repair fixtures (8pt, 60–65ch, one primary CTA, surface elevation, CMS/`ForEach` wiring); malformed playbook fails closed.
5. **Approval/security:** missing/invalid CSRF `403`; token binding mismatch `403`; replay `409`; two-process race yields exactly one `201` and one `409`; stale layout `409`; prompt-injection instructions cannot change routing; BYOK SSRF blocked; secrets absent from responses/logs; no auto-publish.
6. **Live Gate 3B (`python tests/integration_e2e.py`):** propose → diff → apply through real `POST /api/mcp/layout` with `actor: "groxy-ai"`, undo parity verified, downstream failure recovery, `release-ready: True`.
7. All frozen `v1.0.0`–`v1.5.0` tests still pass; sibling repositories and `playbook/genres/` unmodified.
8. Release only after owner approval, dual-remote protocol per `AGENTS.md`, with five-layer compatibility matrix and walkthrough PDF.

## 10. Owner Review & Next Phase

Approve, request changes, or reject this specification. Next step after approval: **Stage 2** pre-implementation cross-layer security & contract audit (see model routing in `AGENTS.md`), then Stage 3 implementation.
