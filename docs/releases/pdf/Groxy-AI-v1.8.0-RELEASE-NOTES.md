# Groxy AI v1.8.0 — Release Notes

**Released:** 2026-11-17  
**Status:** Approved & Frozen — Complete  
**Release tier:** Backwards-compatible minor feature release (`1.x.0`)

## Release Type & Affected Layers

- **Release Version & SemVer Tier:** `v1.8.0` (`MINOR 1.x.0` — Backwards-Compatible Feature Release)
- **Affected Layer(s):** Autonomous Design, Content & SEO Agent (`urbanspress/groxy-ai`)
- **Neighboring Layer Upgrade Required?** No — 100% drop-in compatible

| Ecosystem Layer | Repository | Required Version Range | Touched in This Release? | Neighbor Upgrade Required? |
|---|---|---|---|---|
| **Core Language, Bytecode VM & Grisp Server** | `urbanspress/grab` | `>= v1.1.0 (< v2.0.0)` | No | No |
| **Reactive Frontend Runtime & 20-Element Library** | `urbanspress/grex-js` | `>= v1.0.0 (< v2.0.0)` | No | No |
| **Flagship Zero-Plugin CMS** | `urbanspress/grablab-cms` | `>= v1.0.1 (< v2.0.0)` | No | No |
| **Exclusive `mode: "visual"` Theme & Studio** | `urbanspress/grex-builder` | `>= v1.0.0 (< v2.0.0)` | No | No |
| **Autonomous Design, Content & SEO Agent** | `urbanspress/groxy-ai` | `>= v0.1.0` | Yes (`v1.8.0`) | No |

## What’s included

- **Baked-In Offline Knowledge Vault (`playbook/knowledge/*.v1.json`, `POST /api/groxy/knowledge/query`, `C1`, `C2`):**
  - Five fail-closed `groxy-knowledge-vault-v1.0` datasets (`seo-rules.v1.json`, `schema-org-reference.v1.json`, `wcag-patterns.v1.json`, `conversion-copywriting.v1.json`, and `correctional-publishing.v1.json` aligned 100% with `PLOTIFIC-SAFE-001` and `LULU-USPS-001`: `perfect_bound_paperback`, `matte` finish, `60# uncoated`, USPS-only blocking `UPS`/`FedEx`/`DHL`, plain white-label packing slip with zero promotional inserts or staples).
  - Deterministic local-first query engine (`0` external network calls) returning cited vault entries with exact `ADR-025c` wire strings (`"4.50"`, `"3.00"`, `"0.002252"`), rejecting JS floats (`422`) and XSS (`422`).
- **Allowlisted Real-Time Web Research & Bestseller Radar (`playbook/market/bestseller-radar.v1.json`, `POST /api/groxy/research/search`, `/bestseller-radar`, `/apply`, `scripts/migrate_commerce.grab` v5, `C2–C7`):**
  - Enforces opt-in `GROXY_WEB_RESEARCH_ENABLED=true` (`403 RESEARCH_DISABLED` when disabled), `GRAB-E402` exact-origin HTTPS allowlisting (`https://api.duckduckgo.com`, `https://en.wikipedia.org`, `https://openlibrary.org`, or configured `https://` SearXNG origin), pre-connect SSRF IP/host blocks (loopback, RFC-1918, IPv6 ULA, link-local, `169.254.169.254`, `metadata.google.internal`), `retries: 0` + `<= 3` hop `3xx` `Location` revalidation (`403 GRAB-E402`), HTML stripping, and JSON-isolated prompt encoding before optional local Ollama (`127.0.0.1:11434`) synthesis.
  - Compiles profit-ranked Bestseller Radar briefs with exact `ADR-025c` pricing tiers (`"2.99"`, `"4.99"`, `"12.99"`, `"14.99"`, `"16.99"`, `422` float rejection) and `</script>`-escaped `schema.org/Book` JSON-LD previews, staged behind CSPRNG `rtok_res_<hex>` atomic single-winner claim (`201` winner, `403` binding/CSRF mismatch, `409 RESEARCH_SLOT_DRIFT`, `409` replay/race) dispatching cleanly to `groxy_studio` (one-slot Builder `POST /api/mcp/layout` with `actor: "groxy-ai"` and `Ctrl+Z` undo), `grablab_cms` (`create_entry_draft` `status_enforced: "draft"`), or `groxy_desk` (signed draft-only import receipt).
- **OAuth2 Read-Only Google Search Console (`GET/POST /api/groxy/gsc/connect`, `GET /api/groxy/gsc/callback`, `POST /api/groxy/gsc/metrics`, `POST /api/groxy/gsc/disconnect`, `C4`):**
  - Implements PKCE (`S256` via `crypto.sha256_base64url`) with strictly `https://www.googleapis.com/auth/webmasters.readonly`, `GRAB-E402` origin allowlisting (`https://oauth2.googleapis.com`, `https://www.googleapis.com`), `AES-256-GCM` (`"v1:..."`) encryption at rest in `groxy_gsc_connections`, zero secret leakage in responses/logs, and GDPR/CCPA-compliant aggregated base-10 wire metrics (`clicks`, `impressions`, `ctr`, `position`).
- **Pure `Grex JS v1.0.0` Research & Radar Studio Panel (`views/dashboard.grab.html`, `public/groxy/research-radar.js`, `assets/research-radar.js`, `public/groxy/dashboard.js`, `C8`):**
  - Maintains `divCount === 0`, `innerHTMLWriteCount === 0`, zero `eval()`, keyboard `Enter`/`Space`/`Escape` with focus restoration, and Light/Dark WCAG AA `>= 4.5:1` contrast.

## Verification

- `C:\Development\GRAB\dist\grab-windows-amd64.exe check --platform-config grab.platform.json src/groxy.grab` and `scripts/migrate_commerce.grab` passed with zero errors.
- Canonical `grab format` matched `src/groxy.grab` and `scripts/migrate_commerce.grab` byte-for-byte.
- `node --test tests/*.test.js`: `101/101` passed (`0` failed), including `tests/unit_research_radar.test.js` and `tests/unit_v100_production_audit.test.js`.
- `python tests/integration_e2e.py`: passed 100% across Gates 1, 2, 3A, and live 4-layer Gate 3B with `release-ready: True`.
- All 9 frozen sibling repositories in `C:\Development\*` verified clean with zero modifications.

See `Groxy-AI-v1.8.0-Guide.pdf` for the complete plain-English walkthrough.
