# Groxy AI v1.7.0 — Release Notes

**Released:** 2026-11-17  
**Status:** Approved & Frozen — Complete  
**Release tier:** Backwards-compatible minor feature release (`1.x.0`)

## Release Type & Affected Layers

- **Release Version & SemVer Tier:** `v1.7.0` (`MINOR 1.x.0` — Backwards-Compatible Feature Release)
- **Affected Layer(s):** Autonomous Design, Content & SEO Agent (`urbanspress/groxy-ai`)
- **Neighboring Layer Upgrade Required?** No — 100% drop-in compatible

| Ecosystem Layer | Repository | Required Version Range | Touched in This Release? | Neighbor Upgrade Required? |
|---|---|---|---|---|
| **Core Language, Bytecode VM & Grisp Server** | `urbanspress/grab` | `>= v1.1.0 (< v2.0.0)` | No | No |
| **Reactive Frontend Runtime & 20-Element Library** | `urbanspress/grex-js` | `>= v1.0.0 (< v2.0.0)` | No | No |
| **Flagship Zero-Plugin CMS** | `urbanspress/grablab-cms` | `>= v1.0.1 (< v2.0.0)` | No | No |
| **Exclusive `mode: "visual"` Theme & Studio** | `urbanspress/grex-builder` | `>= v1.0.0 (< v2.0.0)` | No | No |
| **Autonomous Design, Content & SEO Agent** | `urbanspress/groxy-ai` | `>= v0.1.0` | Yes (`v1.7.0`) | No |

## What’s included

- **Multi-Genre Storytelling Playbook Registry & Reusable Agent Skill (`C1`, `C2`):**
  - Normalized `playbook/genres/urban-fiction.v1.json` (`schema_org_book_defaults` plain `https://schema.org/...` strings) and shipped 5 companion playbooks (`thriller.v1.json`, `romance.v1.json`, `sci-fi-fantasy.v1.json`, `self-help-reentry.v1.json`, `true-crime.v1.json`) adhering strictly to `groxy-genre-playbook-v1.0`, exact `ADR-025c` base-10 `GrabDecimal` pricing tiers (`"0.00"`, `"2.99"`, `"4.99"`, `"9.99"`, `"14.99"`), and zero inline HTML/XSS with fail-closed startup and load-time validation.
  - Committed reusable `.agents/skills/genre-research/SKILL.md` template and updated `scripts/package_release.py` to bundle `playbook/genres/*.v1.json`, `.agents/skills/genre-research/SKILL.md`, and `v1.7.0` modules.
- **Author Mode Co-Writer & Atomic Approval Ledger (`POST /api/groxy/author/generate` & `/apply`, `scripts/migrate_commerce.grab` v4, `C2–C8`):**
  - Grounded in `storage/BRAND-DNA.md`, `storage/SITE-CONTEXT.md`, optional `GRAB-E401`-confined `storage/BOOK-BIBLE.md`, and the selected `playbook/genres/<slug>.v1.json` to generate chapter outlines (with end-of-chapter cliffhanger hooks), chapter drafts, back-cover conversion blurbs, and pure-Grex series reading-order grids (`divCount === 0`, `innerHTMLWriteCount === 0`, live `--grex-*`/`.grex-c-*`, Light/Dark WCAG AA `>= 4.5:1` + 22-rule `>= 90` Grade `A`/`A+`).
  - Runs deterministically offline with zero API fees by default, plus optional local Ollama (`127.0.0.1:11434`) clean fallback or `GRAB-E402` SSRF-allowlisted BYOK enrichment with secret redaction.
  - Stages recursive canonical UTF-8 JSON `payload_sha256` and single-use `atok_<hex>` tokens in `groxy_author_ledger`, enforces `X-CSRF-Token` (`403`), target binding (`403`), Builder `slot_sha256` sibling-drift freshness (`409 AUTHOR_SLOT_DRIFT`), atomic single-winner claim (`201` winner, `409` replay/race), draft-only GrabLab CMS `create_entry_draft` (`status_enforced: "draft"`, filtering `custom_fields` strictly against live `list_content_types` per `C7`), and one-slot Builder `POST /api/mcp/layout` (`actor: "groxy-ai"`, `Ctrl+Z` undo parity, terminal `dispatch_failed` per `C8`).
- **Hemingway Clarity & Readability Auditor (`POST /api/groxy/author/readability-audit`, `C2`):**
  - Deterministic prose analyzer emitting exact base-10 wire strings for reading grade level, passive voice %, adverb density %, complex/nested clause chains, and dialogue-to-narration pacing with line-level plain-English rewrite suggestions.
- **XSS-Safe `schema.org/Book` & `BookSeries` JSON-LD Engine & Pure `Grex JS v1.0.0` Author Studio Panel (`C2`, `C3`, `C4`):**
  - Escapes `</script>`, `<`, `>`, `&`, `U+2028`, and `U+2029` with exact `ADR-025c` `offers.price` and `numberOfPages` (`422` float rejection) and renders in `/groxy` (`views/dashboard.grab.html`, `public/groxy/author-studio.js`, `assets/author-studio.js`, `public/groxy/dashboard.js`) with `divCount === 0`, `innerHTMLWriteCount === 0`, full keyboard navigation (`Enter`/`Space`/`Escape` with focus restoration), and Light/Dark WCAG AA `>= 4.5:1` contrast.

## Verification

- `C:\Development\GRAB\dist\grab-windows-amd64.exe check --platform-config grab.platform.json src/groxy.grab` and `scripts/migrate_commerce.grab` passed with zero errors.
- Canonical `grab format` matched `src/groxy.grab` and `scripts/migrate_commerce.grab` byte-for-byte.
- `node --test tests/*.test.js`: `94/94` passed (`0` failed), including `tests/unit_author_studio.test.js` and `tests/unit_v100_production_audit.test.js`.
- `python tests/integration_e2e.py`: passed 100% across Gates 1, 2, 3A, and live 4-layer Gate 3B with `release-ready: True`.
- All 8 frozen sibling repositories in `C:\Development\*` verified clean with zero modifications.

See `Groxy-AI-v1.7.0-Guide.pdf` for the complete plain-English walkthrough.
