# Groxy AI

**Step 4 of the Post-1.0 GRAB Ecosystem:** Autonomous Design, Content & SEO Intelligence Agent built natively on **GRAB `v1.1.0`**, **Grex JS `v1.0.0`**, **GrabLab CMS `v1.0.1`**, and **Grex Theme Builder `v1.0.0`**.

- **Current Release:** `v1.5.0` (**Approved & Frozen — Complete**)
- **Delivered Capabilities:** Bespoke store schema quiz, opt-in "Talk to Groxy" database consultant, pre-mutation logical JSON snapshots, durable target locking, and CLI maintenance execution / loopback executor dispatch.
- **Frozen `v1.x` Contract:** All `22` routes in `src/groxy.grab`, 22-rule Playbook (`playbook/seo-playbook.v1.json`), `8 × 5` (`40`) WCAG AA Style Pack × Blueprint combinations, `GROXY-SAFE-001`, and `ADR-025c` wire precision are frozen under SemVer `v1.x` (`ADR-027c`).
- **Development Repo (`origin`):** `https://github.com/urbanspress/groxy-ai.progress`
- **Production Release Repo (`stable`):** `https://github.com/urbanspress/groxy-ai.stable`

---

## Core Architecture & Pillars

1. **Curated 22-Rule SEO & Clean-DOM Playbook (`playbook/seo-playbook.v1.json`):**
   - Local-first knowledge base with zero external SEO API fees across four equally weighted pillars (`25%` each):
     - **On-Page SEO (`GROXY-SEO-001..008`)** — title length, keyword focus, meta excerpt, slug hygiene, single `<h1>`, copy depth, duplicate detection, and `ADR-025c` exact `GrabDecimal`/`GrabInteger` precision.
     - **Content & WCAG Accessibility (`GROXY-A11Y-001..005`)** — WCAG AA contrast ratios, image `alt` text, form labels, sequential headings, and accessible buttons/focus indicators.
     - **Performance & Clean DOM (`GROXY-DOM-001..005`)** — zero wrapper `<div>` elements, strict 20-element `grex.elements.json` taxonomy, zero scripts/inline handlers/unsafe URLs, lean DOM depth, and verified `GRAB-DESIGN-SYSTEM.md` token usage.
     - **Off-Page / Internal Linking Readiness (`GROXY-LINK-001..004`)** — anchor hygiene, 301 redirect chain & self-loop checks, orphan discoverability, and structured data readiness.
2. **Deterministic 4-Pillar Auditor (`public/groxy/auditor.js`, `src/groxy.grab`):**
   - Scores any entry, layout JSON, or HTML fragment deterministically (`0–100`, `A+`–`F`) with hard `F` / `publish_safe: false` safety caps on wrapper `<div>` or XSS violations.
3. **Safety-First `grab mcp` & Theme Builder Bridge (`public/groxy/mcp-client.js`, `src/groxy.grab`):**
   - Connects read-only by default to Core GRAB CLI (`grab mcp`), GrabLab CMS `v1.0.1` (forcing `status: "draft"` via `create_entry_draft`), and Grex Theme Builder `v1.0.0` (submitting candidate layouts with `actor: "groxy-ai"` via `POST /api/mcp/layout`).
4. **Zero-`<div>` Semantic Inspector, Visual Generator & Site Intelligence UI ([`views/dashboard.grab.html`](views/dashboard.grab.html), [`public/groxy/dashboard.js`](public/groxy/dashboard.js), [`public/groxy/generator.js`](public/groxy/generator.js), [`public/groxy/site-context.js`](public/groxy/site-context.js)):**
   - Zero Node build steps, zero wrapper `<div>` elements, zero `innerHTML`, and 100% WCAG AA pass on `Grex JS v1.0.0`.
   - Composes full landing pages, hero sections, `GrabDecimal`-exact pricing grids (`ADR-025c`), FAQ `Accordion` widgets, and dynamic `ForEach` showcases from 8 Industry & Goal-Aware Style Packs across 5 Blueprints (`40` verified WCAG AA Light/Dark combinations) using live `--grex-*` tokens and `.grex-c-*` classes, gated behind Grade `A`/`A+` pre-dispatch verification and single-use human approval (`POST /api/mcp/layout` with `actor: "groxy-ai"` and 1-click Undo parity).
   - Indexes live GrabLab CMS entries, prices, menus, and `slug_history` `301` redirects into read-only `storage/SITE-CONTEXT.md`, analyzes site-wide internal linking authority with strict `301` loop exclusion, generates XSS-safe (`</script>`-escaped) `schema.org` JSON-LD, enriches Media Library `alt` text while preserving `decorative: true` items behind single-use `approval_token` confirmation, and produces quiet Nightly Watch **Morning Boost Reports** plus portable **Site DNA** exports for **Gashboard + `grabman`**.

5. **Screenshot-to-Grex Visual Replica (`v1.1.0` complete):**
   - Verifies bounded PNG/JPEG/WebP screenshots by magic bytes, extracts palette/structure hints locally, and compiles a zero-`<div>` Grex preview through the existing 20-element validator and 22-rule Grade A gate.
   - Offers deterministic extraction by default, optional local Ollama with deterministic fallback, and BYOK only through an explicitly allowlisted HTTPS origin guarded by `GRAB-E402`.
   - Keeps Builder changes behind CSRF plus a single-use token bound to `clone_id`, `slot`, and the SHA-256 layout digest; optional GrabLab persistence is draft-only.

6. **Brand DNA & Batch Campaigns (`v1.2.0`):**
   - Captures audience, voice, local SEO, exact pricing, guarantees, and Grex design tokens in a revisioned `storage/BRAND-DNA.md` profile.
   - Generates reviewed campaigns of 1–40 posts or products, audits each candidate, and creates CMS drafts only after explicit single-use approval.

---

## Quickstart & Verification

```powershell
# 1. Static check & formatting verification
grab check --platform-config grab.platform.json src/groxy.grab

# 2. Start Groxy AI Inspector UI & API server
grab serve --addr 127.0.0.1:8090 --allow-scripts --platform-config grab.platform.json --allow-cache groxy:read-write --static public --allow-read . --allow-write storage src/groxy.grab

# 3. Run Node unit, DOM & v1.0.0 production audit tests (37/37 tests)
node --test tests/*.test.js

# 4. Run full 5-layer live cross-layer E2E verification (GRAB + Grex JS + GrabLab CMS + Grex Builder + Groxy AI)
python tests/integration_e2e.py

# 5. Start hardened --read-only Docker container (standalone or 4-layer stack)
docker compose -f deploy/docker-compose.yml up -d
# Optional integrated 4-layer stack:
docker compose -f deploy/docker-compose.yml --profile ecosystem-stack up -d
```

---

## Ecosystem Compatibility Matrix

| Ecosystem Layer | Repository | Required Version Range | Role |
|---|---|---|---|
| Core Language, VM & Server | `urbanspress/grab` | `>= v1.1.0 (< v2.0.0)` | Executes `.grab`/`.grab.html`, capability sandboxing, `grab mcp` |
| Reactive Frontend Runtime | `urbanspress/grex-js` | `>= v1.0.0 (< v2.0.0)` | `signal`/`computed`/`effect`, `setSafeText`, `auditAccessibility` |
| Flagship Zero-Plugin CMS | `urbanspress/grablab-cms` | `>= v1.0.1 (< v2.0.0)` | Content types, draft entries, menus, media, `/api/mcp` tools |
| Visual Theme Builder | `urbanspress/grex-builder` | `>= v1.0.0 (< v2.0.0)` | `/api/design-system.md`, `POST /api/mcp/layout`, visual preview |
| Autonomous SEO & Design Agent | `urbanspress/groxy-ai` | `>= v1.0.0 (< v2.0.0)` | Playbook scoring, Boost diff, Visual Generator, Site Intelligence |

---

## Key Project Links

- [Agent Rules (`AGENTS.md`)](AGENTS.md)
- [Engineering Invariants (`GROXY-EXPERT.md`)](GROXY-EXPERT.md)
- [Roadmap (`docs/ROADMAP.md`)](docs/ROADMAP.md)
- [Hardened Container Deployment (`deploy/docker-compose.yml` & `deploy/README.md`)](deploy/README.md)
- [v0.1.0 Specification (`specifications/GROXY-AI-SPEC-001.md`)](specifications/GROXY-AI-SPEC-001.md)
- [v0.2.0 Specification (`specifications/GROXY-AI-SPEC-002.md`)](specifications/GROXY-AI-SPEC-002.md)
- [v0.3.0 Specification (`specifications/GROXY-AI-SPEC-003.md`)](specifications/GROXY-AI-SPEC-003.md)
- [v0.4.0 Specification (`specifications/GROXY-AI-SPEC-004.md`)](specifications/GROXY-AI-SPEC-004.md)
- [v1.0.0 Specification (`specifications/GROXY-AI-SPEC-005.md`)](specifications/GROXY-AI-SPEC-005.md)
- [v0.1.0 Walkthrough Guide (`docs/releases/pdf/Groxy-AI-v0.1.0-Guide.pdf`)](docs/releases/pdf/Groxy-AI-v0.1.0-Guide.pdf)
- [v0.2.0 Walkthrough Guide (`docs/releases/pdf/Groxy-AI-v0.2.0-Guide.pdf`)](docs/releases/pdf/Groxy-AI-v0.2.0-Guide.pdf)
- [v0.3.0 Walkthrough Guide (`docs/releases/pdf/Groxy-AI-v0.3.0-Guide.pdf`)](docs/releases/pdf/Groxy-AI-v0.3.0-Guide.pdf)
- [v0.4.0 Walkthrough Guide (`docs/releases/pdf/Groxy-AI-v0.4.0-Guide.pdf`)](docs/releases/pdf/Groxy-AI-v0.4.0-Guide.pdf)
- [v1.0.0 Walkthrough Guide (`docs/releases/pdf/Groxy-AI-v1.0.0-Guide.pdf`)](docs/releases/pdf/Groxy-AI-v1.0.0-Guide.pdf)
- [v1.1.0 Specification (`specifications/GROXY-AI-SPEC-110.md`)](specifications/GROXY-AI-SPEC-110.md)
- [v1.1.0 Screenshot-to-Grex Guide (`docs/releases/pdf/Groxy-AI-v1.1.0-Guide.pdf`)](docs/releases/pdf/Groxy-AI-v1.1.0-Guide.pdf)
- [Changelog (`CHANGELOG.md`)](CHANGELOG.md)
- [Handoff Log (`HANDOFF.md`)](HANDOFF.md)
