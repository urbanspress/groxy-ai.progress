# GROXY-AI-SPEC-170 — Multi-Genre Storytelling Brain, Hemingway Readability Auditor & `schema.org/Book` JSON-LD Engine

- **Version:** Groxy AI `v1.7.0`
- **Status:** Approved target; specification in review
- **Draft Date:** 2026-11-17
- **SemVer:** MINOR — backwards-compatible feature release (`ADR-027c`).
- **Frozen baselines:** Groxy AI `v1.0.0` through `v1.6.0`; GRAB `v1.1.0`; Grex JS `v1.0.0`; GrabLab CMS `v1.0.1`; Grex Theme Builder `v1.0.0`; Gashboard `v1.0.0`; Groxy Desk `v1.0.0`.
- **Governance:** [AGENTS.md](../AGENTS.md), [GROXY-EXPERT.md](../GROXY-EXPERT.md), [HANDOFF.md](../HANDOFF.md), [Roadmap](../docs/ROADMAP.md), [SPEC-160](GROXY-AI-SPEC-160.md).

---

## 1. Purpose, Scope & Approval Boundary

Give authors and publishers an autonomous, deterministic **Multi-Genre Storytelling Brain**, a **Hemingway Clarity & Readability Auditor**, and an **XSS-safe `schema.org/Book` & `BookSeries` JSON-LD Engine** inside `/groxy`, backed by modular genre playbooks and human-in-the-loop draft-only staging.

Under the **Stage 1 Spec-First Approval Gate** in [AGENTS.md](../AGENTS.md), **no `v1.7.0` application code** (`src/`, `views/`, `public/`, `assets/`, `tests/`) is written until the project owner explicitly approves this specification and the Stage 2 cross-layer contract audit passes. Frozen `v1.0.0`–`v1.6.0` code and all eight sibling repositories remain untouched. Existing untracked `playbook/genres/urban-fiction.v1.json` is preserved until `v1.7.0` implementation is authorized.

**Out of scope:** auto-publishing live entries (`status: "published"`), silent overwrite of human manuscripts, new Grex elements outside `grex.elements.json`, new upstream CMS or Builder endpoints, mandatory cloud AI fees, and `v1.8.0` live web research / Bestseller Radar (`POST /api/groxy/research/bestseller-radar`).

---

## 2. Multi-Genre Storytelling Playbook Registry & Reusable Agent Skill

### 2.1 Modular Genre Playbooks (`playbook/genres/*.v1.json`)
`Groxy AI v1.7.0` ships a versioned, inspectable registry of genre playbooks under `playbook/genres/`:
- `playbook/genres/urban-fiction.v1.json` (*Urban Fiction*)
- `playbook/genres/thriller.v1.json` (*Thriller / Mystery*)
- `playbook/genres/romance.v1.json` (*Romance*)
- `playbook/genres/sci-fi-fantasy.v1.json` (*Sci-Fi / Fantasy*)
- `playbook/genres/self-help-reentry.v1.json` (*Self-Help / Re-Entry*)
- `playbook/genres/true-crime.v1.json` (*True Crime*)

### 2.2 Fail-Closed Schema Validator (`groxy-genre-playbook-v1.0`)
At server startup and runtime playbook load, every `playbook/genres/*.v1.json` file MUST pass strict schema validation; any malformed, incomplete, or unsafe playbook **fails closed** (never loads partial rules):
- **Required top-level fields:** `schema_version` (`"groxy-genre-playbook-v1.0"`), `genre_slug` (lowercase `^[a-z0-9-]+$`), `display_name`, `target_audience`, `pacing_and_structure`, `trope_checklist`, `character_archetypes`, `voice_and_dialogue_rules`, `publishing_and_pricing_tiers`, and `schema_org_book_defaults`.
- **Exact `ADR-025c` Base-10 Numeric Fidelity:** All monetary values and pricing tiers in `publishing_and_pricing_tiers.pricing_tiers_usd` (e.g., `"0.00"`, `"2.99"`, `"4.99"`, `"9.99"`, `"14.99"`), royalty rates, word-count targets, and Hemingway thresholds MUST be exact base-10 wire strings (`GrabDecimal` / `GrabInteger`). Raw JS floats, exponent notation, or non-canonical numeric strings are rejected with HTTP `422`.
- **Zero Inline HTML / XSS:** Playbook strings MUST NOT contain `<script`, `</script`, `<iframe`, `<object`, `<style`, `<div`, inline `on*=` attributes, or unsafe URL protocols (`javascript:`, `vbscript:`, `file:`, unsanitized `data:`). Any `schema_org_book_defaults` URLs (`@context`, `bookFormat`, `offers_defaults.availability`) are normalized/validated as strict `https://schema.org/...` strings.

### 2.3 Reusable Agent Skill (`.agents/skills/genre-research/SKILL.md`)
As part of `v1.7.0`, commit the reusable `.agents/skills/genre-research/SKILL.md` template alongside `playbook/genres/` so future genre playbooks follow a uniform, auditable workflow:
1. Demographic, motivation, and emotional-payoff research rules.
2. Act-structure, chapter word-count, and cliffhanger cadence definitions.
3. Core tropes and anti-pattern guards.
4. `hemingway_clarity_checks` calibration.
5. `ADR-025c` base-10 `GrabDecimal` pricing tier validation and zero-XSS verification.

---

## 3. Shared Route Contract, Auth & Input Validation

All routes require existing authenticated operator authorization. Mutating `POST` routes require `X-CSRF-Token`; failures return `403` before any storage read, generation, or staging. Requests reject unknown fields, duplicate JSON keys, wrong types, raw JS floats in numeric wire fields (`422`), and invalid identifiers (`400`). Requests never accept raw URLs, arbitrary filesystem paths, SQL, shell commands, or credentials.

| Route | Request | Result |
|---|---|---|
| `GET /api/groxy/author/genres` | None | `200`: validated list of `groxy-genre-playbook-v1.0` playbooks (slug, display name, pacing targets, Hemingway thresholds, `ADR-025c` pricing tiers) |
| `POST /api/groxy/author/generate` | `genre_slug`, `artifact_type` (`chapter_outline` \| `chapter_draft` \| `back_cover_blurb` \| `series_reading_grid`), `brief` (bounded plain-English object), optional `target_slot`, optional `generation_mode`, optional `book_meta` | `200`: staged proposal with `author_plan_id`, generated artifact, Hemingway readability summary, `schema.org/Book` / `BookSeries` JSON-LD preview, Grex layout preview (when applicable), `payload_sha256`, and single-use `approval_token` (`atok_<hex>`); staging only, no CMS/Builder write |
| `POST /api/groxy/author/apply` | `author_plan_id`, `genre_slug`, `artifact_type`, `target_slot`, `payload_sha256`, `approval_token` | `201` winner after atomic ledger claim and draft-only CMS dispatch (`create_entry_draft`, `status_enforced: "draft"`) and/or one-slot Builder `POST /api/mcp/layout` (`actor: "groxy-ai"`); `403` CSRF/token/binding mismatch; `409` replay, concurrent race, or stale target |
| `POST /api/groxy/author/readability-audit` | `prose` (bounded plain text), optional `genre_slug` | `200`: deterministic Hemingway clarity & readability report with grade level, passive voice, adverb clutter, complex/nested clauses, dialogue-to-narration pacing, and line-level plain-English rewrite suggestions |

---

## 4. Author Mode Co-Writer & Chapter/Blurb Generator

### 4.1 Grounding & Artifacts
Reads `storage/BRAND-DNA.md` (if present), `storage/SITE-CONTEXT.md`, and the selected `playbook/genres/<slug>.v1.json` playbook (plus optional `GRAB-E401`-confined `storage/BOOK-BIBLE.md` continuity notes) to generate:
1. **Chapter Outlines (`chapter_outline`):** Act-percentage structural beats paired with mandatory end-of-chapter cliffhanger hooks from `pacing_and_structure.cliffhanger_cadence`.
2. **Chapter Drafts (`chapter_draft`):** POV-consistent, sensory-grounded prose calibrated to the genre's `dialogue_to_narration_ratio_percent` and mobile scroll paragraph targets.
3. **Back-Cover Conversion Blurbs (`back_cover_blurb`):** Four-paragraph conversion structure (Tagline Hook, Protagonist Stakes, Counterpart Collision, Ultimatum Closer + series CTA) following `cover_and_blurb_conversion_hooks.blurb_structure_rules`.
4. **Series Reading-Order Grids (`series_reading_grid`):** Pure `Grex JS v1.0.0` semantic layout (`Section`, `Container`, `Grid`, `Card`, `Heading`, `Text`, `Link`, `Button`, `ForEach`) displaying reading order, blurb excerpts, and exact `ADR-025c` `GrabDecimal` pricing tiers (`"0.00"`, `"2.99"`, `"4.99"`, `"9.99"`, `"14.99"`). Reads live `--grex-*` tokens and `.grex-c-*` classes from `GET /api/design-system.md` and passes Light/Dark WCAG AA `>= 4.5:1` contrast with `divCount === 0` and `innerHTMLWriteCount === 0`.

### 4.2 Generation Modes & Outbound Safety
- **Deterministic (default):** Built-in playbook/template synthesis operating 100% offline with zero mandatory API fees.
- **Optional Local Ollama (`127.0.0.1:11434`):** Opt-in, bounded timeout and response size, with automatic clean offline fallback to deterministic synthesis if Ollama is unavailable.
- **Optional BYOK Enrichment:** Opt-in; destinations MUST pass the `GRAB-E402` SSRF allowlist (blocking private, loopback-other, link-local, and metadata IPs such as `169.254.169.254`; redirects revalidated). Credentials are never returned in responses or written to logs.
- **Prompt-Injection Isolation:** User-supplied `brief` fields are untrusted, JSON-encoded before any provider prompt, and can never alter routing, targets, `ADR-025c` prices, or approval state. Provider output undergoes the same schema, XSS, DOM, and numeric validation as deterministic output.

---

## 5. `GROXY-SAFE-001` Staging, Canonical Hashing & Atomic Single-Winner Apply

1. **Canonical Digest (`payload_sha256`):** Computed over recursive Unicode-code-point-sorted UTF-8 JSON of the staged artifact payload, using Groxy's canonicalizer (`v1.3.0`+).
2. **Target-Bound Approval Token (`atok_<hex>`):** Single-use CSPRNG token (`>= 128` bits), stored as `SHA-256(atok)` in an additive Groxy-owned SQLite ledger table (`groxy_author_ledger` on the existing `commerce` connection), bound to `{ author_plan_id, genre_slug, artifact_type, target_slot, payload_sha256 }` with a bounded TTL (default 15 minutes).
3. **Atomic Single-Winner Consumption:** `POST /api/groxy/author/apply` validates `X-CSRF-Token` (`403`), verifies token & binding (`403`), and atomically claims the row (`UPDATE groxy_author_ledger SET status = 'applying' WHERE plan_id = :plan_id AND status = 'staged'`). Concurrent races or replays yield **exactly one `201` winner** and **`409` for all losers/replays**.
4. **Draft-Only CMS & Undoable Builder Dispatch:**
   - Content artifacts (`chapter_outline`, `chapter_draft`, `back_cover_blurb`) dispatch strictly via GrabLab CMS `create_entry_draft` (`status_enforced: "draft"`). Groxy never sets `status: "published"` or overwrites live human copy.
   - Layout artifacts (`series_reading_grid`) dispatch strictly via one-slot `POST /api/mcp/layout` (`actor: "groxy-ai"`, never `document` form) with 1-click `Ctrl+Z` `applyAiLayout` undo parity.
   - Downstream failures transition the ledger row to terminal `dispatch_failed` with a recoverable outcome; tokens are never reusable.

---

## 6. Hemingway Clarity & Readability Auditor (`POST /api/groxy/author/readability-audit`)

A 100% deterministic prose analyzer (zero non-deterministic LLM guesswork) calibrated against the selected genre playbook's `hemingway_clarity_checks` (or default clarity thresholds when `genre_slug` is omitted):

| Metric | Deterministic Check | Output |
|---|---|---|
| **Reading Grade Level** | Sentence length + syllable complexity vs `target_reading_grade_level` / `max_reading_grade_level` | Exact base-10 wire string grade (e.g., `"6.50"`) + pass/warn status |
| **Passive Voice Density** | Auxiliary + past-participle pattern detection vs `passive_voice_max_percent` | Exact percentage wire string + flagged line offsets |
| **Adverb Clutter** | `-ly` / weak modifier density vs `adverb_density_max_percent` | Exact percentage wire string + flagged words |
| **Complex / Nested Clause Chains** | Sentences exceeding `average_sentence_length_words` / `hard_sentence_length_ceiling_words` or multi-clause punctuation depth | Sentence index, word count, and split suggestion |
| **Dialogue-to-Narration Pacing** | Quoted dialogue ratio vs `dialogue_to_narration_ratio_percent` and paragraph sentence-count check | Ratio string + pacing recommendation |

Returns an overall clarity score (`0–100`), grade (`A+`–`F`), metric breakdown, and **line-level plain-English rewrite suggestions** for human review (never auto-rewriting live prose).

---

## 7. XSS-Safe `schema.org/Book` & `BookSeries` JSON-LD Engine

Generates valid `schema.org/Book` and `schema.org/BookSeries` structured data blocks:
- **Required & Supported Properties:** `@context` (`https://schema.org`), `@type` (`Book` or `BookSeries`), `name`, `author` (`Person`), `bookFormat` (`https://schema.org/EBook`, `https://schema.org/Paperback`, `https://schema.org/Hardcover`), `isbn`, `numberOfPages` (positive integer wire string), `inLanguage` (BCP-47), `genre`, `typicalAgeRange`, `isAccessibleForFree`, and `offers` (`@type: "Offer"`, `priceCurrency`, `price` as exact `ADR-025c` `GrabDecimal` wire string, `availability`).
- **XSS-Safe Serialization:** Escapes `</script>`, `<`, `>`, `&`, U+2028, and U+2029 so embedding inside `<script type="application/ld+json">` cannot break out of the script context.
- **Fail-Closed Numerics:** Raw JS floats or non-canonical numeric strings in `offers.price` or `numberOfPages` are rejected with HTTP `422`.

---

## 8. Pure `Grex JS v1.0.0` Author Studio Panel (`/groxy`)

Renders inside `views/dashboard.grab.html` + `public/groxy/author-studio.js` (and `assets/author-studio.js`) using strictly the 20 semantic elements in `grex.elements.json` and semantic HTML5 (`<details>`, `<dialog>`):
- **Zero Wrapper `<div>` & Zero `innerHTML`:** `divCount === 0`, `innerHTMLWriteCount === 0`, zero `eval()` / `new Function()`.
- **Accessibility & Contrast:** Full keyboard navigation (`Enter`/`Space`), accessible labels on all `Input` / `Select` / `Button` controls, `<dialog>` confirmation with `Escape` handling and focus restoration, and Light/Dark WCAG AA `>= 4.5:1` contrast (`auditAccessibility()` 100% pass).

---

## 9. Acceptance & Verification Gates — Required After Owner Approval

1. **GRAB Static & Format Parity:** `grab check --platform-config grab.platform.json` passes on all `.grab` / `.grab.html` files with zero errors; `grab format <file>` stdout matches every `.grab` file on disk byte-for-byte.
2. **Genre Playbooks & Skill (`node --test tests/*.test.js`):** All 6 `playbook/genres/*.v1.json` files pass `groxy-genre-playbook-v1.0` validation; malformed, float-priced, or XSS-containing playbooks fail closed; `.agents/skills/genre-research/SKILL.md` is present and valid.
3. **Author Mode Co-Writer & `ADR-025c` Numerics:** `chapter_outline`, `chapter_draft`, `back_cover_blurb`, and `series_reading_grid` generate deterministically offline, fall back cleanly when Ollama is offline, block SSRF via `GRAB-E402`, redact BYOK credentials, and reject JS-float prices with HTTP `422`.
4. **Hemingway Readability Auditor:** Deterministic tests verify grade level, passive voice density, adverb clutter, complex/nested clause chains, dialogue-to-narration pacing, and line-level plain-English suggestions.
5. **`schema.org/Book` & `BookSeries` JSON-LD:** Validates `bookFormat`, `isbn`, `numberOfPages`, `inLanguage`, `genre`, `typicalAgeRange`, exact `ADR-025c` `offers.price`, `</script>` XSS escaping, and `422` float rejection.
6. **DOM & WCAG AA Accessibility:** `divCount === 0`, `innerHTMLWriteCount === 0`, Light/Dark WCAG AA `>= 4.5:1`, `auditAccessibility()` 100% pass across the Author Studio UI and generated `series_reading_grid` layouts, plus `<dialog>` `Escape` & focus restoration.
7. **`GROXY-SAFE-001` Approval & Concurrency:** Missing/invalid `X-CSRF-Token` -> `403`; `atok_<hex>` binding mismatch -> `403`; replay -> `409`; two-process concurrent apply race yields **exactly one `201` and one `409`**; CMS dispatch enforces `status_enforced: "draft"`; Builder dispatch uses one-slot `POST /api/mcp/layout` (`actor: "groxy-ai"`).
8. **Live Gate 3B (`python tests/integration_e2e.py`):** Live 4-layer E2E verification against `GRAB v1.1.0`, `Grex JS v1.0.0`, `GrabLab CMS v1.0.1`, `Grex Theme Builder v1.0.0`, and `Groxy AI v1.7.0` passes 100% with `release-ready: True`.
9. **Regression & Freeze Preservation:** All frozen `v1.0.0`–`v1.6.0` tests pass; all 8 sibling repositories remain unmodified and clean.
10. **Release Promotion:** Only after explicit owner approval, dual-remote protocol per [AGENTS.md](../AGENTS.md) with 5-layer Ecosystem Compatibility Matrix, walkthrough PDF (`docs/releases/pdf/Groxy-AI-v1.7.0-Guide.pdf`), release bundle, and `SHA256SUMS.txt`.

---

## 10. Owner Review & Next Phase

**Status:** `Approved target; specification in review`. No `v1.7.0` implementation code is authorized until explicit project-owner approval. Once approved, proceed to **Stage 2** pre-implementation cross-layer security & contract audit on **Claude Opus (High)** or **Orchestrator (Argon)** per the [AGENTS.md](../AGENTS.md) 4-pool routing matrix.
