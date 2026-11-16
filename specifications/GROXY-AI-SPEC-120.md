# GROXY-AI-SPEC-120: Groxy AI `v1.2.0` — 1-Time Brand DNA & Voice Setup Wizard + 40-Post/Product Batch Campaign Engine

- **Status:** Approved target; specification in review
- **Milestone:** `v1.2.0` — Brand DNA Wizard (`POST /api/groxy/brand-dna/wizard`, `GET /api/groxy/brand-dna`) and Batch Campaign Engine (`POST /api/groxy/batch-create`, `POST /api/groxy/batch-create/apply`)
- **SemVer Tier (`ADR-027c`):** `MINOR (v1.2.0 — Backwards-Compatible Feature Release)`; additive routes and portable Site DNA fields, preserving the frozen v1.0.0 and v1.1.0 contracts.
- **Foundational Upstream Baselines (Frozen):** GRAB `v1.1.0`; Grex JS `v1.0.0`; GrabLab CMS `v1.0.1`; Grex Theme Builder `v1.0.0`.
- **Governance:** This specification is subject to explicit project-owner approval before implementation. Read with [`AGENTS.md`](../AGENTS.md), [`GROXY-EXPERT.md`](../GROXY-EXPERT.md), [`HANDOFF.md`](../HANDOFF.md), [`docs/ROADMAP.md`](../docs/ROADMAP.md), and [`GROXY-AI-SPEC-110.md`](GROXY-AI-SPEC-110.md).

---

## 1. Purpose & Scope

Groxy AI `v1.2.0` adds a one-time, editable Brand DNA onboarding workflow and a human-approved batch campaign workflow for creating up to **40 content or product drafts** from a short campaign brief. Brand DNA provides a reusable, structured source of truth for voice, audience, locality, commercial rules, guarantees, and visual identity. Batch generation reads it together with `storage/SITE-CONTEXT.md`, creates deterministic or optionally enriched candidate entries, audits every candidate, then stages the whole batch for explicit review before creating CMS drafts.

The work is additive to the frozen `v1.0.0` and `v1.1.0` route and payload contracts. It never publishes live entries, silently replaces brand guidance, or writes raw model output as HTML. The default generation path is deterministic and incurs no API fee.

## 2. Planned Repository Additions & Updates

Implementation may begin only after the owner explicitly approves this specification. The expected additive footprint is:

```text
groxy-ai/
├── specifications/GROXY-AI-SPEC-120.md       # This specification
├── src/groxy.grab                             # Add four v1.2.0 routes; preserve existing routes
├── views/dashboard.grab.html                  # Add semantic Brand DNA wizard and batch campaign panel
├── public/groxy/                              # Add/wire wizard and batch preview interactions
├── assets/                                    # Mirror any new server/CLI-shared modules as required
├── storage/                                   # Runtime-only BRAND-DNA.md, brand-dna.v1.json, SITE-CONTEXT.md
├── playbook/                                  # Versioned deterministic batch-generation rules
├── tests/                                     # Unit, DOM, security, numeric and live cross-layer coverage
├── docs/ROADMAP.md                            # Update only after approved milestone verification
└── HANDOFF.md                                 # Record approval, implementation, verification and release state
```

Runtime files under `storage/` are confined by `GRAB-E401`, excluded from source control, and never bundled into releases. Exact module names and boundaries are implementation decisions within the approved contracts below.

## 3. Brand DNA Wizard & Persistence

### 3.1 Interactive 8–10 Question Flow

The zero-wrapper-`<div>` Grex JS wizard uses 8–10 concise steps with save/resume, edit-before-save, and a final review. It captures:

1. Business identity, business type, and niche.
2. Primary audience and the problems they need solved.
3. Geographic service area, local SEO emphasis, and preferred location terms.
4. Voice weights using sliders and selectable pills for **Authoritative**, **Warm & Friendly**, **Bold & Direct**, and **Technical Expert**. The UI must expose accessible labels and values; the persisted representation is deterministic and bounded.
5. Forbidden buzzwords, claims, and phrases; these are treated as generation constraints.
6. Preferred calls to action and any CTA wording to avoid.
7. Offer types and pricing-tier rules, including exact `GrabDecimal` wire strings and currency/format rules.
8. Warranty, return, delivery, and shipping guarantees; unknown or unprovided guarantees are explicitly marked unknown and must not be invented.
9. Linked Design Style Pack and selected `GRAB-DESIGN-SYSTEM.md` token references, when available.
10. Optional editorial examples or notes and a confirmation that the saved profile is ready to use.

The wizard may combine related prompts so the final flow has at least 8 and at most 10 questions. Every control must be keyboard-accessible, have an associated label, retain visible focus, and pass the Grex accessibility audit.

### 3.2 Storage Format, Confinement & Compatibility

- `POST /api/groxy/brand-dna/wizard` validates and saves both `storage/BRAND-DNA.md` (human-readable canonical profile) and `storage/brand-dna.v1.json` (structured canonical profile). Both writes are atomic: validation or write failure leaves the previous saved profile intact.
- Paths are fixed by the service; clients cannot supply a path. Resolve and confine every operation beneath the configured `storage/` root under `GRAB-E401`, rejecting traversal, symlink escape, NUL, UNC paths, and protected locations. Do not read or overwrite `.env`, `.git`, `.ssh`, private keys, or paths outside the storage root.
- The wizard is create-once by default. If a saved profile exists, the interface loads it for editing and the POST must include its current `revision` (optimistic concurrency). A stale revision returns `409`; successful edits show a before/after review and replace only after explicit save. No silent overwrite.
- JSON uses schema identifier `brand-dna.v1`, a monotonically increasing revision, `updated_at`, and stable machine-readable values. Markdown is generated from the validated JSON representation, not independently assembled from untrusted HTML.
- `GET /api/groxy/brand-dna` returns the structured profile and availability metadata. If no profile exists it returns `200` with `configured: false` and no fabricated defaults. It never exposes secrets; the profile schema has no credential fields.
- Portable `Site DNA` exports for `groxy-site-dna-v0.4.0` and `groxy-site-dna-v1.0.0` gain an additive optional `brand_dna` object. Existing imports without that field remain valid. Exported data excludes local filesystem paths and credentials; import validates schema/version, strings, URL values, numeric strings, and size limits before use.
- Monetary amounts, thresholds, and quantity limits that represent `GrabDecimal` or `GrabInteger` values are serialized as exact base-10 strings per `ADR-025c`. JSON numeric values, JavaScript floats, exponent notation, leading plus signs, and precision-drift strings are rejected with `422`.

### 3.3 Brand DNA API Contracts

Both endpoints require the established authorization and valid `X-CSRF-Token` checks for POST mutations. Missing/invalid credentials or CSRF tokens return `403`; malformed fields return `422` with stable field-level error codes.

`POST /api/groxy/brand-dna/wizard` accepts a validated profile plus an optional expected `revision`. Success returns `200` with `configured: true`, the new `revision`, normalized structured profile, and saved file hashes. It does not create CMS content or publish anything.

`GET /api/groxy/brand-dna` returns `200` with `schema_version`, `configured`, `revision` when configured, and the profile. File-system failures return a safe service error without leaking local paths or contents.

## 4. Batch Content & Product Campaign Engine

### 4.1 Request, Bounds & Grounding

`POST /api/groxy/batch-create` accepts a one-sentence campaign brief, `item_count` from `1` through `40`, and a `content_type` of `post` or `product`. It reads the saved Brand DNA and `storage/SITE-CONTEXT.md`. If Brand DNA is missing or invalid, the request fails with `409` and directs the operator to complete the wizard. It must not guess the brand voice, guarantees, local coverage, offers, or prices.

The planner uses Site Context and the CMS `query_entries`/`list_content_types` tools as available to avoid duplicate titles and slugs. Comparison is case-insensitive after Unicode normalization and whitespace normalization; slugs are compared in normalized slug form. Candidate titles/slugs must also be unique within the batch. A collision is regenerated deterministically or reported as a per-item generation error; a duplicate must never be staged for approval.

For product requests, all price fields and price tiers must originate in Brand DNA or explicit request values and remain exact base-10 strings. If neither source supplies a valid price, return a validation error rather than inventing one. Product output includes a bounded SKU/slug strategy and XSS-safe `schema.org/Product` JSON-LD using escaped serialized data. Post output includes a canonical slug, SEO title and description, headings, body, CTA, and applicable locality signals without keyword stuffing or fabricated facts.

### 4.2 Local-First Generation Modes

1. **Deterministic built-in playbook (default):** A versioned local rule set creates reproducible outlines, title variants, section patterns, internal-link candidates, CTA placement, and product descriptions with zero external API calls.
2. **Optional local Ollama:** When explicitly selected, use only the configured local Ollama service at `127.0.0.1:11434`. Bound request and response sizes and timeouts. If unavailable, fall back to deterministic generation unless the request requires the selected provider; report `fallback_used` clearly.
3. **Optional BYOK enrichment:** Connect only to an explicitly configured HTTPS origin allowed by `--allow-net` and guarded by `GRAB-E402`. Block private, loopback (except the specifically supported Ollama path), link-local, and metadata IP ranges; reject redirects to unapproved origins. Credentials are read through capability-gated `use env` and never persisted in Brand DNA, logs, previews, or exports.

External/local model output is untrusted input. Parse bounded structured data, validate every field and URL, escape user-facing output, construct semantic content structures through existing safe helpers, and never execute or insert returned HTML.

### 4.3 Per-Item Audit & All-or-Nothing Staging

Before staging, every candidate runs through the existing deterministic 22-rule, four-pillar auditor (On-Page SEO; Content & WCAG Accessibility; Performance & Clean DOM; Off-Page / Internal Linking Readiness). Every item must score **at least 90** and receive Grade **A or A+**, with `publish_safe: true`, `divCount === 0`, `innerHTMLWriteCount === 0`, valid schema.org JSON-LD where applicable, and exact `ADR-025c` decimal/integer strings. Unescaped `</script>` sequences in JSON-LD are prohibited; serialized JSON-LD must be safe in an HTML script context.

If any item fails, the batch is not staged and no CMS drafts are created. The response identifies each failed item's findings and permits regeneration or editing. A successful stage returns all item previews, audit results, provider/fallback details, deterministic slug/title decisions, a `batch_id`, and a single-use `approval_token` in the `btok_<hex>` format.

The batch digest is SHA-256 over a canonical UTF-8 serialization of the exact staged item list, order, content type, destination/site identity, and relevant profile revision. The approval token is cryptographically bound to `{ batch_id, item_count, batch_sha256 }`. The staged snapshot is immutable; changing an item, item count, profile revision, order, content type, or destination invalidates approval and requires a new preview and token.

### 4.4 `POST /api/groxy/batch-create` Contract

Requires valid `X-CSRF-Token`; the endpoint stages a preview only and performs no CMS mutation. Invalid count/type/brief, missing profile, invalid decimal values, or malformed provider output fail closed with `4xx` and stable error codes. The success response includes:

```json
{
  "schema_version": "1.2.0",
  "batch_id": "batch_<hex>",
  "item_count": 2,
  "content_type": "post",
  "provider_used": "deterministic",
  "fallback_used": false,
  "brand_dna_revision": 1,
  "batch_sha256": "<64-char-sha256>",
  "approval_required": true,
  "approval_token": "btok_<hex>",
  "items": [
    {
      "title": "Example campaign article",
      "slug": "example-campaign-article",
      "status": "draft",
      "audit": { "overall_score": 94, "overall_grade": "A", "publish_safe": true },
      "candidate_entry": { "content_type": "post", "custom_fields": {} },
      "schema_json_ld": "<XSS-safe serialized JSON-LD or null>"
    }
  ]
}
```

The abbreviated example illustrates the response shape; actual responses contain exactly `item_count` complete candidate records. Private prompt content, credentials, and filesystem paths are excluded.

### 4.5 `POST /api/groxy/batch-create/apply` Contract & Draft-Only Dispatch

Apply requires valid authorization, `X-CSRF-Token`, `batch_id`, and the staged `approval_token`. Before any dispatch it verifies the token in constant time, batch identity, exact target binding, count, digest, immutable item snapshot, and current staging state.

- Invalid, missing, expired, or mismatched tokens and any changed target/payload return `403`; no CMS call occurs.
- A consumed token returns `409` on replay. Token consumption and batch transition to applying must be atomic to prevent concurrent double application.
- On valid approval, dispatch each item only through GrabLab CMS MCP `create_entry_draft` and force `status_enforced: "draft"`. Never call a publish endpoint, set `published`, or bypass CMS draft enforcement.
- Return per-item draft IDs and outcomes. If downstream dispatch partially fails, report completed drafts and failures accurately; do not retry successful items automatically. Reconciliation uses stable per-item idempotency identifiers where the CMS contract supports them. The batch token remains consumed after dispatch begins.
- The response reports `approved: true`, `status_enforced: "draft"`, counts of created/failed drafts, target-binding verification, and item-level results. It never claims the entire batch succeeded when any item failed.

## 5. Pure Grex Studio Panel & UI Contract

The `/groxy` studio adds two semantic sections: the Brand DNA setup/edit wizard and Batch Campaign composer/review panel. Use Grex JS `v1.0.0` and semantic HTML5 elements only; no wrapper `<div>`, React/Vue, build step, raw HTML insertion, or `innerHTML` writes. Forms use `Form`, `Fieldset`, `Legend`, `Label`, `Input`, `Button`, `Output`, lists, and other supported semantic nodes as appropriate.

- Show progress and editable answers, voice slider values, forbidden terms, CTA preferences, exact offer/pricing rules, guarantee status, Style Pack, and design tokens. Provide an explicit final save review and clear existing-profile revision state.
- Batch controls select post/product, count `1..40`, concise brief, and deterministic/local Ollama/allowlisted BYOK mode. Display provider/fallback state and profile revision.
- Render candidate previews, score/grade, audit findings, title/slug collision resolution, exact prices, and schema.org preview safely. Require a distinct explicit “Approve & Create Drafts” action; token is single-use and is not reused after edits.
- Light and Dark theme contrast must meet WCAG AA: at least `4.5:1` for normal text and `3:1` for large text. Controls and status messages remain keyboard-accessible and announced accessibly.

## 6. Security, Privacy & Error Behavior

- Preserve the established auth and CSRF requirements on every mutating route.
- Enforce `GRAB-E401` on all profile and batch persistence, with fixed storage roots and atomic replacement. Constrain request bodies, individual text fields, total profile size, generated output, and staged batch lifetime to documented implementation constants; return `413` for oversized requests.
- Enforce `GRAB-E402` for network access; BYOK secrets are not logged or included in response objects.
- Validate exact decimal/integer strings before arithmetic or serialization. Never coerce them through JavaScript `Number` or floating-point math.
- Escape content and JSON-LD for their output context; reject unsafe URLs/protocols and raw HTML from all providers.
- Approval tokens are unpredictable, single-use, target-bound, short-lived, and stored so replay remains rejected across service restarts for the staging lifetime. Store only token verifiers where feasible; protect staging records with `GRAB-E401` and remove expired records safely.
- Errors return stable codes and concise actionable messages without stack traces, secret values, absolute paths, or sensitive prompt contents.

## 7. Acceptance & Verification Gates

The milestone may be marked Complete or promoted only after all gates pass at 100%:

1. **GRAB Static & Format Parity:** `grab check` passes all affected `.grab` and `.grab.html` files; `grab format <file>` stdout matches each checked-in `.grab` file byte-for-byte.
2. **Brand DNA & Site DNA Tests:** Covers 8–10 accessible wizard questions, create/read/edit and stale-revision conflict, atomic persistence, `GRAB-E401` traversal/symlink/protected-path rejection, no-profile response, export/import compatibility for both Site DNA versions, and `422` rejection of JS floats/noncanonical `GrabDecimal` and `GrabInteger` values.
3. **Batch Engine & Approval Tests:** Covers 1 and 40 item boundaries, rejects 0/41, deterministic repeatability, local Ollama fallback, BYOK allowlist/SSRF/redirect checks, duplicate prevention against Site Context and within the batch, model-output sanitization, every item `>=90` Grade A/A+, all-or-nothing staging, digest binding, `403` invalid/mismatched token and tampered payload, `409` replay and concurrent replay, expiry and restart persistence, and exact decimal / XSS-safe schema.org Product output.
4. **DOM & Accessibility:** Existing and new views pass `divCount === 0`, `innerHTMLWriteCount === 0`, safe URL checks, Grex schema validation, and `auditAccessibility()` in Light and Dark themes at WCAG AA contrast requirements.
5. **Live Cross-Layer Gate 3B:** Exercise wizard persistence and Site DNA round trip, stage a mixed or representative batch, approve it once, and verify every successful CMS call used `create_entry_draft` with `status_enforced: "draft"`; confirm no live/published entry was created and token replay returns `409`.
6. **Milestone Handoff:** Update roadmap and `HANDOFF.md` only after tests complete; run ecosystem snapshot and Codex handoff synchronization. Until then v1.2.0 remains `Approved target; specification in review`.

## 8. Owner Approval Gate

This document is a proposed implementation contract. **No v1.2.0 application code may be written until the project owner explicitly approves `GROXY-AI-SPEC-120.md`.** Approval authorizes implementation only within this scope; any material change to routes, persistence, numeric representation, batch size, external network access, or draft-only safety requires a specification revision and renewed review.
