# GROXY-AI-SPEC-130 — Autonomous Post-Purchase Email Flow Designer & Copywriter

- **Version:** Groxy AI `v1.3.0`
- **Status:** Approved; implementation in progress
- **Draft Date:** 2026-11-16
- **SemVer:** MINOR — backwards-compatible feature release (`ADR-027c`).
- **Frozen baselines:** Groxy AI `v1.0.0`, `v1.1.0`, `v1.2.0`; GRAB `v1.1.0`; Grex JS `v1.0.0`; GrabLab CMS `v1.0.1`; Grex Theme Builder `v1.0.0`.
- **Governance:** [AGENTS.md](../AGENTS.md), [GROXY-EXPERT.md](../GROXY-EXPERT.md), [HANDOFF.md](../HANDOFF.md), [Roadmap](../docs/ROADMAP.md), and [SPEC-120](GROXY-AI-SPEC-120.md).

## 1. Purpose, Scope & Approval Boundary

Design a brand-grounded, multi-step post-purchase email sequence, let an operator review every message and timing suggestion, and save the approved sequence strictly as drafts. The project owner approved this specification as written on 2026-11-16. Implementation is authorized within the scope below.

The additive routes are `POST /api/groxy/email-flows/design` and `POST /api/groxy/email-flows/apply`. Existing routes, payloads, releases, and upstream source remain unchanged. No compiler/runtime duplication, framework, bundler, or build step is introduced.

Sending, scheduling delivery, enrolling recipients, enabling automation, and activating `email_outbox` triggers are outside this milestone. Future GrabLab email dispatch or Builder `mode: "email"` capabilities are not assumed to exist in the frozen baselines. Draft approval never authorizes live delivery; any later activation requires a separate explicit operator action in an approved delivery system.

## 2. Grounding & Flow Model

Read confined `storage/BRAND-DNA.md`, its existing structured profile/revision, `storage/SITE-CONTEXT.md`, and live `GET /api/design-system.md`. Record source hashes, profile revision, and the resolved `--grex-*` token snapshot in the staged flow. Missing or invalid brand/site context returns `409` with setup guidance; unavailable live design tokens return `503`. Never fabricate brand promises, setup instructions, customer facts, product compatibility, prices, or guarantees.

The initial version generates exactly four ordered steps, with `step_count: 4`:

| Step | Purpose | Grounding and safety |
|---|---|---|
| Order Receipt & Welcome | Thank the buyer and summarize the order | Verified order fields or explicit typed merge placeholders; no invented payment/shipping status |
| Quick-Start / Setup Guide | Help the buyer use the purchase | Verified product instructions and safe links; missing instructions remain visible placeholders |
| Check-In & Review Request | Offer help and invite an honest review | Neutral review request; no invented testimonials or positive-review-only routing |
| Targeted Cross-Sell / Reorder | Suggest a relevant next purchase | Only known products and exact supplied prices; no fabricated discount or availability |

Each step contains a stable `step_id`, sequence position, purpose, subject, preheader, plain-text body, validated Grex layout tree, CTA, suggested delay, declared merge fields, and footer. Suggested timing is draft metadata only. The operator can edit a preview by submitting a revised design request; all edits require fresh validation, preview, digest, and token. Never silently overwrite an existing human template.

`design` accepts a bounded brief, configured site/destination identity, optional validated product/order facts, optional four-step overrides, and generation mode (`deterministic`, `ollama`, `byok`). Destinations must be configured and authorized server-side, never arbitrary client URLs or paths. Requests cannot contain executable templates, recipient lists, live-send flags, or credentials. Missing optional commercial data uses declared placeholders; explicitly supplied invalid data fails validation.

## 3. Exact Monetary Values & Safe Content

Preserve product prices, discounts, shipping, taxes, and order totals as exact base-10 `ADR-025c` `GrabDecimal` wire strings, including their supplied precision. Counts and numeric identifiers use `GrabInteger` strings where applicable. Protocol metadata such as `step_count` may remain a bounded JSON integer. Never use JavaScript `Number`, `parseFloat`, or binary floating-point arithmetic for commercial values. Any necessary arithmetic uses the existing exact decimal contract; do not implement a competing numeric runtime.

Return HTTP `422` for JSON numbers/JS floats in decimal fields, exponent notation, invalid numeric strings, unsupported precision, currency mismatch, or inconsistent supplied totals. Do not silently round or invent a price. Tests must preserve values such as `"19.90"` and `"0.10"` byte-for-byte through generation, preview, hashing, apply, and CMS draft readback, including large values beyond JavaScript's safe-integer range. Discount amounts and percentages must be typed separately and validated against their declared basis.

Compile only validated `grex.elements.json` nodes using Grex JS `v1.0.0`. Reuse live `--grex-*` tokens and supported `.grex-c-*` classes. Require `validateElementNode()` and `auditAccessibility()` to pass for every step and the Studio in both Light and Dark themes, with text contrast `>= 4.5:1`, meaningful image alternatives, accessible labels, heading order, keyboard focus, and status announcements.

Require `divCount === 0`, `innerHTMLWriteCount === 0`, zero unsafe URLs, and nesting at most 24 levels. Reject scripts, iframes, event attributes, raw HTML, `outerHTML`, `srcdoc`, CSS expressions, and executable template expressions. Construct previews through safe existing DOM helpers. Plain-text and semantic layout versions must carry the same material facts and footer. This is a safe draft representation; universal email-client rendering/export is not claimed.

## 4. Footer & Recipient-Control Contract

Automatically add a visible unsubscribe/preference placeholder and physical-address footer to every step, in both plain text and layout. The typed merge-field registry includes `unsubscribe_url` (HTTPS URL), `sender_name` (text), and `sender_postal_address` (text), plus explicitly declared order/customer placeholders. Unresolved placeholders are displayed as inert labeled text in previews, never clickable fake URLs or executable markup. Resolved URLs and text pass the normal validation/escaping rules.

These CAN-SPAM/GDPR-oriented footer checks are mandatory product safeguards, not a claim that footer presence alone establishes legal compliance. Draft metadata distinguishes transactional from promotional intent and records unresolved consent, suppression/unsubscribe, identity, and address requirements for operator review. Unresolved placeholders may be saved as drafts and must be reported in `activation_blockers`; they cannot be interpreted as delivery-ready. The later delivery system must resolve and validate these fields and enforce applicable recipient permissions before explicit operator activation. Groxy v1.3.0 neither captures consent nor sends emails.

## 5. Local-First Generation

1. **Deterministic built-in templates (default):** Versioned local flow rules yield identical content for identical normalized inputs, context, and token snapshots, excluding random identifiers/token issuance metadata. Zero mandatory API fees or generation-provider network calls; the live Builder token fetch remains required.
2. **Optional local Ollama:** Use only explicitly enabled `127.0.0.1:11434` access under GRAB capabilities. Bound timeouts and payloads. Offline, timeout, malformed, or unsafe enrichment falls back cleanly to the same deterministic templates and reports `fallback_used: true` and a safe reason. Do not silently switch to a cloud provider.
3. **Optional BYOK enrichment:** Only configured HTTPS provider origins permitted by `--allow-net` and `GRAB-E402`. Reject private/link-local/metadata destinations and redirects outside the allowlist; the narrowly scoped Ollama exception does not authorize other loopback access. Secrets remain capability-gated through `use env`, never in previews, logs, storage exports, or Brand DNA.

Models may enrich copy but cannot change exact prices, verified facts, footer requirements, destinations, or safety decisions. Treat their output as bounded untrusted structured data and run all validations after enrichment. External enrichment is opt-in and uses placeholders rather than customer personal data or actual order identifiers. BYOK failures return a safe error or an explicitly reported deterministic fallback; never stage unvalidated output.

## 6. Design, Staging & Approval Token

Both POST routes enforce existing authorization and `X-CSRF-Token` before processing; invalid/missing credentials or CSRF return `403`. `design` has no CMS mutations. It validates all four steps before staging any of them, then returns `200` with:

- `schema_version: "1.3.0"`, `flow_id: "flow_<hex>"`, `step_count: 4`, and the complete ordered `steps` preview.
- `flow_sha256`, `approval_required: true`, `approval_token: "etok_<hex>"`, and expiry time.
- Grounding revisions/hashes, destination identity, provider/fallback metadata, per-step audit findings, `status: "draft"`, `activation_blockers`, and `sending_enabled: false`.

The SHA-256 digest covers a documented canonical UTF-8 JSON serialization of the complete immutable flow: site/destination, ordered step IDs/content/layouts, timing, product/order values, currency, merge fields, footers, source revisions/hashes, token snapshot, and draft-only dispatch binding. Sort object keys recursively, preserve array order and string bytes, and omit only issuance metadata (approval token, expiry, response diagnostics). The implementation must pin this serialization with fixtures before acceptance.

Issue an unpredictable single-use token with at least 256 bits of cryptographic randomness, cryptographically bound to `{ flow_id, step_count, flow_sha256 }` using existing GRAB `use crypto` capabilities. Scope it additionally to the authorized operator/site. Store a verifier and immutable staged record, not a reusable plaintext credential. Tokens expire after 15 minutes; persisted consumed-state records remain through expiry so a service restart cannot re-enable application.

Editing any content, order, count, footer, price, target, or source snapshot requires restaging. If relevant current source revisions differ at apply time, return `409` context conflict and require a fresh preview. Tampering with the staged payload or its binding returns `403`. No token is issued for an invalid flow.

## 7. Apply & Draft Dispatch

`POST /api/groxy/email-flows/apply` accepts only `flow_id`, `step_count`, `flow_sha256`, and `approval_token`; content is loaded from the immutable server-side snapshot, never trusted from the apply request.

- Missing, invalid, expired, wrong-operator/site, or mismatched token/target returns `403` before any downstream mutation. Authenticated replay of a consumed token returns `409`, including concurrent attempts and replay after restart.
- Atomically transition staged to applying and consume the token before dispatch. Only one concurrent request may win. Verify binding in constant time with established helpers.
- Preflight the configured CMS destination with `list_content_types`. Use a compatible existing content type capable of storing the flow envelope and semantic templates as draft data; do not assume an upstream email schema or introduce an upstream migration. If no compatible type exists, return `409` with setup guidance before consuming the token or creating any draft.
- Save the complete four-step flow envelope as one new CMS entry through `create_entry_draft`, forcing `status_enforced: "draft"`. The envelope holds all email templates, disabled timing/trigger suggestions, and activation blockers. This avoids partial multi-entry flow saves and requires no new upstream endpoint. Never update an existing human entry, publish, enqueue email, enable triggers, or call a send API.
- A successful response returns `201`, `approved: true`, `flow_id`, `flow_sha256`, CMS draft ID, `status_enforced: "draft"`, `sending_enabled: false`, and activation blockers. Verify downstream draft enforcement before reporting success.
- A downstream failure after dispatch starts leaves the token consumed. Return a truthful failed or uncertain outcome; never retry blindly. Reconcile by the stored flow ID/digest and downstream ID if available before a newly approved attempt, preventing duplicate drafts after timeout. Do not claim rollback or idempotency capabilities the CMS does not provide.

Builder layout mutations, if separately introduced within an approved integration, must use `POST /api/mcp/layout`, `actor: "groxy-ai"`, and reversible `applyAiLayout`; this milestone's draft save does not require or authorize live layout changes.

## 8. Studio, Persistence & Error Boundaries

Add a semantic Email Flow Designer section to `/groxy` using only existing Grex JS components and safe semantic HTML5. Show the source status, four ordered messages, exact amounts, proposed timing, Light/Dark preview, audit findings, unresolved placeholders, and generation/fallback status. Provide a distinct **Approve & Save Draft Flow** action; never label saving as activation or sending. Edits discard approval state and request a new preview. Errors preserve the operator's unsaved input safely.

Runtime staging is confined beneath fixed `storage/` paths under `GRAB-E401`, excluded from Git and release bundles, and uses atomic persistence. Reject traversal, NUL, UNC paths, escaping symlinks, and protected paths. Bound the request body and total staged response to 1 MiB each, brief to 4,000 characters, subject to 200 characters, preheader to 300 characters, and per-step plain text to 20,000 characters. Oversized bodies return `413`; field/schema violations return `422`. Provider calls time out within 30 seconds. Log identifiers and safe outcomes, not tokens, secrets, personal data, or private prompts. No arbitrary file paths or upstream network destinations are client-controlled.

## 9. Acceptance & Verification Gates (Required After Approval)

No implementation verification is claimed by this draft. All gates must pass at 100% before completion or release promotion:

1. **Static/format:** Run `grab check` on every `.grab` and `.grab.html` file. Compare `grab format <file>` stdout byte-for-byte against every `.grab` source, without destructive formatting or unsupported `--check`.
2. **Generation/grounding:** Four complete ordered steps; deterministic repeatability; missing/invalid context; live token fetch; source changes; factual placeholders; exact field limits; Ollama offline fallback; opt-in BYOK, SSRF and redirect rejection; untrusted model-output rejection.
3. **Numeric/footer:** Exact `ADR-025c` wire strings throughout preview and draft readback; JS float/number and invalid precision rejection with `422`; total/currency validation; unchanged monetary facts after enrichment; unsubscribe and physical-address footer in every representation; inert unresolved placeholders and activation blockers.
4. **DOM/accessibility:** All existing views, the Studio, and every generated step pass `validateElementNode()` and `auditAccessibility()` in Light/Dark with `>= 4.5:1` text contrast, `divCount === 0`, `innerHTMLWriteCount === 0`, safe URLs, labels, focus, headings, and keyboard operation.
5. **Approval/persistence:** CSRF/auth `403`; invalid/expired/wrong-target `403`; changed count/digest/content/destination `403`; replay/concurrency/restart `409`; stale context conflict; no mutation on validation failure; confinement, atomic storage, expiry, failure reconciliation, and no duplicate dispatch.
6. **Live cross-layer Gate 3B:** Against GRAB `v1.1.0`, GrabLab CMS `v1.0.1`, Grex Theme Builder `v1.0.0`, and Groxy AI, fetch live tokens, stage a complete flow, approve once, read back the CMS entry and all four templates, verify exact decimal strings, footer fields, draft enforcement and disabled delivery, then verify `403` tampering and `409` replay. Test unavailable/incompatible CMS destination and downstream failure. Confirm no published entry, active trigger, email-outbox enqueue, or live-send call. Missing capabilities are failures, not skipped passes.
7. **Full regression:** Run `node --test tests/*.test.js` and `python tests/integration_e2e.py`, including unit, DOM, accessibility, playbook, and live integration coverage, with 100% passing results. Existing frozen contracts must remain compatible.
8. **Release/handoff:** Only after implementation approval, completion, verification, and explicit release authorization: update completion records, generate release assets and compatibility matrix, and follow dual-repository release rules. Run both ecosystem snapshot and Codex handoff scripts at the checkpoint. This specification-only checkpoint goes to `origin/main` only; `stable` stays on `v1.2.0`.

## 10. Owner Review & Next Phase

**Approved:** The project owner approved this specification as written on 2026-11-16. Material changes to routes, flow shape, token binding, persistence/dispatch, provider access, or activation boundaries require renewed specification review.

Use Google Hydrogen (Medium) for specification revisions. Before cross-layer implementation/audit, switch to Orchestrator (Argon) to review draft storage compatibility and approval/dispatch boundaries across the frozen CMS and Builder contracts. Handoff ownership returns to Google Antigravity; implementation remains blocked on owner approval regardless of model selection.
