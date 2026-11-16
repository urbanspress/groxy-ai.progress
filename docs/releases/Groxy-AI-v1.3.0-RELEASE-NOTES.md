# Groxy AI v1.3.0 — Post-Purchase Email Flow Designer

### Release Type & Affected Layers
- **Release Version & SemVer Tier:** `v1.3.0` (`MINOR 1.x.0 — Backwards-Compatible Feature Release`)
- **Affected Layer(s):** Autonomous Design, Content & SEO Agent (`urbanspress/groxy-ai`)
- **Neighboring Layer Upgrade Required?** No — 100% drop-in compatible

| Ecosystem Layer | Repository | Required Version Range | Touched in This Release? | Neighbor Upgrade Required? |
|---|---|---|---|---|
| **Core Language, Bytecode VM & Grisp Server** | `urbanspress/grab` | `>= v1.1.0 (< v2.0.0)` | No | No |
| **Reactive Frontend Runtime & 20-Element Library** | `urbanspress/grex-js` | `>= v1.0.0 (< v2.0.0)` | No | No |
| **Flagship Zero-Plugin CMS** | `urbanspress/grablab-cms` | `>= v1.0.1 (< v2.0.0)` | No | No |
| **Exclusive `mode: "visual"` Theme & Studio** | `urbanspress/grex-builder` | `>= v1.0.0 (< v2.0.0)` | No | No |
| **Autonomous Design, Content & SEO Agent** | `urbanspress/groxy-ai` | `>= v0.1.0` | Yes | No |

## Plain-English summary

Groxy AI can now prepare four helpful post-purchase email drafts grounded in the business profile, site information, and current design tokens. Operators can review the messages, exact prices, timing suggestions, and required unsubscribe and mailing-address placeholders before saving the complete flow as one GrabLab draft.

Optional local Ollama and configured HTTPS BYOK providers can add short copy introductions. Unavailable or invalid Ollama output falls back to the built-in deterministic templates; BYOK requests must pass GRAB's network allowlist and SSRF protections. Exact decimal strings remain intact through the preview and CMS draft.

Approval is single-use and concurrency-safe. Simultaneous duplicate submissions produce one successful draft save and one `409` response. Groxy AI does not send email, schedule recipients, activate triggers, publish content, or overwrite existing human copy.

## Verification

- `grab check --platform-config grab.platform.json src/groxy.grab` passed.
- `grab format` stdout matched the source byte-for-byte.
- `node --test tests/*.test.js`: 61/61 passed.
- `python tests/integration_e2e.py`: Gates 1, 2, 3A, and live 3B passed.
- Live Gate 3B verified recursive canonical UTF-8 digest parity, Ollama offline fallback, BYOK metadata-IP rejection, exact-value draft readback, and the concurrent `201` + `409` single-winner result.
- The seven frozen sibling repositories remained clean. The pre-existing untracked `playbook/genres/` directory is preserved and excluded from the release bundle.

See `Groxy-AI-v1.3.0-Guide.pdf` for the walkthrough.
