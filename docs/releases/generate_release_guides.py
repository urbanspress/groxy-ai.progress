#!/usr/bin/env python3
"""
Generate plain-English HTML and PDF walkthrough guides for Groxy AI releases.
Outputs:
  - docs/releases/html/Groxy-AI-v<X.Y.Z>-Guide.html
  - docs/releases/pdf/Groxy-AI-v<X.Y.Z>-Guide.pdf
"""

import os
import shutil
import subprocess
import sys
from pathlib import Path

RELEASE_DIR = Path(__file__).resolve().parent
HTML_DIR = RELEASE_DIR / "html"
PDF_DIR = RELEASE_DIR / "pdf"


def find_headless_browser() -> str:
    env_bin = os.environ.get("PDF_BROWSER_BIN")
    if env_bin and Path(env_bin).exists():
        return env_bin

    for candidate in ["google-chrome", "chromium", "chromium-browser", "msedge", "chrome"]:
        resolved = shutil.which(candidate)
        if resolved:
            return resolved

    windows_candidates = [
        Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"),
        Path(r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"),
        Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe"),
        Path(r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"),
    ]
    for path in windows_candidates:
        if path.exists():
            return str(path)

    raise FileNotFoundError(
        "No Chromium/Chrome/Edge executable found for HTML-to-PDF rendering. Set PDF_BROWSER_BIN."
    )


def render_v010_html() -> str:
    return """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Groxy AI v0.1.0 — Plain-English Architecture &amp; Walkthrough Guide</title>
  <style>
    @page { size: letter; margin: 0.7in; }
    body {
      font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.55;
      font-size: 10.5pt;
      margin: 0;
    }
    header {
      border-bottom: 3px solid #1d4ed8;
      padding-bottom: 0.75rem;
      margin-bottom: 1.25rem;
    }
    h1 { font-size: 20pt; margin: 0 0 0.25rem 0; color: #0f172a; }
    h2 {
      font-size: 13.5pt;
      margin: 1.35rem 0 0.5rem 0;
      color: #1e3a8a;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 0.2rem;
      page-break-after: avoid;
    }
    h3 { font-size: 11pt; margin: 0.9rem 0 0.3rem 0; color: #0f172a; }
    p { margin: 0.4rem 0 0.65rem 0; }
    ul, ol { margin: 0.35rem 0 0.75rem 1.25rem; padding: 0; }
    li { margin-bottom: 0.3rem; }
    .subtitle { color: #334155; font-size: 11pt; margin: 0; }
    .meta { color: #475569; font-size: 9.5pt; margin-top: 0.4rem; }
    .callout {
      background: #f8fafc;
      border-left: 4px solid #1d4ed8;
      padding: 0.75rem 0.9rem;
      margin: 0.85rem 0;
      border-radius: 0 6px 6px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 0.75rem 0 1rem 0;
      font-size: 9.2pt;
      page-break-inside: avoid;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 0.42rem 0.55rem;
      text-align: left;
      vertical-align: top;
    }
    th { background: #eff6ff; color: #0f172a; font-weight: 700; }
    code {
      font-family: Consolas, "Courier New", monospace;
      background: #f1f5f9;
      padding: 0.08rem 0.28rem;
      border-radius: 4px;
      font-size: 9pt;
    }
    footer {
      margin-top: 1.5rem;
      padding-top: 0.6rem;
      border-top: 1px solid #e2e8f0;
      color: #475569;
      font-size: 9pt;
    }
  </style>
</head>
<body>
  <header>
    <h1>Groxy AI v0.1.0 Walkthrough Guide</h1>
    <p class="subtitle">Core <code>grab mcp</code> Client, Curated 22-Rule SEO Playbook &amp; Deterministic 4-Pillar Auditor</p>
    <p class="meta">Release Series: Post-1.0 Step 4 &bull; Runtime: GRAB v1.1.0 + Grex JS v1.0.0 &bull; Human-in-the-Loop Safe</p>
  </header>

  <section class="callout">
    <p><strong>What Groxy AI Does in Plain English:</strong> Groxy AI is an autonomous design, content, and search-readiness inspector for sites built on GRAB, Grex JS, GrabLab CMS, and Grex Theme Builder. In <strong>v0.1.0</strong>, Groxy AI introduces its local-first 22-rule SEO &amp; clean-code playbook, a repeatable <code>0–100</code> (<code>A+</code>–<code>F</code>) scorecard, a zero-wrapper-<code>&lt;div&gt;</code> browser Inspector UI, and a safety-gated MCP bridge that can read live CMS and Theme Builder contracts without ever charging external API fees or auto-publishing changes.</p>
  </section>

  <section>
    <h2>1. How the 5-Layer Ecosystem Works Together</h2>
    <p>Groxy AI sits cleanly on top of the four completed 1.0 upstream layers without modifying any upstream source code:</p>
    <table>
      <thead>
        <tr>
          <th>Layer</th>
          <th>Repository &amp; Version</th>
          <th>Role in Groxy AI v0.1.0</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1. Language, VM &amp; Server</td>
          <td><code>urbanspress/grab</code> (&ge; v1.1.0)</td>
          <td>Runs <code>src/groxy.grab</code>, compiles <code>views/dashboard.grab.html</code>, enforces capability sandboxing (<code>--allow-net</code>, <code>--allow-read</code>, <code>--allow-cache</code>), and serves CLI diagnostics via <code>grab mcp</code>.</td>
        </tr>
        <tr>
          <td>2. Reactive Frontend Runtime</td>
          <td><code>urbanspress/grex-js</code> (&ge; v1.0.0)</td>
          <td>Provides <code>signal</code>/<code>computed</code>/<code>effect</code>, <code>setSafeText</code>, and <code>auditAccessibility</code> for the zero-<code>&lt;div&gt;</code> Groxy Inspector UI.</td>
        </tr>
        <tr>
          <td>3. Zero-Plugin CMS</td>
          <td><code>urbanspress/grablab-cms</code> (&ge; v1.0.1)</td>
          <td>Exposes content types, entries, menus, media, and draft-only authoring tools over <code>POST /api/mcp</code> and <code>GET /static/grex/grex.elements.json</code>.</td>
        </tr>
        <tr>
          <td>4. Visual Theme Studio</td>
          <td><code>urbanspress/grex-builder</code> (&ge; v1.0.0)</td>
          <td>Exports light/dark <code>--grex-*</code> design tokens and reusable classes via <code>GET /api/design-system.md</code> and validates candidate layouts at <code>POST /api/mcp/layout</code>.</td>
        </tr>
        <tr>
          <td>5. Autonomous Inspector</td>
          <td><code>urbanspress/groxy-ai</code> (<strong>v0.1.0</strong>)</td>
          <td>Scores content and layouts across 22 deterministic rules, inspects live MCP capabilities, and surfaces clear plain-English fixes.</td>
        </tr>
      </tbody>
    </table>
  </section>

  <section>
    <h2>2. The Curated 22-Rule SEO Playbook &amp; 4-Pillar Scorecard</h2>
    <p>Every audit evaluates content against <code>playbook/seo-playbook.v1.json</code> across four equally weighted pillars (25% each, 100 points per pillar):</p>
    <table>
      <thead>
        <tr>
          <th>Pillar (25% Weight)</th>
          <th>Rule IDs</th>
          <th>What Groxy Checks</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>A. On-Page SEO</strong></td>
          <td><code>GROXY-SEO-001</code> .. <code>008</code></td>
          <td>50–60 char title window, natural focus keyword placement, 120–158 char meta excerpt, clean lowercase slug (zero reserved-route collisions), single <code>&lt;h1&gt;</code>, depth with H2/H3 subheadings, cannibalization check, and exact base-10 <code>GrabDecimal</code>/<code>GrabInteger</code> wire strings (catching float drift).</td>
        </tr>
        <tr>
          <td><strong>B. Content &amp; WCAG AA</strong></td>
          <td><code>GROXY-A11Y-001</code> .. <code>005</code></td>
          <td>WCAG AA contrast ratios (&ge; 4.5:1 normal, &ge; 3.0:1 large), meaningful image <code>alt</code> attributes, accessible form labels, sequential headings without skipped levels, and accessible button/link labels with visible focus outlines.</td>
        </tr>
        <tr>
          <td><strong>C. Performance &amp; Clean DOM</strong></td>
          <td><code>GROXY-DOM-001</code> .. <code>005</code></td>
          <td>Zero wrapper <code>&lt;div&gt;</code> elements, strict 20-element <code>grex.elements.json</code> taxonomy compliance, zero inline scripts/<code>innerHTML</code>/<code>javascript:</code> URLs, lean DOM depth (&le; 10 ideal, &le; 24 max), and verified <code>GRAB-DESIGN-SYSTEM.md</code> token/class usage.</td>
        </tr>
        <tr>
          <td><strong>D. Linking &amp; Schema Readiness</strong></td>
          <td><code>GROXY-LINK-001</code> .. <code>004</code></td>
          <td>Descriptive internal anchor text (flagging vague "click here" links), 301 redirect chain &amp; self-loop detection, orphan page discoverability via menus/sibling entries, and Product/Article/WebPage structured data readiness.</td>
        </tr>
      </tbody>
    </table>
    <p><strong>Safety Gate Hard-Cap:</strong> Any layout containing a wrapper <code>&lt;div&gt;</code> (<code>GROXY-DOM-001</code>) or unsafe script/handler/URL injection (<code>GROXY-DOM-003</code>) is immediately capped at score <code>&le; 59</code>, grade <code>F</code>, and <code>publish_safe: false</code>.</p>
  </section>

  <section>
    <h2>3. Key Files, Endpoints &amp; Safety Guarantees</h2>
    <ul>
      <li><strong><code>src/groxy.grab</code> &amp; <code>views/dashboard.grab.html</code>:</strong> Serves <code>GET /groxy</code>, <code>GET /_health</code>, <code>GET /_ready</code>, <code>GET /api/groxy/playbook</code>, CSRF-protected <code>POST /api/groxy/audit</code>, and <code>POST /api/groxy/mcp/inspect</code>.</li>
      <li><strong><code>public/groxy/auditor.js</code> &amp; <code>playbook.js</code>:</strong> Deterministic zero-dependency auditor and <code>GRAB-DESIGN-SYSTEM.md</code> parser usable identically in Node tests and browsers.</li>
      <li><strong><code>public/groxy/mcp-client.js</code>:</strong> Enforces SSRF/default-deny <code>--allow-net</code> rules (<code>GRAB-E402</code>), read-only CLI MCP defaults (<code>GRAB-E401</code>), <code>status: "draft"</code> on GrabLab drafts (<code>GROXY-SAFE-001</code>), and <code>actor: "groxy-ai"</code> attribution on candidate Theme Builder layouts.</li>
      <li><strong>Zero Auto-Publish Policy:</strong> Groxy AI v0.1.0 never auto-publishes entries or overwrites live templates. Human editors review drafts and scorecards before publishing.</li>
    </ul>
  </section>

  <section>
    <h2>4. Quickstart &amp; Verification Summary</h2>
    <p>Run Groxy AI locally with strict capability flags and verify all checks:</p>
    <ul>
      <li>Static check &amp; format: <code>grab check --platform-config grab.platform.json src/groxy.grab</code></li>
      <li>Start Inspector server: <code>grab serve --addr 127.0.0.1:8090 --allow-scripts --platform-config grab.platform.json --allow-cache groxy:read-write --static public --allow-read . src/groxy.grab</code></li>
      <li>Automated test gates: <code>node --test tests/unit_*.test.js</code> (14/14 passing) and <code>python tests/integration_e2e.py</code> (Gates 1, 2, 3A <code>grab mcp</code>, and 3B live 4-layer GRAB + GrabLab CMS + Grex Theme Builder + Groxy AI passing 100%).</li>
    </ul>
  </section>

  <footer>
    <p>Groxy AI v0.1.0 &bull; Urban's Press / GRAB Ecosystem &bull; SemVer Tier: Pre-1.0 Foundation Release (Drop-in compatible with GRAB v1.1.0, Grex JS v1.0.0, GrabLab CMS v1.0.1, Grex Theme Builder v1.0.0)</p>
  </footer>
</body>
</html>
"""


def render_v020_html() -> str:
    return """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Groxy AI v0.2.0 — Plain-English Architecture &amp; Walkthrough Guide</title>
  <style>
    @page { size: letter; margin: 0.7in; }
    body {
      font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.55;
      font-size: 10.5pt;
      margin: 0;
    }
    header {
      border-bottom: 3px solid #1d4ed8;
      padding-bottom: 0.75rem;
      margin-bottom: 1.25rem;
    }
    h1 { font-size: 20pt; margin: 0 0 0.25rem 0; color: #0f172a; }
    h2 {
      font-size: 13.5pt;
      margin: 1.35rem 0 0.5rem 0;
      color: #1e3a8a;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 0.2rem;
      page-break-after: avoid;
    }
    p { margin: 0.4rem 0 0.65rem 0; }
    ul, ol { margin: 0.35rem 0 0.75rem 1.25rem; padding: 0; }
    li { margin-bottom: 0.3rem; }
    .subtitle { color: #334155; font-size: 11pt; margin: 0; }
    .meta { color: #475569; font-size: 9.5pt; margin-top: 0.4rem; }
    .callout {
      background: #f8fafc;
      border-left: 4px solid #1d4ed8;
      padding: 0.75rem 0.9rem;
      margin: 0.85rem 0;
      border-radius: 0 6px 6px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 0.75rem 0 1rem 0;
      font-size: 9.2pt;
      page-break-inside: avoid;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 0.42rem 0.55rem;
      text-align: left;
      vertical-align: top;
    }
    th { background: #eff6ff; color: #0f172a; font-weight: 700; }
    code {
      font-family: Consolas, "Courier New", monospace;
      background: #f1f5f9;
      padding: 0.08rem 0.28rem;
      border-radius: 4px;
      font-size: 9pt;
    }
    footer {
      margin-top: 1.5rem;
      padding-top: 0.6rem;
      border-top: 1px solid #e2e8f0;
      color: #475569;
      font-size: 9pt;
    }
  </style>
</head>
<body>
  <header>
    <h1>Groxy AI v0.2.0 Walkthrough Guide</h1>
    <p class="subtitle">Pre-Publish SEO &amp; Performance Grade Review Gate &amp; &ldquo;Let Groxy Boost This&rdquo; Side-by-Side Diff Engine</p>
    <p class="meta">Release Series: Post-1.0 Step 4 &bull; Runtime: GRAB v1.1.0 + Grex JS v1.0.0 &bull; SemVer Tier: Pre-1.0 Feature Release</p>
  </header>

  <section class="callout">
    <p><strong>What Groxy AI v0.2.0 Adds in Plain English:</strong> Before a post, product, or page goes live, editors can opt in to Groxy AI&rsquo;s <strong>Pre-Publish Grade Review Gate</strong>. Groxy scores the draft from <code>A+</code> to <code>F</code> across 22 deterministic rules, then gives the author two clear choices: click <strong>Make This Live</strong> immediately as-is, or click <strong>Let Groxy Boost This</strong> to preview a clean side-by-side <strong>Before vs. After Diff</strong> that lifts failing drafts to <code>A</code>/<code>A+</code> without altering prices or publishing anything until the editor clicks <strong>Approve &amp; Make This Live</strong>.</p>
  </section>

  <section>
    <h2>1. Opt-In Pre-Publish Grade Review Gate</h2>
    <ul>
      <li><strong>Endpoint:</strong> CSRF-protected <code>POST /api/groxy/prepublish-review</code> (<code>src/groxy.grab</code> &amp; <code>public/groxy/booster.js</code>).</li>
      <li><strong>Opt-In Behavior:</strong> When <code>groxy_assist_enabled</code> is <code>false</code>, the gate returns <code>gate_status: "bypassed"</code> with zero interference. When <code>true</code>, Groxy runs the 22-rule 4-pillar auditor and opens an accessible, zero-wrapper-<code>&lt;div&gt;</code> review screen.</li>
      <li><strong>Explicit Human Choices:</strong> Authors choose either <code>make_live</code> (<strong>Make This Live</strong>) or <code>boost</code> (<strong>Let Groxy Boost This</strong>).</li>
    </ul>
  </section>

  <section>
    <h2>2. Deterministic &ldquo;Let Groxy Boost This&rdquo; Remediation &amp; Side-by-Side Diff</h2>
    <p><code>POST /api/groxy/boost</code> deterministically fixes flagged issues across both the CMS entry and the Grex visual layout while guaranteeing safety:</p>
    <table>
      <thead>
        <tr>
          <th>Remediated Area</th>
          <th>What Groxy AI v0.2.0 Fixes</th>
          <th>Safety Invariant Enforced</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>On-Page SEO</strong></td>
          <td>Expands short titles/excerpts into 45–60 char SEO titles and 120–155 char descriptions; replaces noisy admin slugs with clean kebab-case slugs; strengthens thin copy when needed.</td>
          <td>Original draft in GrabLab CMS remains 100% untouched during preview.</td>
        </tr>
        <tr>
          <td><strong>DOM &amp; Accessibility</strong></td>
          <td>Converts wrapper <code>&lt;div&gt;</code> nodes to semantic Grex containers (<code>&lt;main&gt;</code>/<code>&lt;section&gt;</code>), fixes skipped <code>H1 &rarr; H3</code> heading levels, adds missing <code>alt</code> attributes, and replaces low-contrast colors with <code>--grex-*</code> / <code>.grex-c-*</code> tokens.</td>
          <td>Strips scripts, inline <code>on*</code> handlers, and <code>javascript:</code>/<code>data:</code> URLs; re-audits to guarantee <code>divCount === 0</code> &amp; <code>publish_safe === true</code>.</td>
        </tr>
        <tr>
          <td><strong>Exact Numbers &amp; 301 Links</strong></td>
          <td>Replaces vague <code>click here</code> anchor text and resolves stale <code>/old-guide</code> links pointing at <code>slug_history</code> or <code>redirects</code> to the canonical target.</td>
          <td><code>ADR-025c</code>: Preserves base-10 <code>GrabDecimal</code> (<code>"49.99"</code>) and <code>GrabInteger</code> (<code>"10042"</code>) strings byte-for-byte.</td>
        </tr>
      </tbody>
    </table>
  </section>

  <section>
    <h2>3. Human-Approval Persistence &amp; Ecosystem Compatibility</h2>
    <ul>
      <li><strong>Single-Use Approval Gate:</strong> <code>POST /api/groxy/boost/approve</code> requires a valid <code>X-CSRF-Token</code> plus the single-use <code>approval_token</code> issued by <code>/api/groxy/boost</code>. Invalid tokens fail with <code>403</code>; replayed tokens fail with <code>409</code> (<code>GROXY-SAFE-001</code>).</li>
      <li><strong>Draft-Only &amp; Actor-Attributed Dispatch:</strong> Approved boosts save entries via GrabLab CMS MCP <code>create_entry_draft</code> (forced <code>status: "draft"</code>) and candidate layouts via Grex Theme Builder <code>POST /api/mcp/layout</code> (<code>actor: "groxy-ai"</code>), keeping the live published site unchanged until final human confirmation.</li>
      <li><strong>Zero Upstream Modifications:</strong> 100% compatible with frozen baselines <code>GRAB v1.1.0</code>, <code>Grex JS v1.0.0</code>, <code>GrabLab CMS v1.0.1</code>, and <code>Grex Theme Builder v1.0.0</code>.</li>
    </ul>
  </section>

  <section>
    <h2>4. Verification Summary</h2>
    <ul>
      <li><code>grab check --platform-config grab.platform.json src/groxy.grab</code> &amp; non-destructive byte-for-byte <code>grab format</code> verification: <strong>Passed</strong>.</li>
      <li><code>node --test tests/unit_*.test.js</code> (unit + zero-<code>&lt;div&gt;</code>/zero-<code>innerHTML</code> DOM + Boost diff tests): <strong>19/19 Passed</strong>.</li>
      <li><code>python tests/integration_e2e.py</code> (Gates 1, 2, 3A <code>grab mcp</code>, 3B live 4-layer GRAB + GrabLab CMS + Grex Theme Builder + Groxy AI v0.2.0): <strong>Passed 100%</strong>.</li>
    </ul>
  </section>

  <footer>
    <p>Groxy AI v0.2.0 &bull; Urban's Press / GRAB Ecosystem &bull; Human-in-the-Loop Safe &bull; Verified Zero-<code>&lt;div&gt;</code> Semantic Architecture</p>
  </footer>
</body>
</html>
"""


def render_v030_html() -> str:
    return """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Groxy AI v0.3.0 Walkthrough Guide</title>
  <style>
    @page { size: letter; margin: 0.65in; }
    * { box-sizing: border-box; }
    body {
      font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.5;
      font-size: 10.2pt;
      margin: 0;
    }
    header {
      border-bottom: 3px solid #047857;
      padding-bottom: 0.7rem;
      margin-bottom: 1rem;
    }
    h1 { margin: 0 0 0.2rem 0; font-size: 20pt; color: #064e3b; }
    .subtitle { margin: 0; color: #334155; font-size: 11pt; font-weight: 600; }
    .meta { margin: 0.35rem 0 0 0; color: #475569; font-size: 9.2pt; }
    h2 {
      margin: 1.1rem 0 0.45rem 0;
      font-size: 13pt;
      color: #065f46;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 0.18rem;
      page-break-after: avoid;
    }
    p { margin: 0.35rem 0 0.55rem 0; }
    ul { margin: 0.25rem 0 0.65rem 1.2rem; padding: 0; }
    li { margin-bottom: 0.25rem; }
    .callout {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-left: 4px solid #047857;
      border-radius: 6px;
      padding: 0.65rem 0.85rem;
      margin: 0.7rem 0;
      page-break-inside: avoid;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 0.75rem 0 1rem 0;
      font-size: 9.2pt;
      page-break-inside: avoid;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 0.42rem 0.55rem;
      text-align: left;
      vertical-align: top;
    }
    th { background: #ecfdf5; color: #0f172a; font-weight: 700; }
    code {
      font-family: Consolas, "Courier New", monospace;
      background: #f1f5f9;
      padding: 0.08rem 0.28rem;
      border-radius: 4px;
      font-size: 9pt;
    }
    footer {
      margin-top: 1.5rem;
      padding-top: 0.6rem;
      border-top: 1px solid #e2e8f0;
      color: #475569;
      font-size: 9pt;
    }
  </style>
</head>
<body>
  <header>
    <h1>Groxy AI v0.3.0 Walkthrough Guide</h1>
    <p class="subtitle">Autonomous <code>GRAB-DESIGN-SYSTEM.md</code>-Aware Visual Page &amp; Section Generator for Grex Theme Builder</p>
    <p class="meta">Release Series: Post-1.0 Step 4 &bull; Runtime: GRAB v1.1.0 + Grex JS v1.0.0 &bull; SemVer Tier: Pre-1.0 Feature Release</p>
  </header>

  <section class="callout">
    <p><strong>What Groxy AI v0.3.0 Adds in Plain English:</strong> Designers and content authors can now compose complete landing pages or modular page sections (Hero Sections, Pricing Grids, FAQ Accordions, and dynamic <code>ForEach</code> showcases) by picking a curated visual <strong>Style Pack</strong>, target slot, and topic. Every generated section automatically inherits your site&rsquo;s live <code>--grex-*</code> colors and <code>.grex-c-*</code> utility classes from <code>GRAB-DESIGN-SYSTEM.md</code>, enforces zero wrapper <code>&lt;div&gt;</code> tags and exact <code>GrabDecimal</code> pricing, verifies a Grade <code>A</code>/<code>A+</code> WCAG AA scorecard before previewing, and waits for your single-use approval before dispatching to Grex Theme Builder with 1-click <code>Ctrl+Z</code> Undo support.</p>
  </section>

  <section>
    <h2>1. Curated Zero-Fee Style Packs &amp; 5 Page/Section Blueprints</h2>
    <ul>
      <li><strong>Catalog Endpoint:</strong> <code>GET /api/groxy/style-packs</code> returns 4 deterministic Design Style Packs and 5 Blueprints (<code>public/groxy/generator.js</code> &amp; <code>src/groxy.grab</code>).</li>
      <li><strong>4 Design Style Packs:</strong> <code>emerald-editorial</code> (Emerald Editorial), <code>obsidian-tech</code> (Obsidian Developer Studio), <code>warm-commerce</code> (Warm Precision Commerce), and <code>swiss-minimal</code> (Swiss Grid Minimal).</li>
      <li><strong>5 Semantic Blueprints:</strong> <code>full_landing_page</code>, <code>hero_section</code>, <code>pricing_grid</code>, <code>faq_accordion</code>, and <code>foreach_showcase</code> built purely from the 20 approved <code>grex.elements.json</code> components.</li>
    </ul>
  </section>

  <section>
    <h2>2. Safety, Accessibility &amp; Exact Decimal Guarantees</h2>
    <table>
      <thead>
        <tr>
          <th>Verification Gate</th>
          <th>How Groxy AI v0.3.0 Enforces It</th>
          <th>Protected Layer / Standard</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Live Design-System Sync</strong></td>
          <td>Fetches <code>GET /api/design-system.md</code>, extracts active <code>--grex-*</code> custom properties and registered <code>.grex-c-*</code> classes, and automatically repairs low-contrast overrides to meet &ge; 4.5:1 WCAG AA contrast.</td>
          <td><code>GRAB-DESIGN-SYSTEM.md</code> &amp; <code>Grex Theme Builder v1.0.0</code></td>
        </tr>
        <tr>
          <td><strong>Strict Schema &amp; Zero-<code>&lt;div&gt;</code> Gate</strong></td>
          <td>Validates every candidate node tree against <code>validateElementNode({ strictProps: true })</code>, <code>auditAccessibility()</code>, and Groxy&rsquo;s 22-rule 4-pillar auditor (requiring score &ge; 90 Grade <code>A</code>/<code>A+</code> &amp; <code>publish_safe: true</code>).</td>
          <td><code>Grex JS v1.0.0</code> &amp; Groxy AI Playbook</td>
        </tr>
        <tr>
          <td><strong>Exact Base-10 Pricing Strings</strong></td>
          <td>Rejects JavaScript float prices with HTTP <code>422</code> and preserves base-10 <code>GrabDecimal</code> (<code>"0.00"</code>, <code>"29.00"</code>, <code>"149.95"</code>) and <code>GrabInteger</code> (<code>"10020"</code>) wire strings byte-for-byte.</td>
          <td><code>ADR-025c</code> (Tier Cards &amp; Companion Entry Custom Fields)</td>
        </tr>
      </tbody>
    </table>
  </section>

  <section>
    <h2>3. Human-in-the-Loop Preview, MCP Dispatch &amp; 1-Click Undo</h2>
    <ul>
      <li><strong>Non-Mutating Studio Preview (<code>POST /api/groxy/generate-layout</code>):</strong> Renders an interactive zero-<code>&lt;div&gt;</code> live preview canvas, hierarchical semantic node tree inspector, applied <code>--grex-*</code> / <code>.grex-c-*</code> badges, and 4-pillar scorecard in <code>/groxy</code> without writing to GrabLab CMS or Grex Theme Builder.</li>
      <li><strong>Single-Use Token Dispatch (<code>POST /api/groxy/generate-layout/apply</code>):</strong> Requires valid <code>X-CSRF-Token</code> plus the single-use <code>approval_token</code> (<code>403</code> invalid, <code>409</code> replay). Dispatches to Grex Theme Builder <code>POST /api/mcp/layout</code> with <code>actor: "groxy-ai"</code> and records a reversible <code>applyAiLayout</code> command stack entry for 1-click Undo restoration.</li>
      <li><strong>Draft-Only CMS Persistence (<code>GROXY-SAFE-001</code>):</strong> When creating a companion entry in GrabLab CMS via <code>create_entry_draft</code>, inspects live type field definitions and strictly enforces <code>status_enforced: "draft"</code>.</li>
    </ul>
  </section>

  <section>
    <h2>4. Verification Summary</h2>
    <ul>
      <li><code>grab check --platform-config grab.platform.json src/groxy.grab</code> &amp; non-destructive byte-for-byte <code>grab format</code> verification: <strong>Passed</strong>.</li>
      <li><code>node --test tests/unit_*.test.js</code> (unit + Generator Studio DOM + 20-matrix Style Pack &times; Blueprint + <code>ADR-025c</code> tests): <strong>28/28 Passed</strong>.</li>
      <li><code>python tests/integration_e2e.py</code> (Gates 1, 2, 3A <code>grab mcp</code>, 3B live 4-layer GRAB v1.1.0 + GrabLab CMS v1.0.1 + Grex Theme Builder v1.0.0 + Groxy AI v0.3.0 + live <code>applyAiLayout</code> 1-click Undo): <strong>Passed 100%</strong>.</li>
    </ul>
  </section>

  <footer>
    <p>Groxy AI v0.3.0 &bull; Urban's Press / GRAB Ecosystem &bull; Human-in-the-Loop Safe &bull; Verified Zero-<code>&lt;div&gt;</code> Semantic Architecture</p>
  </footer>
</body>
</html>
"""


def main():
    version = sys.argv[1].lstrip("v") if len(sys.argv) > 1 else "0.3.0"
    renderers = {
        "0.1.0": render_v010_html,
        "0.2.0": render_v020_html,
        "0.3.0": render_v030_html,
    }
    if version not in renderers:
        raise ValueError(f"Unsupported guide version '{version}'. Available: {', '.join(sorted(renderers))}")

    HTML_DIR.mkdir(parents=True, exist_ok=True)
    PDF_DIR.mkdir(parents=True, exist_ok=True)

    html_path = HTML_DIR / f"Groxy-AI-v{version}-Guide.html"
    pdf_path = PDF_DIR / f"Groxy-AI-v{version}-Guide.pdf"
    html_path.write_text(renderers[version](), encoding="utf-8")

    browser = find_headless_browser()
    file_url = html_path.resolve().as_uri()
    cmd = [
        browser,
        "--headless",
        "--disable-gpu",
        "--no-pdf-header-footer",
        f"--print-to-pdf={pdf_path.resolve()}",
        file_url,
    ]
    proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=30)
    if proc.returncode != 0 or not pdf_path.exists() or pdf_path.stat().st_size == 0:
        raise RuntimeError(
            f"PDF generation failed ({proc.returncode}):\nSTDOUT: {proc.stdout}\nSTDERR: {proc.stderr}"
        )
    print(f"Generated {html_path}")
    print(f"Generated {pdf_path} ({pdf_path.stat().st_size} bytes)")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"[ERROR] {exc}", file=sys.stderr)
        sys.exit(1)
