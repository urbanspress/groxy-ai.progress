# GROXY-AI-SPEC-140 — 5 Autonomous Storefront & Commerce AI Engines

- **Version:** Groxy AI `v1.4.0`
- **Status:** Approved target; specification in review
- **Draft Date:** 2026-11-16
- **SemVer:** MINOR — backwards-compatible feature release (`ADR-027c`).
- **Frozen baselines:** Groxy AI `v1.0.0`, `v1.1.0`, `v1.2.0`, `v1.3.0`; GRAB `v1.1.0`; Grex JS `v1.0.0`; GrabLab CMS `v1.0.1`; Grex Theme Builder `v1.0.0`.
- **Governance:** [AGENTS.md](../AGENTS.md), [GROXY-EXPERT.md](../GROXY-EXPERT.md), [HANDOFF.md](../HANDOFF.md), [Roadmap](../docs/ROADMAP.md), [SPEC-130](GROXY-AI-SPEC-130.md).

## 1. Purpose & Approval Boundary

Prepare five brand-grounded commerce tools that produce reviewable drafts and semantic storefront layouts. Approval of the milestone target is not approval of this specification or implementation. No v1.4.0 application code in `src/`, `views/`, `public/`, `assets/`, `tests/`, or `playbook/` may be written until the owner explicitly approves this specification. Preserve untracked `playbook/genres/`.

All six routes below are additive. Do not change frozen contracts, duplicate GRAB compiler/numeric internals or Grex runtime source, introduce frameworks/build bundlers, or require upstream upgrades. “Autonomous” and “Autopilot” describe draft synthesis, never publication, sending emails, enrolling recipients, activating triggers, changing checkout prices, issuing coupons, or scheduling live campaigns. Existing human copy/templates remain protected by explicit before/after previews. No public unauthenticated chatbot service or new commerce event subscription is assumed.

## 2. Shared Inputs, Grounding & Response

Every engine reads confined `storage/BRAND-DNA.md`, its structured profile/revision, `storage/SITE-CONTEXT.md`, and live `GET /api/design-system.md`. Snapshot source hashes, verified SKU facts, policy references, and resolved `--grex-*` tokens/`.grex-c-*` classes. Missing/invalid brand or site context returns `409` with setup guidance; unavailable live design tokens return `503`. Claims carry source references into the immutable snapshot. Missing or conflicting facts produce visible unresolved items; never invent guarantees, stock, shipping dates, policies, discounts, testimonials, or product compatibility.

All routes enforce existing authorization and `X-CSRF-Token` before processing (`403` on failure). Generation requests contain configured site identity, `target_slot`, bounded brief, engine-specific structured inputs, and optional `generation_mode` (`deterministic`, `ollama`, `byok`). The route determines `engine`: `recovery`, `concierge`, `bundles`, `reviews-mine`, or `campaign-plan`. Reject conflicting engine fields. Resolve `target_slot` through a server-side authorized destination registry; never accept arbitrary filesystem paths, upstream URLs, or caller-selected CMS publication status.

An immutable plan contains an ordered `dispatch_manifest`: each operation names its configured site, destination, draft content type or Builder entry/slot, expected target revision/hash, and artifact IDs. `target_slot` identifies this complete destination set, including mixed CMS/Builder packages. Display every destination and before/after change before approval; changing any destination requires a new plan.

Successful generation returns `200` with `schema_version: "1.4.0"`, `plan_id: "cplan_<hex>"`, `engine`, `target_slot`, complete `artifacts` and before/after previews, source references/hashes, token snapshot, audit findings, unresolved items, `activation_blockers`, generation/fallback metadata, `payload_sha256`, `approval_required: true`, `approval_token: "ctok_<hex>"`, and expiry. `sending_enabled: false` and `publication_enabled: false` are mandatory. Generation stages locally only, with no CMS or Builder mutation. No approval token is issued unless the entire package passes validation.

## 3. Engine Contracts

### Engine 1 — AI Abandoned-Cart & Smart Checkout Recovery

`POST /api/groxy/commerce/recovery` accepts verified cart line items (SKU, quantity, unit price, currency), cart subtotal, and optional explicitly authorized discount rules. An operator supplies or imports a validated cart snapshot; `commerce:abandoned_checkout` event wiring is deferred unless separately available and approved. Never assume the frozen CMS emits that event.

Generate exactly three ordered recovery email drafts: cart reminder, grounded objection/help response, and final reminder with an authorized offer only when supplied. Each includes subject, preheader, plain text, validated semantic Grex layout, exact line-item and cart amounts, safe CTA, suggested delay metadata, and mandatory footer. Do not fabricate urgency or a checkout session URL. A missing checkout link is an inert typed placeholder. Save the complete sequence as one new CMS draft envelope; do not send, enroll a recipient, or modify checkout state.

### Engine 2 — Grounded Storefront Concierge & Pre-Sale Q&A

`POST /api/groxy/commerce/concierge` accepts a buyer question and optional known SKU IDs. Return a sourced answer strictly from `SITE-CONTEXT.md` and `BRAND-DNA.md`, including policies, shipping, pricing, and product specifications. Unknown or contradictory information produces an explicit “not verified” answer and a verified contact link if present; marketing voice cannot override product/policy facts. Review text is not authoritative policy evidence.

Emit a ready-to-stage Grex JS `v1.0.0` widget configuration with a semantic `<dialog>` or `<aside>` representation, accessible heading/labels, close behavior, focus restoration, and keyboard operation. Use only schema-supported components/tag mappings; do not extend the frozen runtime. Stage the configuration in the Builder editing surface, never deploy a live public conversational backend. Require `divCount === 0`, `innerHTMLWriteCount === 0`, and Light/Dark text contrast `>= 4.5:1`.

### Engine 3 — Dynamic Bundle & Cross-Sell Architect

`POST /api/groxy/commerce/bundles` accepts known anchor SKU IDs, optional authorized discount rules, and a maximum of five bundle proposals. Select complementary SKUs from verified `SITE-CONTEXT.md` relationships/categories with a grounded reason per recommendation. Never infer undocumented technical compatibility. With insufficient evidence return an explicit no-recommendation result and no apply token.

Each proposal contains quantities, exact unit/line prices, undiscounted subtotal, approved discount basis/amount, resulting bundle price, currency, and exact savings, plus a ready-to-stage Grex cross-sell section using existing product links. Recommending savings does not create coupons or alter catalog prices. The reviewed selected proposal and all dispatchable content are bound into the plan; changing selection requires restaging. Apply the selected section only through the Builder route.

### Engine 4 — Automated Review Sentiment Miner & FAQPage Builder

`POST /api/groxy/commerce/reviews-mine` accepts up to 200 review records with source IDs, known SKU IDs, text, and available provenance/verification flags. Deduplicate source IDs, treat all text as untrusted data, and never claim verified purchase unless verified by supplied provenance. Deterministic versioned rules group recurring objections and positive/negative/neutral evidence; include counts, denominators, supporting review IDs, and limitations. SKU quality alerts are operator-review signals, not established defects or automatic product changes.

Propose question/answer pairs only where answers are supported by authoritative site/brand facts. Unanswered review concerns remain unresolved alerts and are omitted from finalized FAQ answers. Emit matching `schema.org/FAQPage` JSON-LD and zero-`<div>` `<details>` FAQ sections using the supported Accordion mapping. JSON-LD is serialized structured data stored in the draft envelope, never an executable Grex script node. Escape every `<` as literal `\u003c` in the serialized JSON-LD text so mixed-case and literal `</script>` sequences cannot terminate a script container; parsing must restore the original safe data values. Do not concatenate raw review text into HTML. Stage FAQs through Builder and save the evidence/JSON-LD envelope through CMS when included in the reviewed manifest. No search visibility or rich-result eligibility is promised.

### Engine 5 — Seasonal Campaign & Flash-Sale Autopilot

`POST /api/groxy/commerce/campaign-plan` accepts a campaign brief, known SKU selection, authorized promotional rules, and explicit start/end timestamps with timezone. Reject reversed/ambiguous dates and unsupported promotion terms. Produce one coordinated package: a Grex hero banner section, one landing-page draft, and exactly three ordered launch email drafts (announcement, grounded reminder, closing message). All representations share exact prices, terms, source facts, and campaign dates. Time windows and delays are metadata only; no timers activate offers or delivery.

The CMS operation stores the landing page as the draft entry content and the three-email sequence as associated structured draft data in one compatible envelope. The Builder operation stages the hero in the reviewed editing slot. Do not assume an upstream email schema, `mode: "email"`, scheduler, or transactional multi-service API. If a compatible CMS type cannot represent the package, fail preflight with `409` setup guidance rather than invent a migration.

## 4. Exact Decimal & Email Footer Rules

Use existing `ADR-025c` base-10 `GrabDecimal` operations exclusively for money, rates, discounts, subtotals, line prices, promotional prices, and savings. Quantities and numeric identifiers use exact `GrabInteger` strings where applicable. Never coerce these through JavaScript `Number`/`parseFloat` or binary floats. Reject JSON numbers (including integer-looking numbers) in decimal fields, exponent notation, invalid precision, negative prices/discounts, nonpositive quantities, mixed currencies, discounts exceeding their basis, and inconsistent supplied totals with HTTP `422`. Protocol metadata such as step counts may use bounded JSON integers.

Preserve supplied decimal wire strings including trailing zeros. Derived amounts use the configured currency scale and exact base-10 arithmetic: line total = unit price × quantity; subtotal = sum of line totals; discounted total = subtotal − discount; bundle savings = regular subtotal − bundle price. Percentage discount = declared basis × percentage / 100. No silent rounding: if a result cannot be represented exactly at the declared currency scale, return `422` and require an explicitly representable offer. No discount stacking in v1.4.0. Taxes/shipping remain explicitly excluded unless verified exact components are supplied and validated separately.

Acceptance examples: `"19.90"` × `"2"` + `"0.10"` = `"39.90"`; `"10.00"` percent of `"39.90"` = `"3.99"`; discounted total = `"35.91"`; `"0.05"` at `"10.00"` percent is rejected at two-decimal currency scale. Test values beyond JS safe-integer range. Models cannot revise monetary facts or calculations.

Every recovery/campaign email includes CAN-SPAM/GDPR-oriented unsubscribe/preference placeholders, sender identity, and physical-address footers in plain text and layout. Typed fields include `unsubscribe_url`, `sender_name`, and `sender_postal_address`. Unresolved fields render as inert labeled text, never fake clickable URLs, and remain `activation_blockers`. Include promotional intent and unresolved recipient permission/suppression requirements for operator review. These draft safeguards do not assert legal compliance or authorize delivery; future sending requires separately validated recipient controls and human activation. Do not accept recipient lists or send flags.

## 5. Semantic UI, Safety & Local-First Synthesis

All engines use deterministic built-in synthesis by default: identical normalized inputs, rule versions, context, and token snapshots yield identical content, excluding issuance identifiers/timestamps. Zero generation API fees; the live Builder design-token fetch remains required. Optional Ollama is explicitly enabled only at `127.0.0.1:11434` under GRAB network capabilities. Offline, timeout, malformed, or unsafe output falls back to deterministic synthesis with `fallback_used: true` and a safe reason, never silently to cloud.

Optional BYOK uses configured HTTPS origins permitted by default-deny `--allow-net` and `GRAB-E402`; reject private/link-local/metadata destinations, DNS rebinding, and redirects outside allowed destinations. The narrow Ollama exception grants no general loopback access. Keys remain capability-gated via `use env`; never log or export secrets. Redact customer identifiers/personal review data before enrichment; consent to generation does not imply consent to external personal-data transfer. Models receive bounded untrusted data and cannot change destinations, source facts, exact prices, safety decisions, or footer rules. Validate every enriched output again; failures return a safe error or explicitly reported deterministic fallback.

Use only `grex.elements.json` components and supported semantic HTML5 mappings, active `--grex-*` tokens, and `.grex-c-*` classes. Validate with `validateElementNode()`, `auditAccessibility()`, and the existing four-pillar 22-rule auditor (score `>=90`, Grade A/A+). All Studio views and generated artifacts require Light/Dark text contrast `>= 4.5:1`, zero wrapper `<div>`s, `innerHTMLWriteCount === 0`, accessible labels/alt text, heading order, visible focus, keyboard operation, and status announcements. No raw HTML, script/iframe/object/style nodes, inline event handlers, `outerHTML`, `srcdoc`, unsafe URL protocols, CSS expressions, executable templates, or nesting beyond 24 levels.

The future Commerce Studio presents all five tools, sources and limitations, exact calculations, Light/Dark previews, before/after layouts, draft artifacts, audits, dispatch destinations, blockers, and provider/fallback status. Its explicit **Approve & Stage Commerce Plan** action never implies publication or sending. Edits invalidate the prior approval and require fresh generation, validation, digest, and token.

## 6. Canonical Staging & Approval Binding

Hash the complete immutable payload using SHA-256 over recursive canonical UTF-8 JSON: sort object keys at every depth in Unicode code-point order, preserve array order and exact string code points/decimal spellings, use compact separators, no BOM or trailing newline, and deterministic JSON escaping. Do not normalize Unicode or coerce numeric strings. Reject duplicate object keys, non-finite values, unsupported types, and unknown request fields. Pin cross-language fixtures for nested objects, arrays, Unicode, JSON-LD escaping, and large decimal strings before acceptance.

The hashed payload includes schema/rule versions, site/operator scope, `plan_id`, `engine`, `target_slot`, full ordered artifacts, facts, footer/placeholders, exact calculations, campaign timing, grounding hashes/revisions, design tokens, audit results, before-state hashes, and the complete draft-only `dispatch_manifest`. Exclude only the digest itself and issuance-only token/expiry/transport diagnostics. Store the canonical bytes and recompute from the stored payload before apply; never trust a client digest alone.

Issue a cryptographically unpredictable single-use `ctok_<hex>` with at least 256 random bits, bound through existing GRAB crypto capabilities to `{ plan_id, engine, target_slot, payload_sha256 }` and authorized site/operator. Store a verifier and immutable staged record, not a reusable plaintext token. Expire after 15 minutes. Persist consumption/outcome records atomically through expiry and retain reconciliation information for uncertain downstream outcomes. Restart or multiple workers must not re-enable a consumed token; worker-local locks alone are insufficient.

## 7. Unified Apply & Atomic Single-Winner Dispatch

`POST /api/groxy/commerce/apply` accepts only `plan_id`, `engine`, `target_slot`, `payload_sha256`, and `approval_token`. Authenticate and verify CSRF, expiry, token binding, canonical digest, target authorization, and source/target freshness before mutation. Load content solely from immutable server-side staging.

| Condition | Response and mutation rule |
|---|---|
| Missing/invalid auth, CSRF, token; expired or wrong site/operator; engine/target/digest mismatch or payload tampering | `403`; no downstream mutation |
| Valid authenticated concurrent loser or consumed-token replay, including after restart | `409`; no additional dispatch |
| Changed source/target revision or incompatible destination/content type | `409`; restage/setup guidance; no dispatch |
| Schema/numeric/content validation failure | `422`; no token issued or mutation |
| Oversized body | `413` |
| Unavailable required upstream before dispatch | `503`; no mutation |

Preflight all manifest destinations, CMS `list_content_types` compatibility, Builder editing isolation, and expected target before-state. Then atomically compare-and-transition staged → applying and consume the token before any dispatch. Exactly one contender wins across all workers/processes. Recheck relevant target state immediately before each operation; never silently overwrite intervening human edits. Use established constant-time verifier comparisons. Binding mismatches remain `403` even if another caller consumed the token; only valid bound replay receives `409`.

Dispatch strictly through `POST /api/mcp/layout` with `actor: "groxy-ai"` and reversible `applyAiLayout` on the Builder command stack (`Ctrl+Z`), and/or GrabLab `create_entry_draft` with verified `status_enforced: "draft"`. CMS entries are new drafts, never replacements of human entries. Builder writes target the editing surface and cannot make unpublished layouts public. If a frozen upstream cannot enforce this boundary or required target freshness, fail closed and seek specification review; do not bypass the contract or change upstream source.

For mixed packages, execute the reviewed manifest in deterministic order: CMS draft first, then Builder staging. Journal intent and each downstream receipt using plan/digest/artifact identity. Success returns `201`, plan binding, per-operation receipts/draft IDs, `status: "staged"`, `status_enforced: "draft"` for CMS results, undo information for Builder results, and disabled sending/publication. Report success only after verifying every result.

Atomicity means single-winner approval consumption, not a distributed transaction across CMS and Builder. After dispatch starts, failure or timeout leaves the token consumed. Return `502` with a truthful `failed`, `partial`, or `uncertain` outcome and known receipts; show safe recovery guidance. Never blindly retry, automatically roll back someone else's edits, or claim unsupported upstream idempotency. Reconcile existing drafts/layout commands before a fresh human-approved plan containing only remaining work; unresolved uncertain operations block redispatch. Builder undo restores the prior editing layout; it does not delete CMS drafts or send/cancel emails.

## 8. Persistence & Bounds

Confine runtime staging and journals beneath fixed `storage/` paths under `GRAB-E401`, excluded from Git and release archives. Reject traversal, NUL, UNC paths, escaping symlinks, and protected paths. Use atomic durable persistence and bounded expiry cleanup that does not remove unresolved reconciliation records. Logs contain safe IDs/outcomes only, never tokens, credentials, personal data, or private prompts.

Limit each request and staged response to 1 MiB; brief/question to 4,000 characters; cart to 100 lines; SKU selection to 100 IDs; reviews to 200 records of at most 4,000 characters each; FAQ pairs to 20; bundle proposals to five; subject to 200 characters; preheader to 300; per-email plain text to 20,000. Reject oversized aggregates rather than silently truncate facts. Provider calls time out within 30 seconds. Recovery and campaign sequences each contain exactly three steps. Invalid field bounds return `422`, body limits `413`.

## 9. Acceptance & Verification Gates — Required After Owner Approval

This documentation checkpoint claims no v1.4.0 implementation or runtime test passes. All gates must pass 100% before milestone completion or release promotion:

1. **Static and format:** Run `grab check` on every `.grab` and `.grab.html` file. Compare `grab format <file>` stdout byte-for-byte against every `.grab` file without destructive formatting or unsupported `--check`.
2. **Five engines:** Exercise every route with grounded, absent, contradictory, stale, malicious, and boundary-size inputs. Assert exact three-step recovery, sourced concierge abstention, complementary bundle reasoning, evidence-counted review alerts and matching FAQs, and hero + landing draft + three campaign emails. Prove no invented policies, unsupported events, live price changes, sending, or scheduling.
3. **Numeric/footer:** Exact `ADR-025c` decimal-string parity from request through synthesis, preview, canonical hash, apply, and CMS/Builder readback; arithmetic examples and huge values; `422` for JS floats/numbers, invalid totals, fractional-cent results, and mixed currencies. Require footer fields in every email representation, inert unresolved fields, and activation blockers.
4. **DOM/accessibility/JSON-LD:** All existing views and new generated layouts pass schema validation and `auditAccessibility()` in Light/Dark with `>= 4.5:1` contrast, `divCount === 0`, `innerHTMLWriteCount === 0`, and no unsafe URLs. Test dialog focus/Escape/restore, aside semantics, details keyboard behavior, prompt injection, nested malicious nodes, and literal/mixed-case `</script>` JSON-LD attacks. Parsed JSON-LD must match visible FAQ facts without executing code.
5. **Generation/network:** Deterministic repeatability, zero default provider calls, offline Ollama fallback, malformed/unsafe enrichment rejection, BYOK opt-in, private/metadata/DNS/redirect SSRF rejection (`GRAB-E402`), redaction, and secret-free logs. Models cannot alter monetary or grounding facts.
6. **Approval/concurrency/persistence:** Independent recursive canonical digest parity; `403` for CSRF/token/target/engine/operator/digest tampering; valid replay `409`; concurrent requests across workers yield exactly one `201` and all others `409` when dispatch succeeds, with one manifest execution. Repeat after restart, expiry, source/target edits, and persistence faults. Verify no downstream calls on rejection and no duplicate calls after timeout/partial failure; test reconciliation and remaining-work reapproval.
7. **Live cross-layer Gate 3B E2E:** Against actual GRAB `v1.1.0`, CMS `v1.0.1`, Builder `v1.0.0`, and Groxy, fetch live tokens, generate and apply each engine, and read back draft artifacts/layouts with exact amounts and source bindings. Verify `actor: "groxy-ai"`, `applyAiLayout`, actual Ctrl+Z restoration, unchanged public state, CMS `status_enforced: "draft"`, escaped FAQ JSON-LD, and disabled email delivery. Exercise live concurrent `201`/`409`, `403` target tampering, stale-target rejection, unavailable/incompatible destinations, and a mixed-package downstream failure. Missing capabilities are failures, never skipped passes or mock-only substitutes.
8. **Full regression:** Run `node --test tests/*.test.js` and `python tests/integration_e2e.py`, covering unit, DOM, accessibility, playbook, and live cross-layer integration suites with 100% passing results. Existing frozen routes and payloads remain compatible.
9. **Release/handoff:** Only after approved implementation, all gates, and explicit release authorization: mark Complete, generate walkthrough PDF/archive/SHA256SUMS and compatibility matrix, then synchronize ascending release tags and matching releases on both repositories. This spec checkpoint commits only SPEC-140, roadmap, and handoff to `origin/main`; `stable` remains on `v1.3.0`. Run both ecosystem snapshot and Codex handoff scripts after the documentation checkpoint.

## 10. Owner Review & Next Phase

**Awaiting explicit owner approval of this specification.** Approval must cover all five route contracts, grounding and decimal rules, draft-only scope, canonical token binding, single-winner consumption, and partial-dispatch recovery. Material scope/contract changes require renewed review. Use Google Hydrogen (Medium) for specification revisions. Before cross-layer implementation/audit, switch to Orchestrator (Argon) to validate CMS draft storage, Builder staging/undo, and concurrency/reconciliation against the frozen upstream contracts.
