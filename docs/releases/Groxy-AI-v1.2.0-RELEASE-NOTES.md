### Release Type & Affected Layers
- **Release Version & SemVer Tier:** `v1.2.0` (`MINOR 1.x.0 — Backwards-Compatible Feature Release`)
- **Affected Layer(s):** Autonomous Design, Content & SEO Agent (`urbanspress/groxy-ai`)
- **Neighboring Layer Upgrade Required?** No — 100% drop-in compatible

| Ecosystem Layer | Repository | Required Version Range | Touched in This Release? | Neighbor Upgrade Required? |
|---|---|---|---|---|
| **Core Language, Bytecode VM & Grisp Server** | `urbanspress/grab` | `>= v1.1.0 (< v2.0.0)` | No | No |
| **Reactive Frontend Runtime & 20-Element Library** | `urbanspress/grex-js` | `>= v1.0.0 (< v2.0.0)` | No | No |
| **Flagship Zero-Plugin CMS** | `urbanspress/grablab-cms` | `>= v1.0.1 (< v2.0.0)` | No | No |
| **Exclusive `mode: "visual"` Theme & Studio** | `urbanspress/grex-builder` | `>= v1.0.0 (< v2.0.0)` | No | No |
| **Autonomous Design, Content & SEO Agent** | `urbanspress/groxy-ai` | `>= v0.1.0` | Yes | No |

## Groxy AI v1.2.0

Adds a ten-step Brand DNA and voice wizard and a batch campaign studio for creating 1–40 blog post or product drafts. Brand DNA is stored under `storage/` and included in portable Site DNA exports. Campaign generation supports deterministic built-in output, optional local Ollama with deterministic fallback, and configured allowlisted BYOK enrichment.

Every item passes the 22-rule four-pillar audit at Grade A or A+, and product prices preserve exact `ADR-025c` decimal strings. A single-use approval token is bound to the batch ID, item count, and SHA-256 content digest. Applying a batch requires CSRF and sends entries only through GrabLab CMS `create_entry_draft` with `status_enforced: "draft"`.

## Verification

- `grab check --platform-config grab.platform.json src/groxy.grab`: passed.
- Canonical `grab format src/groxy.grab` output equals the source byte-for-byte.
- `node --test tests/*.test.js`: 54/54 passed.
- `python tests/integration_e2e.py`: Gates 1, 2, 3A, and live 3B passed, including Brand DNA persistence, Site DNA round-trip, 403 invalid-token rejection, CMS draft creation, and 409 replay rejection.
- All eight frozen sibling repositories are clean.

## Release assets

- `Groxy-AI-v1.2.0-Guide.pdf`
- `groxy-ai-v1.2.0-bundle.zip`
- `SHA256SUMS.txt`
