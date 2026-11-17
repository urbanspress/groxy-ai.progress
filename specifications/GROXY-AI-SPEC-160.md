# GROXY-AI-SPEC-160 — Lovable/Base44-Style Iterative Section Co-Pilot & Golden-Ratio Design-Craft Engine

- **Version:** Groxy AI `v1.6.0`
- **Status:** Approved & Frozen — Complete (implemented and verified against all Section 9 & Section 11 C1–C8 gates on 2026-11-17)
- **Draft Date:** 2026-11-16
- **SemVer:** MINOR — backwards-compatible feature release (`ADR-027c`).
- **Frozen baselines:** Groxy AI `v1.0.0` through `v1.5.0`; GRAB `v1.1.0`; Grex JS `v1.0.0`; GrabLab CMS `v1.0.1`; Grex Theme Builder `v1.0.0`; Gashboard `v1.0.0`; Groxy Desk `v1.0.0`.
- **Governance:** [AGENTS.md](../AGENTS.md), [GROXY-EXPERT.md](../GROXY-EXPERT.md), [HANDOFF.md](../HANDOFF.md), [Roadmap](../docs/ROADMAP.md), [SPEC-150](GROXY-AI-SPEC-150.md).

## 1. Purpose, Scope & Approval Boundary

Let an operator refine one section of a Grex Theme Builder layout in plain conversation ("make this hero calmer, one button, shorter line length") and review a side-by-side diff before anything changes. Only the selected semantic subtree is patched; every sibling section stays byte-for-byte identical.

The project owner **approved this specification as written on 2026-11-16**, and the Stage 2 cross-layer audit passed (Section 11). Stage 3 implementation in `src/`, `views/`, `assets/`, `playbook/`, `public/`, and `tests/` is authorized within this document and the Section 11 implementation conditions. Preserve untracked `playbook/genres/`, frozen specs/releases `v1.0.0`–`v1.5.0`, and all sibling repositories. No upstream change is required or permitted; if a needed capability is missing, report it for owner review instead of inventing an endpoint.

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

**Approved as written (2026-11-16).** Stage 2 pre-implementation cross-layer security & contract audit: **`PASS`** (Section 11). Next phase: **Stage 3** implementation and the Section 9 acceptance gates on **Claude Sonnet (High)** per the `AGENTS.md` routing matrix.

## 11. Stage 2 Pre-Implementation Cross-Layer Security & Contract Audit — `PASS` (2026-11-16)

**Auditor:** Google Antigravity — Claude Opus (High), Stage 2 routing. **Method:** read-only inspection of frozen Grex Theme Builder `v1.0.0` (`src/studio.grab`, `theme/assets/{schema,commands,store}.js`, `theme/grex.elements.json`, `theme/assets/tokens.css`, `HANDOFF.md`) and GrabLab CMS `v1.0.1` (`src/app.grab` MCP tool schemas and field types, `HANDOFF.md`), plus existing Groxy AI `v1.0.0`–`v1.5.0` Builder/CMS clients, ledgers, and `GRAB-E402` checks. Both sibling working trees were clean before and after the audit. **No upstream code change is required.**

### 11.1 Contract Verification Matrix

| SPEC-160 requirement | Frozen upstream evidence | Verdict |
|---|---|---|
| Read current slot layout (Section 3.1) | Builder `GET /api/studio/state` returns `{ csrf_token, draft, published }`; templates live at `draft.templates[slot]`, parts at `draft.parts[key]` addressed as `part:<key>` (the same addressing `POST /api/mcp/layout` uses). Already consumed by Groxy `v0.3.0`–`v1.4.0`. | `PASS` |
| `section_id` resolution, unknown `404`, duplicate `422` | Builder node identity is `node.id`, else `node.props.id` (`schema.js` `getNodeId`). The Builder client rejects duplicate ids, but the server `validate_grex_node` does not, so Groxy must enforce uniqueness itself (Condition C1). | `PASS` |
| Sibling/ancestor byte-for-byte preservation | `POST /api/mcp/layout` (`slot` + `layout`) replaces exactly one slot tree; other slots and parts are untouched. Siblings inside the slot are preserved only if Groxy splices correctly, which Section 3.3 already asserts via canonical-JSON equality. | `PASS` |
| 20-element compliance, `divCount === 0`, `innerHTMLWriteCount === 0`, unsafe URLs | Builder server rejects `div`/`script`/`iframe`/`object`/`style` tags, `on*`/`innerHTML`/`outerHTML`/`srcdoc` attributes, unsafe `href`/`src`/`action`/`formaction`, CSS `expression(`, and depth `> 24` (`GREX-SCHEMA-001`, `GREX-SEC-003/004`, HTTP `422` / `-32602`). It also accepts the structural `Fragment`/`TemplatePart` nodes, so Groxy's stricter 20-element gate on proposed subtrees stays authoritative (C5). | `PASS` |
| Live `--grex-*` / `.grex-c-*` resolution | `GET /api/design-system.md` (`text/markdown`, `no-store`) lists the **published** document's `theme.tokens`, `theme.modes.{light,dark}`, and `classes`. Shipped defaults define `--grex-bg`, `--grex-surface`, `--grex-ink`, `--grex-muted`, `--grex-accent`, `--grex-space-sm/md/lg` (`12px`/`24px`/`48px`), and `--grex-max-width`, but **not** `--grex-surface-1`/`--grex-surface-2` or a line-measure token (C4). | `PASS` (conditional on C4) |
| Light/Dark WCAG AA `>= 4.5:1` + auto-repair | Builder `audit_grex_tree_a11y` checks contrast against one default background only; Groxy's existing Light/Dark contrast engine (`v1.1.0`+) remains the authoritative dual-theme gate (C6). | `PASS` |
| `ADR-025c` exact base-10 `GrabDecimal` | CMS field types are `text`, `rich_text`, `integer`, `decimal`, `boolean`, `date`, `url`, `json`; Builder stores layouts via `json.stringify` on string-valued props. Prices travel as strings end-to-end, as verified in `v0.3.0`–`v1.5.0` Gate 3B. | `PASS` |
| `GRAB-E402` SSRF allowlisting | GRAB `v1.1.0` default-deny `--allow-net`. Groxy already enforces exact-origin HTTPS BYOK allowlisting, metadata/private-IP rejection, and `GRAB-E402` mapping (`v1.1.0`, `v1.2.0`, `v1.3.0`, `v1.4.0`); Ollama is limited to `127.0.0.1:11434`. | `PASS` |
| Single-winner `rtok_<hex>` (`201` / `403` / `409`) | Groxy's durable SQLite ledger pattern (`UPDATE ... SET status = 'applying' WHERE id = :id AND status = 'staged'`, deferred-lock race fixed in `v1.5.0`) already proves exactly one `201` and one `409` across independent processes. Needs only an additive Groxy-owned ledger table (Section 8). | `PASS` |
| `POST /api/mcp/layout` with `actor: "groxy-ai"` + 1-click `Ctrl+Z` | The Builder checks `X-CSRF-Token` (`403`), validates, writes the draft, and records an `applyAiLayout` command whose `inverse` holds the server-read `before` slot tree. Ctrl+Z therefore restores the exact pre-apply slot. The Builder never publishes, so live traffic is unaffected. | `PASS` |
| GrabLab CMS content-type/field wiring | `list_content_types` returns content types with `field_definitions` (`field_key`, `field_type`); `query_entries` supports `content_type`, `field_*`, `filter_by_term`, sort and pagination. Builder `ForEach` binds through `queryLoop` + `props.query` `{ content_type, per_page (string), sort_by, sort_dir, filter_by_term? }`, and dynamic bindings are limited to `text`/`label`/`title`/`alt`/`href`/`src`. CMS `v1.0.1` exposes **no public form-submission endpoint** (C7). | `PASS` (conditional on C7) |

### 11.2 Binding Stage 3 Implementation Conditions (No Upstream Change)

These conditions clarify how to implement the approved requirements against the frozen contracts. They do not add request fields or endpoints.

- **C1 — Identity & targeting:** Resolve `section_id` with Builder semantics (`node.id`, then `node.props.id`). Count matches across the whole slot tree: `0` → `404`; `> 1` → `422`. Never target the slot root, a `Fragment`, or a `TemplatePart` reference, since these are structural Builder nodes outside the 20-element set. Preserve them byte-for-byte as ancestors/siblings.
- **C2 — Freshness without upstream compare-and-swap:** `POST /api/mcp/layout` has no ETag or compare-and-swap. The proposal record therefore also stores a server-side `slot_sha256`, the canonical hash of the full propose-time slot tree. This is internal state, not a request field. Apply runs in this order: CSRF (`403`), then token verifier/binding (`403`), then a freshness pre-check against a fresh `GET /api/studio/state` (`409` without consuming the token), then the atomic ledger claim (`409` for losers or replays). Immediately before dispatch, the winner re-reads the state and requires both `subtree_sha256` and `slot_sha256` to match. This way a human edit to a **sibling** made between propose and apply is never silently overwritten; it returns `409` with "re-run refinement". After dispatch, Groxy verifies that the returned `document` slot is canonically equal to the dispatched tree. The millisecond window between the final re-read and the Builder write is an accepted residual risk of the frozen `v1.0.0` contract. It is mitigated by the readback check and by the Builder-recorded `inverse`, which captures the Builder's own `before` tree, so Ctrl+Z restores whatever actually preceded the write.
- **C3 — Dispatch form:** Always send `{ slot, layout, actor: "groxy-ai", summary }` with the Builder's `X-CSRF-Token` from `/api/studio/state`. **Never** use the whole-document `document` form, because it records `slot: "all"` and could overwrite other slots. Set `actor` explicitly; do not rely on the Builder default.
- **C4 — Token roles, not invented tokens:** `playbook/design-craft.v1.json` declares token **roles** (spacing scale, line measure, surface elevation 1/2). These resolve against the live parsed design system at proposal time. If `--grex-surface-1`/`--grex-surface-2` or a measure token is absent, the rule reports `token_unavailable` with guidance to add it through the Builder's existing Global Token Editor. It never emits the missing token or an ad-hoc literal such as `max-width: 65ch`. The spacing rule evaluates resolved values: a `12px` token is 4pt-only, so its use is allowed only for tight inline pairs; otherwise repair picks the nearest live 8pt-aligned token. Gaps in the design-system configuration itself are `warning` severity. Violations **introduced by the proposed subtree** are blocking and feed the Section 4 quality gate. Classes that exist only in the unpublished draft are absent from `design-system.md` and are rejected (fail-closed).
- **C5 — Defense in depth:** The Builder's server validation is a backstop. Groxy's own 20-element, unsafe-URL, inline-script, depth, token/class, and 22-rule gates run before staging and again on the spliced slot before dispatch.
- **C6 — Dual-theme contrast:** Light and Dark contrast checks, plus nearest-passing token-pair repair, run in Groxy using live `theme.modes.light`/`theme.modes.dark` values. The Builder's single-background audit is not treated as Dark-mode evidence.
- **C7 — CMS wiring truthfulness:** `ForEach` grids bind only to content types and `field_key`s returned live by `list_content_types`; `decimal`/`integer` fields render exact wire strings. Generated `Form` inputs map to live field keys as metadata only. Because CMS `v1.0.1` has no public form-submission route, Groxy must not fabricate an `action` URL. Omit `action` unless the operator supplies a safe same-origin path. Unknown types or fields are reported, never invented.
- **C8 — Ledger, hashing & secrets:** Add only a Groxy-owned table (e.g. `groxy_section_refine_ledger`) on the existing `commerce` connection. Store `SHA-256(rtok)` with constant-time comparison. Use the existing recursive code-point-sorted UTF-8 canonicalizer (`v1.3.0`+) for `subtree_sha256`/`slot_sha256`. After a claim, a downstream Builder failure moves the record to a terminal `dispatch_failed` state with a recoverable outcome; the token is never reusable. Instructions, BYOK keys, and provider prompts never appear in responses, logs, or the audit trail.

### 11.3 Verdict

**`PASS`.** SPEC-160 aligns with frozen GRAB `v1.1.0`, Grex JS `v1.0.0`, GrabLab CMS `v1.0.1`, and Grex Theme Builder `v1.0.0` contracts with zero upstream changes, provided Stage 3 implements Conditions C1–C8 and the Section 9 gates. Section 9 Gate 5 and Gate 6 tests must also cover C2 (sibling edit between propose and apply → `409`, with no overwrite), C3 (no `document`-form dispatch), C4 (missing role token → `token_unavailable`, never fabricated), and C7 (no fabricated form `action`).
