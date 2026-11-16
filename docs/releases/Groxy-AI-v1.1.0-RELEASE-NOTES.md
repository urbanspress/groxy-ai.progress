### Release Type & Affected Layers
- **Release Version & SemVer Tier:** `v1.1.0` (`MINOR 1.x.0 — Backwards-Compatible Feature Release`)
- **Affected Layer(s):** Autonomous Design, Content & SEO Agent (`urbanspress/groxy-ai`)
- **Neighboring Layer Upgrade Required?** No — 100% drop-in compatible

| Ecosystem Layer | Repository | Required Version Range | Touched in This Release? | Neighbor Upgrade Required? |
|---|---|---|---|---|
| **Core Language, Bytecode VM & Grisp Server** | `urbanspress/grab` | `>= v1.1.0 (< v2.0.0)` | No | No |
| **Reactive Frontend Runtime & 20-Element Library** | `urbanspress/grex-js` | `>= v1.0.0 (< v2.0.0)` | No | No |
| **Flagship Zero-Plugin CMS** | `urbanspress/grablab-cms` | `>= v1.0.1 (< v2.0.0)` | No | No |
| **Exclusive `mode: "visual"` Theme & Studio** | `urbanspress/grex-builder` | `>= v1.0.0 (< v2.0.0)` | No | No |
| **Autonomous Design, Content & SEO Agent** | `urbanspress/groxy-ai` | `>= v0.1.0` | Yes | No |

## Groxy AI v1.1.0 — Screenshot-to-Grex Visual Replica

Groxy AI can turn a reference PNG, JPEG, or WebP screenshot into a semantic Grex Theme Builder layout preview. The flow validates image signatures and size, checks design tokens and WCAG AA contrast, preserves exact decimal strings, and holds the result for explicit approval. Approved layouts use the existing Builder undo stack; optional CMS content remains a draft.

### Verification
- `grab check --platform-config grab.platform.json src/groxy.grab` — passed.
- Canonical `grab format` stdout matches `src/groxy.grab` byte-for-byte — passed.
- `node --test tests/*.test.js` — 45/45 passed.
- `python tests/integration_e2e.py` — Gates 1, 2, 3A, and live cross-layer Gate 3B passed.
- All eight sibling repositories are clean and unchanged.

### Assets
- `Groxy-AI-v1.1.0-Guide.pdf` — plain-English walkthrough.
- `groxy-ai-v1.1.0-bundle.zip` — packaged application bundle.
- `SHA256SUMS.txt` — SHA-256 checksums for the bundle and guide.
