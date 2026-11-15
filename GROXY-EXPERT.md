# GROXY-EXPERT.md — Non-Negotiable Engineering Invariants

This checklist defines the **never-break invariants** for **Groxy AI** (`urbanspress/groxy-ai`), Step 4 of the Post-1.0 **GRAB Ecosystem**. Every specification, audit rule, MCP call, generated layout, and release must satisfy all four pillars.

---

## 1. Human-in-the-Loop Safety (Zero Auto-Publish & Zero Silent Overwrites)
- **Never Auto-Publish Live Pages:** **Groxy AI** MUST NEVER directly set `status: "published"` on any GrabLab entry or promote unpublished layout trees to live visitor traffic on its own authority.
- **Draft & Command-Stack Isolation Only:**
  - All new content authoring MUST call GrabLab CMS `create_entry_draft`, which enforces `status: "draft"` (`status_enforced: "draft"` per `GRABLAB-SPEC-100`).
  - All Grex Theme Builder layout mutations MUST call `update_entry_layout` or `POST /api/mcp/layout` with `actor: "groxy-ai"`, executing through `createCommandStack` as a reversible `applyAiLayout` command (`GREX-BUILDER-SPEC-100`) so human designers can inspect and **Undo** (`Ctrl+Z`) in one click.
- **Explicit Before/After Diff Approval:** Every **🚀 "Let Groxy Boost This"** optimization MUST produce a structured before/after diff preview and refreshed `0–100` / `A+`–`F` grade breakdown requiring an explicit human click on **"Approve & Make This Live"** before any change goes public.

---

## 2. 100% Design System, `grex.elements.json` & WCAG AA Compliance
- **Honor `GRAB-DESIGN-SYSTEM.md`:** Before generating or optimizing any Grex layout, **Groxy AI** MUST fetch and parse `GRAB-DESIGN-SYSTEM.md` (`GET /api/design-system.md`), reusing active `--grex-*` tokens and `.grex-c-*` utility classes instead of inventing ad-hoc inline styles.
- **Zero Wrapper `<div>` Bloat (`GREX-SCHEMA-001`):** Every generated layout and Groxy AI UI view MUST use strictly the 20 semantic elements in `grex.elements.json` (`Section`, `Container`, `Grid`, `Stack`, `Card`, `Heading`, `Text`, `RichText`, `Link`, `Button`, `Image`, `Icon`, `Form`, `Input`, `Select`, `Tabs`, `Accordion`, `Modal`, `Nav`, `ForEach`) with zero wrapper `<div>` elements.
- **Strict Security & Nesting Guards (`GREX-SEC-003`, `GREX-SEC-004`):** Reject `<div>`, `<script>`, `<iframe>`, `<object>`, `<style>`, inline `on*` event attributes, `innerHTML` / `outerHTML` / `srcdoc`, unsafe URL protocols (`javascript:`, `vbscript:`, `file:`, unsanitized `data:`), CSS `expression(...)`, and nesting deeper than `24` levels.
- **Exact Numeric Integrity (`ADR-025c`):** Preserve base-10 `GrabDecimal` and `GrabInteger` wire strings (prices, counts, SKU IDs, dimensions, weights) cleanly without IEEE-754 floating-point coercion.
- **Mandatory WCAG AA Gate (`auditAccessibility()`):**
  - `GREX-A11Y-001`: Text/background contrast ratio `>= 4.5:1` (`>= 3:1` large text).
  - `GREX-A11Y-002`: Every `Image` MUST supply meaningful `alt` text or explicit `isDecorative: true` (`alt: ""`).
  - `GREX-A11Y-003`: Every `Input` and `Select` MUST include an accessible label (`label` / `aria-label`).
  - `GREX-A11Y-004`: Semantic heading hierarchy (`<h1>`–`<h6>`) without skipped heading levels.
  - `GREX-A11Y-005`: Accessible interactive labels and visible `:focus-visible` keyboard focus rings on buttons/links.

---

## 3. Curated SEO Playbook + Deterministic Auditing (Zero Mandatory API Fees)
- **Deterministic, Reproducible Scoring:** All `0–100` and `A+`–`F` scores across **On-Page SEO**, **Content & WCAG Accessibility**, **Performance & Clean DOM**, and **Off-Page / Internal Linking Readiness** MUST be computed deterministically from the versioned **Semrush / Ahrefs / Google Search Central Playbook** (`playbook/seo-playbook.v1.json`) and concrete DOM/entry inspections—never non-deterministic LLM guesswork.
- **Local-First AI Execution:** Optional generative copy and layout reasoning MUST support local models (Ollama / OpenCode via MCP) with zero mandatory recurring third-party cloud API fees, and all HTTP connections MUST obey GRAB's default-deny `--allow-net` and SSRF rules (`GRAB-E402`).

---

## 4. SemVer & Dual-Repo Release Discipline
- **Strict `MAJOR.MINOR.PATCH` Versioning (`ADR-027c`):** Use `1.0.x` strictly for non-breaking bug/security/audit patches, `1.x.0` for backwards-compatible new features, and never bump to `2.0.0` without explicit project-owner approval.
- **Committed Emerald `#10B981` Vector Badges:** Keep `docs/badges/built-with-grab.svg` (`Built with GRAB v1.1.0`) and `docs/badges/powered-by-grex-js.svg` (`Powered by Grex JS v1.0.0`) committed and displayed in `README.md`.
- **Dual-Repo Protection & Compatibility Matrix:** Never push unverified or incomplete milestones to `stable` (`urbanspress/groxy-ai.stable`). Every GitHub Release (`v0.1.0`, ..., `v1.0.0`, `v1.0.x`) MUST include the **Release Type & Affected Layers** summary block and **Ecosystem Compatibility Matrix** table alongside the plain-English walkthrough PDF (`docs/releases/pdf/Groxy-AI-v<X.Y.Z>-Guide.pdf`).
