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


def render_v040_html() -> str:
    return """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Groxy AI v0.4.0 Walkthrough Guide</title>
  <style>
    @page { size: letter; margin: 0.65in; }
    * { box-sizing: border-box; }
    body {
      font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.48;
      font-size: 10pt;
      margin: 0;
    }
    header {
      border-bottom: 3px solid #047857;
      padding-bottom: 0.65rem;
      margin-bottom: 0.9rem;
    }
    h1 { margin: 0 0 0.2rem 0; font-size: 19pt; color: #064e3b; }
    .subtitle { margin: 0; color: #334155; font-size: 10.6pt; font-weight: 600; }
    .meta { margin: 0.3rem 0 0 0; color: #475569; font-size: 9pt; }
    h2 {
      margin: 1rem 0 0.4rem 0;
      font-size: 12.5pt;
      color: #065f46;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 0.16rem;
      page-break-after: avoid;
    }
    p { margin: 0.3rem 0 0.5rem 0; }
    ul { margin: 0.2rem 0 0.6rem 1.2rem; padding: 0; }
    li { margin-bottom: 0.22rem; }
    .callout {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-left: 4px solid #047857;
      border-radius: 6px;
      padding: 0.6rem 0.8rem;
      margin: 0.65rem 0;
      page-break-inside: avoid;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 0.65rem 0 0.9rem 0;
      font-size: 9pt;
      page-break-inside: avoid;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 0.38rem 0.5rem;
      text-align: left;
      vertical-align: top;
    }
    th { background: #ecfdf5; color: #0f172a; font-weight: 700; }
    code {
      font-family: Consolas, "Courier New", monospace;
      background: #f1f5f9;
      padding: 0.06rem 0.25rem;
      border-radius: 4px;
      font-size: 8.8pt;
    }
    footer {
      margin-top: 1.2rem;
      padding-top: 0.55rem;
      border-top: 1px solid #e2e8f0;
      color: #475569;
      font-size: 8.8pt;
    }
  </style>
</head>
<body>
  <header>
    <h1>Groxy AI v0.4.0 Walkthrough Guide</h1>
    <p class="subtitle">Site-Wide Internal Linking Graph, Schema.org JSON-LD, Media <code>alt</code>-Text Enrichment &amp; Non-Intrusive Background Snapshot Workflows</p>
    <p class="meta">Release Series: Post-1.0 Step 4 &bull; Runtime: GRAB v1.1.0 + Grex JS v1.0.0 &bull; SemVer Tier: Pre-1.0 Feature Release</p>
  </header>

  <section class="callout">
    <p><strong>What Groxy AI v0.4.0 Adds in Plain English:</strong> Groxy expands from single-page checks into <strong>calm, read-only site-wide intelligence</strong>. Designers get 8 industry &amp; goal-filtered Style Packs (<code>40</code> verified WCAG AA combinations), writers keep full control while Groxy builds a background <code>SITE-CONTEXT.md</code> map, discovers orphan pages and safe internal links (strictly excluding <code>301</code> redirect loops), generates XSS-safe <code>schema.org</code> JSON-LD with exact <code>GrabDecimal</code> prices, proposes descriptive Media Library <code>alt</code> text behind 1-click human approval, and delivers a quiet <strong>Morning Boost Report</strong> plus portable <strong>Site DNA</strong> export for Gashboard and <code>grabman</code>.</p>
  </section>

  <section>
    <h2>1. 8 Industry &amp; Goal-Aware Design Style Packs (40 Verified Combinations)</h2>
    <ul>
      <li><strong>Backwards-Compatible Core 4:</strong> <code>emerald-editorial</code>, <code>obsidian-tech</code>, <code>warm-commerce</code>, and <code>swiss-minimal</code> remain intact.</li>
      <li><strong>4 New Industry Packs:</strong> <code>local-service-trust</code>, <code>creative-studio-bold</code>, <code>creator-academy</code>, and <code>wellness-organic</code> with <code>industries</code>, <code>conversion_goals</code> (<code>lead_gen</code>, <code>ecommerce</code>, <code>editorial</code>, <code>saas</code>, <code>portfolio</code>), and Light/Dark WCAG AA <code>&ge; 4.5:1</code> tokens.</li>
      <li><strong>API Filtering:</strong> <code>GET /api/groxy/style-packs?goal=&lt;goal&gt;&amp;industry=&lt;industry&gt;</code> filters packs cleanly across all 5 semantic Blueprints (<code>40</code> validated combinations).</li>
    </ul>
  </section>

  <section>
    <h2>2. Site-Wide Intelligence &amp; Human-Gated Workflows</h2>
    <table>
      <thead>
        <tr>
          <th>Capability &amp; Route(s)</th>
          <th>What It Does in Plain English</th>
          <th>Safety / Ecosystem Guarantee</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Background <code>SITE-CONTEXT.md</code> Sync</strong><br /><code>POST /api/groxy/site-context/sync</code><br /><code>GET /api/groxy/site-context.md</code></td>
          <td>Read-only background snapshot of live GrabLab entries, categories/tags, product prices, navigation menus (<code>primary</code>, <code>footer</code>, <code>mobile</code>), and <code>slug_history</code> <code>301</code> redirects stored in gitignored <code>storage/SITE-CONTEXT.md</code>.</td>
          <td>Never interrupts active writers or mutates live CMS rows; preserves exact base-10 <code>ADR-025c</code> price strings.</td>
        </tr>
        <tr>
          <td><strong>Site-Wide Internal Linking Graph</strong><br /><code>POST /api/groxy/links/analyze</code></td>
          <td>Detects orphan pages, computes <code>0–100</code> link authority, flags broken links and multi-hop <code>301</code> redirect chains/cycles, and suggests natural descriptive internal links.</td>
          <td>Strictly read-only (<code>GROXY-SAFE-001</code>); forbids generic <code>"click here"</code> anchors and excludes all <code>301</code> loop paths from suggestions.</td>
        </tr>
        <tr>
          <td><strong>Deterministic <code>schema.org</code> JSON-LD</strong><br /><code>POST /api/groxy/schema/generate</code></td>
          <td>Builds validated <code>Article</code>, <code>BlogPosting</code>, <code>Product</code>, <code>FAQPage</code>, <code>BreadcrumbList</code>, and <code>WebSite</code> structured data blocks.</td>
          <td>Escapes <code>&lt;/&gt;/&amp;</code> to prevent <code>&lt;/script&gt;</code> XSS breakout; enforces exact base-10 prices and rejects JS floats with HTTP <code>422</code>.</td>
        </tr>
        <tr>
          <td><strong>Media Library <code>alt</code>-Text Enrichment</strong><br /><code>POST /api/groxy/media/enrich-alt</code><br /><code>POST /api/groxy/media/enrich-alt/approve</code></td>
          <td>Finds missing or raw-filename alt values (<code>IMG_1234.jpg</code>) and proposes concise <code>3–125</code> character WCAG AA descriptions.</td>
          <td>Strictly preserves <code>decorative: true</code> images with <code>alt=""</code>; applies edits only with valid <code>X-CSRF-Token</code> + single-use <code>approval_token</code>.</td>
        </tr>
        <tr>
          <td><strong>Nightly Watch &amp; Portable Site DNA</strong><br /><code>POST /api/groxy/watch/run</code><br /><code>GET /api/groxy/watch/digest</code><br /><code>GET /api/groxy/site-dna/export</code></td>
          <td>Produces a calm <strong>Morning Boost Report</strong> with 1-click <strong>Let Groxy Boost This</strong> actions and exports JSON/Markdown <strong>Site DNA</strong> combining <code>GRAB-DESIGN-SYSTEM.md</code> + <code>SITE-CONTEXT.md</code> + Style Tokens.</td>
          <td>Zero popups, zero silent edits; compatible with <strong>Gashboard + <code>grabman</code></strong>.</td>
        </tr>
      </tbody>
    </table>
  </section>

  <section>
    <h2>3. Zero-<code>&lt;div&gt;</code> Studio UI &amp; Verification Summary</h2>
    <ul>
      <li><strong>Zero-<code>&lt;div&gt;</code> Semantic UI (<code>views/dashboard.grab.html</code>, <code>public/groxy/dashboard.js</code>):</strong> Style Pack industry/goal filters and all 5 Site Intelligence &amp; Morning Boost panels render with <code>divCount === 0</code> and <code>innerHTMLWriteCount === 0</code> on Grex JS v1.0.0.</li>
      <li><strong>Static &amp; Canonical Format Gate:</strong> <code>grab check --platform-config grab.platform.json src/groxy.grab</code> and non-destructive byte-for-byte <code>grab format</code> comparison passed 100%.</li>
      <li><strong>Automated Unit &amp; DOM Suite (<code>node --test tests/*.test.js</code>):</strong> <strong>35/35 tests passed</strong> across all 40 Style Pack &times; Blueprint combinations, link loop exclusion, <code>ADR-025c</code> JSON-LD safety, decorative media preservation, Morning Boost Digest, Site DNA export, and DOM accessibility assertions.</li>
      <li><strong>Live 4-Layer Cross-Layer E2E (<code>python tests/integration_e2e.py</code>):</strong> Gates 1, 2, 3A (<code>grab mcp</code>), and 3B (GRAB v1.1.0 + GrabLab CMS v1.0.1 + Grex Theme Builder v1.0.0 + Groxy AI v0.4.0) <strong>passed 100%</strong>.</li>
    </ul>
  </section>

  <footer>
    <p>Groxy AI v0.4.0 &bull; Urban's Press / GRAB Ecosystem &bull; Human-in-the-Loop Safe &bull; Verified Zero-<code>&lt;div&gt;</code> Semantic Architecture</p>
  </footer>
</body>
</html>
"""


def render_v100_html() -> str:
    return """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Groxy AI v1.0.0 Walkthrough Guide</title>
  <style>
    @page { size: letter; margin: 0.65in; }
    * { box-sizing: border-box; }
    body {
      font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.48;
      font-size: 9.8pt;
      margin: 0;
    }
    header {
      border-bottom: 3px solid #047857;
      padding-bottom: 0.65rem;
      margin-bottom: 0.9rem;
    }
    h1 { margin: 0 0 0.2rem 0; font-size: 19pt; color: #064e3b; }
    .subtitle { margin: 0; color: #334155; font-size: 10.6pt; font-weight: 600; }
    .meta { margin: 0.3rem 0 0 0; color: #475569; font-size: 9pt; }
    h2 {
      margin: 1rem 0 0.4rem 0;
      font-size: 12.2pt;
      color: #065f46;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 0.16rem;
      page-break-after: avoid;
    }
    p { margin: 0.3rem 0 0.5rem 0; }
    ul { margin: 0.2rem 0 0.6rem 1.2rem; padding: 0; }
    li { margin-bottom: 0.22rem; }
    .callout {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-left: 4px solid #047857;
      border-radius: 6px;
      padding: 0.6rem 0.8rem;
      margin: 0.65rem 0;
      page-break-inside: avoid;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 0.65rem 0 0.9rem 0;
      font-size: 8.9pt;
      page-break-inside: avoid;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 0.36rem 0.48rem;
      text-align: left;
      vertical-align: top;
    }
    th { background: #ecfdf5; color: #0f172a; font-weight: 700; }
    code {
      font-family: Consolas, "Courier New", monospace;
      background: #f1f5f9;
      padding: 0.06rem 0.25rem;
      border-radius: 4px;
      font-size: 8.6pt;
    }
    footer {
      margin-top: 1.15rem;
      padding-top: 0.55rem;
      border-top: 1px solid #e2e8f0;
      color: #475569;
      font-size: 8.8pt;
    }
  </style>
</head>
<body>
  <header>
    <h1>Groxy AI v1.0.0 — Production Release Guide</h1>
    <p class="subtitle">Autonomous Design, Content &amp; SEO Intelligence Agent &bull; Hardened <code>--read-only</code> Container Bundle &amp; Frozen <code>v1.x</code> Contracts</p>
    <p class="meta">Post-1.0 Ecosystem Step 4 Complete &bull; Built on GRAB v1.1.0 + Grex JS v1.0.0 + GrabLab CMS v1.0.1 + Grex Theme Builder v1.0.0</p>
  </header>

  <section class="callout">
    <p><strong>What Groxy AI v1.0.0 Delivers in Plain English:</strong> Groxy AI is now production-ready as Step 4 of the GRAB Ecosystem. It gives writers, designers, and site owners a calm, zero-API-fee SEO, accessibility, and visual page assistant that audits every page deterministically across 22 curated rules, boosts weak drafts with side-by-side Before/After previews, generates WCAG AA layouts from 8 Style Packs &times; 5 Blueprints using live <code>GRAB-DESIGN-SYSTEM.md</code> tokens, maps site-wide internal links and <code>schema.org</code> JSON-LD, enriches Media Library <code>alt</code> text, and runs safely inside a locked-down <code>--read-only</code> Docker container without ever auto-publishing live pages.</p>
  </section>

  <section>
    <h2>1. Complete v0.1.0 &rarr; v1.0.0 Capabilities at a Glance</h2>
    <table>
      <thead>
        <tr>
          <th>Milestone</th>
          <th>Core Capability Delivered</th>
          <th>Safety &amp; Precision Guarantee</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>v0.1.0</strong></td>
          <td>22-rule deterministic SEO/A11y/DOM/Linking Playbook, 4-pillar <code>0–100</code> (<code>A+</code>–<code>F</code>) Auditor, zero-<code>&lt;div&gt;</code> <code>/groxy</code> Inspector, and unified <code>grab mcp</code> + CMS + Theme Builder bridge.</td>
          <td>Hard <code>F</code> cap (<code>&le; 59</code>) on wrapper <code>&lt;div&gt;</code> or script/URL injections; read-only MCP defaults (<code>GRAB-E401</code> / <code>GRAB-E402</code>).</td>
        </tr>
        <tr>
          <td><strong>v0.2.0</strong></td>
          <td>Opt-in Pre-Publish Grade Review Gate &amp; <strong>&ldquo;Let Groxy Boost This&rdquo;</strong> side-by-side Before/After diff engine.</td>
          <td><code>X-CSRF-Token</code> + single-use <code>approval_token</code>; <code>create_entry_draft</code> enforces <code>status: "draft"</code>; exact <code>ADR-025c</code> pricing strings preserved.</td>
        </tr>
        <tr>
          <td><strong>v0.3.0</strong></td>
          <td>Autonomous <code>GRAB-DESIGN-SYSTEM.md</code>-aware Visual Page &amp; Section Generator (5 semantic Blueprints, live <code>--grex-*</code> tokens, <code>ForEach</code> loops).</td>
          <td>Every generated layout passes <code>validateElementNode()</code>, <code>auditAccessibility()</code>, Grade <code>A</code>/<code>A+</code> gate, and Grex Theme Builder 1-click <code>Ctrl+Z</code> Undo (<code>actor: "groxy-ai"</code>).</td>
        </tr>
        <tr>
          <td><strong>v0.4.0</strong></td>
          <td>8 Industry &amp; Goal-Aware Style Packs (40 combinations), live <code>SITE-CONTEXT.md</code> sync, Internal Linking Graph, <code>schema.org</code> JSON-LD, Media <code>alt</code> Enrichment, Nightly Watch Digest &amp; Site DNA export.</td>
          <td><code>301</code> redirect loops excluded from link suggestions; <code>&lt;/script&gt;</code> XSS escaping; decorative images keep <code>alt=""</code>; zero popups or silent edits.</td>
        </tr>
        <tr>
          <td><strong>v1.0.0</strong></td>
          <td>Pre-<code>v1.0.0</code> 5-layer security/DOM/contract audit, SemVer <code>v1.x</code> contract freeze across all 22 HTTP routes, hardened <code>deploy/docker-compose.yml</code> (<code>--read-only</code>), and 5-layer E2E verification.</td>
          <td>Immutable rootfs (<code>read_only: true</code>, <code>cap_drop: ["ALL"]</code>, <code>no-new-privileges:true</code>), writable mounts scoped solely to <code>storage/</code> &amp; <code>cache/</code>, zero secrets in Git.</td>
        </tr>
      </tbody>
    </table>
  </section>

  <section>
    <h2>2. Hardened <code>--read-only</code> Production Hosting (<code>deploy/</code>)</h2>
    <ul>
      <li><strong>Immutable Container Root Filesystem:</strong> <code>deploy/docker-compose.yml</code> enforces <code>read_only: true</code>, <code>cap_drop: ["ALL"]</code>, <code>no-new-privileges:true</code>, and <code>tmpfs: /tmp:rw,noexec,nosuid,size=64m</code> with loopback port binding (<code>127.0.0.1:8090:8090</code>) behind Caddy or Nginx TLS.</li>
      <li><strong>Scoped Writable Mounts:</strong> Only <code>../storage:/app/storage:rw</code> (for <code>SITE-CONTEXT.md</code>) and <code>../cache:/app/cache:rw</code> are writable; source files, templates, playbook rules, and Grex JS assets remain read-only.</li>
      <li><strong>Two Ready Modes:</strong> Standalone <code>groxy-ai</code> by default, or full 4-layer stack (<code>docker compose -f deploy/docker-compose.yml --profile ecosystem-stack up -d</code>) alongside <code>grablab-cms</code> (<code>v1.0.1</code>) and <code>grex-builder-studio</code> (<code>v1.0.0</code>).</li>
    </ul>
  </section>

  <section>
    <h2>3. 5-Layer Ecosystem Compatibility &amp; Final Verification</h2>
    <ul>
      <li><strong>Frozen Upstream Baselines (Zero Modifications):</strong> <code>GRAB v1.1.0</code>, <code>Grex JS v1.0.0</code>, <code>GrabLab CMS v1.0.1</code>, and <code>Grex Theme Builder v1.0.0</code>.</li>
      <li><strong>Static &amp; Canonical Format Gate:</strong> <code>grab check --platform-config grab.platform.json src/groxy.grab</code> and non-destructive byte-for-byte <code>grab format</code> comparison passed 100%.</li>
      <li><strong>Automated Unit, DOM &amp; Deploy Audit Suite:</strong> <code>node --test tests/*.test.js</code> passed 100% (0 <code>&lt;div&gt;</code> tags across all 25 ecosystem <code>.grab.html</code> templates, 0 <code>innerHTML</code> writes, 40/40 Style Pack &times; Blueprints WCAG AA pass, <code>ADR-025c</code> exact precision, and hardened <code>deploy/</code> checks).</li>
      <li><strong>Live 4-Layer Cross-Layer E2E:</strong> <code>python tests/integration_e2e.py</code> passed Gates 1, 2, 3A (<code>grab mcp</code>), and 3B (live GRAB + GrabLab CMS + Grex Theme Builder + Groxy AI v1.0.0) 100%.</li>
    </ul>
  </section>

  <footer>
    <p>Groxy AI v1.0.0 &bull; Urban's Press / GRAB Ecosystem &bull; SemVer Tier: v1.0.0 Initial Stable Production Release &bull; Step 4 Complete (Next: Step 5 Gashboard + Grabtaculous + grabman)</p>
  </footer>
</body>
</html>
"""


def render_v110_html() -> str:
    html = render_v100_html()
    html = html.replace("Groxy AI v1.0.0 - Production Release Guide", "Groxy AI v1.1.0 - Screenshot-to-Grex Visual Replica Guide")
    html = html.replace(
        "Autonomous Design, Content &amp; SEO Intelligence Agent &bull; Hardened <code>--read-only</code> Container Bundle &amp; Frozen <code>v1.x</code> Contracts",
        "Screenshot-to-Grex Visual Replica &bull; Approved Feature Milestone Walkthrough",
    )
    html = html.replace(
        "Post-1.0 Ecosystem Step 4 Complete",
        "v1.1.0 implementation checkpoint; live integration verification pending",
    )
    html = html.replace(
        "<section class=\"callout\">\n    <p><strong>What Groxy AI v1.0.0 Delivers in Plain English:</strong> Groxy AI is now production-ready as Step 4 of the GRAB Ecosystem. It gives writers, designers, and site owners a calm, zero-API-fee SEO, accessibility, and visual page assistant that audits every page deterministically across 22 curated rules, boosts weak drafts with side-by-side Before/After previews, generates WCAG AA layouts from 8 Style Packs &times; 5 Blueprints using live <code>GRAB-DESIGN-SYSTEM.md</code> tokens, maps site-wide internal links and <code>schema.org</code> JSON-LD, enriches Media Library <code>alt</code> text, and runs safely inside a locked-down <code>--read-only</code> Docker container without ever auto-publishing live pages.</p>\n  </section>",
        "<section class=\"callout\">\n    <p><strong>What Groxy AI v1.1.0 Adds:</strong> An operator can upload a PNG, JPEG, or WebP reference, inspect the extracted visual hierarchy and palette, review a semantic Grex layout, and explicitly approve its dispatch to Grex Theme Builder. Screenshots are bounded to 5 MiB and verified by magic bytes. The layout is staged behind CSRF protection and a single-use approval token bound to its target and SHA-256 digest. No live page is published automatically.</p>\n  </section>\n\n  <section>\n    <h2>1. Screenshot-to-Grex Workflow</h2>\n    <ol>\n      <li><strong>Upload and verify:</strong> Choose PNG, JPEG, or WebP. The browser and API validate the binary header, MIME match, embedded active-content markers, and the 5 MiB decoded limit. Optional reference files stay under <code>storage/reference_uploads/</code> or fail with <code>GRAB-E401</code>.</li>\n      <li><strong>Analyze and stage:</strong> Deterministic mode is the default. Local Ollama uses only <code>127.0.0.1:11434</code> and falls back to deterministic extraction when unavailable. BYOK requires a configured exact HTTPS allowlist and a capability-gated key; unapproved network targets fail with <code>GRAB-E402</code>.</li>\n      <li><strong>Review the Grex candidate:</strong> The preview uses the 20-element Grex catalog, active <code>--grex-*</code> tokens, registered <code>.grex-c-*</code> classes, contrast repair, exact ADR-025c strings, and the existing 22-rule Grade A gate.</li>\n      <li><strong>Approve or discard:</strong> Apply requires an explicit click and a one-use token bound to <code>{ clone_id, slot, layout_sha256 }</code>. The Builder records an undoable <code>applyAiLayout</code> action. Optional GrabLab persistence calls <code>create_entry_draft</code> with <code>status: \"draft\"</code>.</li>\n    </ol>\n  </section>\n\n  <section>\n    <h2>2. New API Routes</h2>\n    <table><thead><tr><th>Route</th><th>Purpose</th><th>Failure behavior</th></tr></thead><tbody>\n      <tr><td><code>POST /api/groxy/vision-clone</code></td><td>Verify screenshot, extract visual hints, compile and stage a zero-div Grex candidate.</td><td><code>422</code> invalid image/numeric values; <code>413</code> over 5 MiB; <code>403</code> CSRF or path/network safety violation.</td></tr>\n      <tr><td><code>POST /api/groxy/vision-clone/apply</code></td><td>Check the target-bound token and dispatch the approved tree to Theme Builder.</td><td><code>403</code> token/target mismatch; <code>409</code> replay; <code>503</code> Builder not configured.</td></tr>\n    </tbody></table>\n    <p><strong>Release verification note:</strong> This walkthrough describes the approved implementation. Live cross-layer Gate 3B must pass before the release is marked complete or promoted to stable.</p>\n  </section>"
    )
    html = html.replace("<h2>2. Hardened", "<h2>3. Hardened")
    html = html.replace("<h2>3. 5-Layer", "<h2>4. 5-Layer")
    html = html.replace(
        "Groxy AI v1.0.0 &bull; Urban's Press / GRAB Ecosystem &bull; SemVer Tier: v1.0.0 Initial Stable Production Release &bull; Step 4 Complete (Next: Step 5 Gashboard + Grabtaculous + grabman)",
        "Groxy AI v1.1.0 &bull; Urban's Press / GRAB Ecosystem &bull; SemVer Tier: backwards-compatible minor feature &bull; Release status: integration verification pending",
    )
    return html


def render_v120_html() -> str:
    return """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Groxy AI v1.2.0 — Brand DNA &amp; Batch Campaign Guide</title>
  <style>
    @page { size: letter; margin: 0.7in; }
    body { font-family: "Segoe UI", system-ui, sans-serif; color: #0f172a; line-height: 1.55; font-size: 10.5pt; }
    h1 { color: #0f172a; font-size: 22pt; margin-bottom: 0.25rem; }
    h2 { color: #1e3a8a; font-size: 14pt; margin-top: 1.3rem; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.2rem; }
    h3 { font-size: 11pt; margin-top: 0.8rem; }
    .meta { color: #475569; font-size: 9.5pt; }
    .callout { background: #eff6ff; border-left: 4px solid #1d4ed8; padding: 0.7rem 0.9rem; }
    code { font-family: Consolas, monospace; background: #f1f5f9; padding: 0.05rem 0.2rem; }
    table { width: 100%; border-collapse: collapse; font-size: 9pt; margin: 0.8rem 0; }
    th, td { border: 1px solid #94a3b8; padding: 0.35rem; text-align: left; }
    th { background: #e2e8f0; }
    footer { margin-top: 1.5rem; border-top: 1px solid #cbd5e1; padding-top: 0.5rem; color: #475569; font-size: 9pt; }
  </style>
</head>
<body>
  <header>
    <h1>Groxy AI v1.2.0</h1>
    <p><strong>Brand DNA &amp; Voice Setup Wizard + Batch Content and Product Campaigns</strong></p>
    <p class="meta">Implementation status: Verified; dual-repository publication pending &bull; SemVer: MINOR, backwards-compatible feature release &bull; Runtime: GRAB 1.1.0, Grex JS 1.0.0, GrabLab CMS 1.0.1, Grex Theme Builder 1.0.0</p>
  </header>
  <section class="callout">
    <p>Groxy AI now learns a business's audience, voice, local focus, offers, pricing rules, guarantees, and design tokens once. Teams can use that profile to prepare up to 40 related blog or product drafts from a short brief. Every item is audited and reviewed before it can be sent to the CMS.</p>
  </section>
  <section>
    <h2>1. Set up Brand DNA once</h2>
    <p>Open the Groxy dashboard and answer the ten short, step-by-step questions. The wizard captures business identity, audience needs, service area and local search terms, voice weights, forbidden phrases, preferred calls to action, offer types, exact prices, guarantee details, and the selected Design Style Pack and <code>--grex-*</code> tokens.</p>
    <p>Saving requires an explicit submit. Groxy stores the structured profile at <code>storage/brand-dna.v1.json</code> and a readable copy at <code>storage/BRAND-DNA.md</code>. Revision checks prevent an older browser session from silently replacing newer guidance. Prices remain decimal strings; JavaScript floating-point values are rejected.</p>
  </section>
  <section>
    <h2>2. Prepare a campaign preview</h2>
    <p>Choose blog posts or products, enter a one-sentence campaign brief, and select between deterministic built-in generation, local Ollama, or a configured allowlisted BYOK provider. Deterministic generation has no API fee. Ollama uses loopback and falls back cleanly when it is unavailable. BYOK targets must satisfy the configured outbound allowlist.</p>
    <p>Each preview item includes a unique title and slug, semantic content, and escaped <code>Article</code> or <code>Product</code> JSON-LD. Every candidate must pass the 22-rule, four-pillar auditor with a score of at least 90 (Grade A or A+). Product prices keep their exact decimal-string representation.</p>
  </section>
  <section>
    <h2>3. Review and approve drafts</h2>
    <p>Groxy stages an immutable preview and issues a one-time <code>btok_*</code> approval token bound to the batch ID, item count, and SHA-256 batch digest. Applying the preview requires the CSRF token and matching approval token. Invalid or mismatched tokens return 403; a replay returns 409.</p>
    <p>On approval, Groxy sends each item to GrabLab CMS through <code>create_entry_draft</code> with <code>status_enforced: "draft"</code>. The feature never publishes live content automatically.</p>
  </section>
  <section>
    <h2>4. New API routes</h2>
    <table><thead><tr><th>Route</th><th>Purpose</th><th>Safety</th></tr></thead><tbody>
      <tr><td><code>GET /api/groxy/brand-dna</code></td><td>Read the saved profile and revision.</td><td>Read-only; file access remains confined to <code>storage/</code>.</td></tr>
      <tr><td><code>POST /api/groxy/brand-dna/wizard</code></td><td>Validate and save the profile.</td><td>CSRF, exact price strings, bounded fields, revision conflict protection.</td></tr>
      <tr><td><code>POST /api/groxy/batch-create</code></td><td>Audit and stage 1–40 post or product drafts.</td><td>Schema-safe JSON-LD, duplicate checks, deterministic audit, target-bound digest.</td></tr>
      <tr><td><code>POST /api/groxy/batch-create/apply</code></td><td>Send an approved batch to the CMS.</td><td>CSRF, single-use token, draft-only CMS calls.</td></tr>
    </tbody></table>
  </section>
  <section>
    <h2>5. Verification and ecosystem compatibility</h2>
    <p>Implementation verification passed: GRAB check and canonical formatting parity; 54/54 Node unit and DOM tests; live Gate 3B integration for Brand DNA persistence, Site DNA export, audit scoring, invalid-token rejection, CMS draft creation, and replay rejection. All eight frozen sibling repositories remained clean. GitHub release publication is pending restored credentials.</p>
    <table><thead><tr><th>Ecosystem layer</th><th>Required version</th><th>Touched</th><th>Upgrade needed</th></tr></thead><tbody>
      <tr><td>GRAB language, VM and Grisp server</td><td>&gt;=1.1.0 &lt;2.0.0</td><td>No</td><td>No</td></tr>
      <tr><td>Grex JS runtime and element library</td><td>&gt;=1.0.0 &lt;2.0.0</td><td>No</td><td>No</td></tr>
      <tr><td>GrabLab CMS</td><td>&gt;=1.0.1 &lt;2.0.0</td><td>No</td><td>No</td></tr>
      <tr><td>Grex Theme Builder</td><td>&gt;=1.0.0 &lt;2.0.0</td><td>No</td><td>No</td></tr>
      <tr><td>Groxy AI</td><td>&gt;=0.1.0</td><td>Yes, v1.2.0</td><td>No</td></tr>
    </tbody></table>
  </section>
  <footer>Groxy AI v1.2.0 &bull; Urban's Press / GRAB Ecosystem &bull; Implementation verified; publication pending</footer>
</body>
</html>"""


def render_v130_html() -> str:
    return """<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Groxy AI v1.3.0 — Post-Purchase Email Flow Guide</title>
<style>
@page{size:letter;margin:.7in}body{font-family:"Segoe UI",system-ui,sans-serif;color:#0f172a;line-height:1.55;font-size:10.5pt}h1{font-size:22pt}h1,h2{color:#1e3a8a}h2{font-size:14pt;border-bottom:1px solid #cbd5e1;padding-bottom:.2rem;margin-top:1.2rem}.meta{color:#475569;font-size:9.5pt}.callout{background:#eff6ff;border-left:4px solid #1d4ed8;padding:.7rem .9rem}code{font-family:Consolas,monospace;background:#f1f5f9;padding:.05rem .2rem}footer{margin-top:1.5rem;border-top:1px solid #cbd5e1;padding-top:.5rem;color:#475569;font-size:9pt}li{margin:.35rem 0}
</style></head><body>
<header><h1>Groxy AI v1.3.0</h1><p><strong>Autonomous Post-Purchase Email Flow Designer &amp; Copywriter</strong></p><p class="meta">MINOR feature release candidate · GRAB 1.1.0 · Grex JS 1.0.0 · GrabLab CMS 1.0.1 · Grex Theme Builder 1.0.0</p></header>
<section class="callout"><strong>Release status: verification passed; release promotion is withheld.</strong><br>Static checks, all 58 Node tests, and the expanded live four-layer integration gate passed. Canonical flow hashing and concurrency-safe token consumption still need implementation review before this milestone can be marked Complete.</section>
<section><h2>1. Design four grounded messages</h2><p><code>POST /api/groxy/email-flows/design</code> reads the saved Brand DNA and Site Context, fetches the live Builder design tokens, and stages an ordered four-message preview: Order Receipt &amp; Welcome, Quick-Start / Setup Guide, Check-In &amp; Review Request, and Targeted Cross-Sell / Reorder. Missing customer and sender facts remain explicit placeholders. Exact monetary strings stay strings, including trailing zeroes.</p><p>Every message includes a plain-text body and semantic layout with unsubscribe and physical-address placeholders. The flow is draft-only; timing suggestions do not schedule delivery.</p></section>
<section><h2>2. Review and save one CMS draft</h2><p>The dashboard shows the preview and requires a separate <strong>Approve &amp; Save Draft Flow</strong> action. The one-use <code>etok_*</code> approval token is bound to the staged flow ID, step count, digest, CMS destination, and operator. Invalid target attempts return 403; replay returns 409. The flow is saved as one new GrabLab CMS draft through <code>create_entry_draft</code>. Groxy does not send or activate email.</p><p>CAN-SPAM/GDPR-oriented unsubscribe and sender-address placeholders are visible in every message. Consent, suppression, sender identity, and unresolved merge fields remain activation blockers for a future delivery system.</p></section>
<section><h2>3. Routes</h2><ul><li><code>POST /api/groxy/email-flows/design</code> validates inputs, grounds a four-step preview, and stages the draft.</li><li><code>POST /api/groxy/email-flows/apply</code> checks CSRF and target binding, then creates one draft entry only.</li></ul></section>
<section><h2>4. Verification and compatibility</h2><p>Verified in the current workspace: GRAB syntax and canonical source formatting; 58/58 Node tests; Gate 1, Gate 2, Gate 3A, and live Gate 3B including exact-price draft readback, target mismatch, draft enforcement, and replay rejection. Frozen upstream repositories were not modified. Release promotion is pending the remaining canonical digest and atomic single-winner review.</p><ul><li>GRAB: &gt;=1.1.0 &lt;2.0.0 — unchanged</li><li>Grex JS: &gt;=1.0.0 &lt;2.0.0 — unchanged</li><li>GrabLab CMS: &gt;=1.0.1 &lt;2.0.0 — unchanged</li><li>Grex Theme Builder: &gt;=1.0.0 &lt;2.0.0 — unchanged</li><li>Groxy AI: &gt;=0.1.0 — v1.3.0 candidate</li></ul></section>
<footer>Groxy AI v1.3.0 · Urban's Press / GRAB Ecosystem · Release promotion pending</footer></body></html>"""


def render_v150_html() -> str:
    return """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Groxy AI v1.5.0 Walkthrough Guide</title>
  <style>
    @page { size: letter; margin: 0.65in; }
    * { box-sizing: border-box; }
    body {
      font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.48;
      font-size: 9.6pt;
      margin: 0;
    }
    header {
      border-bottom: 3px solid #047857;
      padding-bottom: 0.65rem;
      margin-bottom: 0.9rem;
    }
    h1 { margin: 0 0 0.2rem 0; font-size: 19pt; color: #064e3b; }
    .subtitle { margin: 0; color: #334155; font-size: 10.6pt; font-weight: 600; }
    .meta { margin: 0.3rem 0 0 0; color: #475569; font-size: 9pt; }
    h2 {
      margin: 1rem 0 0.4rem 0;
      font-size: 12.2pt;
      color: #065f46;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 0.16rem;
      page-break-after: avoid;
    }
    p { margin: 0.3rem 0 0.5rem 0; }
    ul { margin: 0.2rem 0 0.6rem 1.2rem; padding: 0; }
    li { margin-bottom: 0.22rem; }
    .callout {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-left: 4px solid #047857;
      border-radius: 6px;
      padding: 0.6rem 0.8rem;
      margin: 0.65rem 0;
      page-break-inside: avoid;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 0.65rem 0 0.9rem 0;
      font-size: 8.8pt;
      page-break-inside: avoid;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 0.36rem 0.48rem;
      text-align: left;
      vertical-align: top;
    }
    th { background: #ecfdf5; color: #0f172a; font-weight: 700; }
    code {
      font-family: Consolas, "Courier New", monospace;
      background: #f1f5f9;
      padding: 0.06rem 0.25rem;
      border-radius: 4px;
      font-size: 8.5pt;
    }
    footer {
      margin-top: 1.15rem;
      padding-top: 0.55rem;
      border-top: 1px solid #e2e8f0;
      color: #475569;
      font-size: 8.8pt;
    }
  </style>
</head>
<body>
  <header>
    <h1>Groxy AI v1.5.0 — Release Walkthrough Guide</h1>
    <p class="subtitle">Bespoke Store Schema Quiz &bull; Opt-In &ldquo;Talk to Groxy&rdquo; Database &amp; Store Consultant &bull; Pre-Mutation Logical Snapshots &amp; CLI Maintenance</p>
    <p class="meta">Post-1.0 Ecosystem Step 4 &bull; Built natively on GRAB v1.1.0 + Grex JS v1.0.0 + GrabLab CMS v1.0.1 + Grex Theme Builder v1.0.0</p>
  </header>

  <section class="callout">
    <p><strong>What Groxy AI v1.5.0 Delivers in Plain English:</strong> Groxy AI v1.5.0 introduces an intelligent database and store schema design layer. Merchants and operators get an eight-step guided interview that generates lean, zero-bloat <code>.grab</code> database migrations tailored to their exact catalog model (physical goods, digital downloads, product variants, inventory, subscription metadata, currency scale rules, operator taxes, bundles, facility fulfillment flags, and white-label partner references). For existing stores, an opt-in AI consultant inspects live table schemas and row counts (via statically configured <code>commerce_inspect:read</code>) alongside template query loops and 301 redirects, flags potential data loss before changes occur, writes verifiable canonical UTF-8 JSON Pre-Mutation Snapshots, and coordinates safe execution through single-winner atomic locking and explicit CLI maintenance.</p>
  </section>

  <section>
    <h2>1. Bespoke Store Architecture Quiz (<code>POST /api/groxy/db/architect-quiz</code>)</h2>
    <ul>
      <li><strong>Eight Semantic Questions:</strong> Interactively configures store capabilities without manual SQL authoring. Generates clean <code>ADR-024f</code> migrations with exact <code>ADR-025c</code> base-10 decimal wire strings.</li>
      <li><strong>Grounding &amp; Impact Diffs:</strong> When bound to an authorized target (such as <code>commerce</code> / <code>commerce_inspect</code> or a verified loopback Desk/Gashboard executor), inspects live <code>sqlite_master</code> tables, columns, indexes, and row counts to produce Before/After schema diffs and mint target-bound <code>dtok_&lt;hex&gt;</code> approval tokens.</li>
      <li><strong>Analytical-Only Safe Mode:</strong> Unconfigured or unregistered targets remain strictly analytical (503 response, zero approval tokens, zero mutations).</li>
    </ul>
  </section>

  <section>
    <h2>2. Opt-In &ldquo;Talk to Groxy&rdquo; Database Consultant (<code>POST /api/groxy/db/consult</code>)</h2>
    <ul>
      <li><strong>Protected Site Setting (<code>groxy_db_consultant_enabled</code>):</strong> Default-disabled (403); must be explicitly enabled by authorized operators. Disabling the consultant immediately revokes outstanding consultant-minted plans at apply time.</li>
      <li><strong>Live Grounding &amp; Impact Analysis:</strong> Queries row counts and live structure from <code>commerce_inspect</code> while checking <code>SCHEMA-CONTEXT.md</code> and <code>SITE-CONTEXT.md</code> for template <code>ForEach</code> query loops or <code>slug_history</code> 301 redirect dependencies.</li>
      <li><strong>Three-Tier Risk Classification:</strong> Categorizes proposed schema changes into <em>Safe</em> (additive columns/tables), <em>Caution</em> (empty tables or operational adjustments), and <em>High-Risk Data Loss</em> (dropping tables/columns with existing rows or active template dependencies). High-risk proposals require explicit <code>risk_acknowledged: true</code> to proceed.</li>
    </ul>
  </section>

  <section>
    <h2>3. Target Locks, Logical Snapshots &amp; Compliant Apply (<code>/apply</code> &amp; <code>/reconcile</code>)</h2>
    <ul>
      <li><strong>Atomic Single-Winner Coordination:</strong> Durable SQLite locking via <code>db_target_locks</code> and single-use approval claiming via <code>db_consultant_ledger</code> ensure that concurrent worker races produce exactly one <code>201</code> winner and <code>409</code> conflict/replay rejection.</li>
      <li><strong>Pre-Mutation Logical JSON Snapshots:</strong> Queries <code>commerce_inspect</code> and deterministically captures <code>storage/snapshots/snap_db_&lt;id&gt;.json</code> with canonical sorted keys and SHA-256 verification before any mutation receipt is issued. Snapshot restore logic preserves subsequent non-affected orders.</li>
      <li><strong>Strict Separation of HTTP Handlers &amp; DDL:</strong> HTTP handlers never execute DDL. The apply endpoint generates canonical CLI maintenance scripts (<code>storage/approved_migrations/mig_&lt;plan_id&gt;.grab</code>) with a <code>.receipt.json</code> sidecar and status <code>maintenance_ready</code>, or dispatches to a verified loopback executor (<code>127.0.0.1:9490</code>). Post-maintenance reconciliation (<code>POST /api/groxy/db/reconcile</code>) reads back live schema state, verifies table creation, transitions the receipt to <code>applied</code>, and safely releases the target lock.</li>
    </ul>
  </section>

  <section>
    <h2>4. Database Management API Routes</h2>
    <table>
      <thead>
        <tr>
          <th>Endpoint</th>
          <th>Method</th>
          <th>Purpose &amp; Security Controls</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>/api/groxy/db/targets</code></td>
          <td>GET / POST</td>
          <td>List configured database targets or register confined local SQLite / loopback executor endpoints. CSRF protected.</td>
        </tr>
        <tr>
          <td><code>/api/groxy/db/targets/verify</code></td>
          <td>POST</td>
          <td>Probe loopback executor connectivity (<code>GET /api/db/schema</code>) before marking targets as verified.</td>
        </tr>
        <tr>
          <td><code>/api/groxy/db/architect-quiz</code></td>
          <td>POST</td>
          <td>Inspect live schema, generate tailor-made store migration, and mint single-use <code>dtok_</code> token.</td>
        </tr>
        <tr>
          <td><code>/api/groxy/db/consult</code></td>
          <td>POST</td>
          <td>Opt-in schema consultant for plain-English queries, dependency inspection, and risk assessment.</td>
        </tr>
        <tr>
          <td><code>/api/groxy/db/apply</code></td>
          <td>POST</td>
          <td>Atomically acquire target lock, claim approval token, capture pre-mutation snapshot, and stage maintenance script.</td>
        </tr>
        <tr>
          <td><code>/api/groxy/db/reconcile</code></td>
          <td>POST</td>
          <td>Inspect live schema after CLI migration execution, advance receipt to <code>applied</code>, and release target lock.</td>
        </tr>
      </tbody>
    </table>
  </section>

  <section>
    <h2>5. Ecosystem Compatibility Matrix &amp; Verification Gates</h2>
    <table>
      <thead>
        <tr>
          <th>Ecosystem Layer</th>
          <th>Repository</th>
          <th>Required Version Range</th>
          <th>Touched in Release?</th>
          <th>Neighbor Upgrade Required?</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Core Language, Bytecode VM &amp; Grisp Server</strong></td>
          <td><code>urbanspress/grab</code></td>
          <td><code>&gt;= v1.1.0 (&lt; v2.0.0)</code></td>
          <td>No</td>
          <td>No &bull; 100% drop-in compatible</td>
        </tr>
        <tr>
          <td><strong>Reactive Frontend Runtime &amp; 20-Element Library</strong></td>
          <td><code>urbanspress/grex-js</code></td>
          <td><code>&gt;= v1.0.0 (&lt; v2.0.0)</code></td>
          <td>No</td>
          <td>No &bull; 100% drop-in compatible</td>
        </tr>
        <tr>
          <td><strong>Flagship Zero-Plugin CMS</strong></td>
          <td><code>urbanspress/grablab-cms</code></td>
          <td><code>&gt;= v1.0.1 (&lt; v2.0.0)</code></td>
          <td>No</td>
          <td>No &bull; 100% drop-in compatible</td>
        </tr>
        <tr>
          <td><strong>Exclusive <code>mode: "visual"</code> Theme &amp; Studio</strong></td>
          <td><code>urbanspress/grex-builder</code></td>
          <td><code>&gt;= v1.0.0 (&lt; v2.0.0)</code></td>
          <td>No</td>
          <td>No &bull; 100% drop-in compatible</td>
        </tr>
        <tr>
          <td><strong>Autonomous Design, Content &amp; SEO Agent</strong></td>
          <td><code>urbanspress/groxy-ai</code></td>
          <td><code>&gt;= v0.1.0</code></td>
          <td>Yes (<code>v1.5.0</code>)</td>
          <td>No &bull; 100% drop-in compatible</td>
        </tr>
      </tbody>
    </table>
    <ul>
      <li><strong>Verification Gates:</strong> <code>grab check</code> passed; byte-for-byte canonical <code>grab format</code> matched; 80/80 Node unit/DOM tests passed (zero <code>&lt;div&gt;</code> elements, zero <code>innerHTML</code> writes, WCAG AA Light/Dark); full 4-layer integration suite (Gates 1, 2, 3A, 3B on <code>127.0.0.1</code>) passed 100% printing <code>release-ready: True</code>.</li>
      <li><strong>Strict Sibling Boundary Protection:</strong> All 8 sibling repositories in <code>C:\\Development\\*</code> verified clean with zero modifications.</li>
    </ul>
  </section>

  <footer>
    <p>Groxy AI v1.5.0 &bull; Urban's Press / GRAB Ecosystem &bull; SemVer Tier: MINOR (1.x.0) &bull; Approved &amp; Frozen — Complete</p>
  </footer>
</body>
</html>
"""


def render_v160_html() -> str:
    return """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Groxy AI v1.6.0 Walkthrough Guide</title>
  <style>
    @page { size: letter; margin: 0.65in; }
    * { box-sizing: border-box; }
    body {
      font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.48;
      font-size: 9.6pt;
      margin: 0;
    }
    header {
      border-bottom: 3px solid #047857;
      padding-bottom: 0.65rem;
      margin-bottom: 0.9rem;
    }
    h1 { margin: 0 0 0.2rem 0; font-size: 19pt; color: #064e3b; }
    .subtitle { margin: 0; color: #334155; font-size: 10.6pt; font-weight: 600; }
    .meta { margin: 0.3rem 0 0 0; color: #475569; font-size: 9pt; }
    h2 {
      margin: 1rem 0 0.4rem 0;
      font-size: 12.2pt;
      color: #065f46;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 0.16rem;
      page-break-after: avoid;
    }
    p { margin: 0.3rem 0 0.5rem 0; }
    ul { margin: 0.2rem 0 0.6rem 1.2rem; padding: 0; }
    li { margin-bottom: 0.22rem; }
    .callout {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-left: 4px solid #047857;
      border-radius: 6px;
      padding: 0.6rem 0.8rem;
      margin: 0.65rem 0;
      page-break-inside: avoid;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 0.65rem 0 0.9rem 0;
      font-size: 8.8pt;
      page-break-inside: avoid;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 0.36rem 0.48rem;
      text-align: left;
      vertical-align: top;
    }
    th { background: #ecfdf5; color: #0f172a; font-weight: 700; }
    code {
      font-family: Consolas, "Courier New", monospace;
      background: #f1f5f9;
      padding: 0.06rem 0.25rem;
      border-radius: 4px;
      font-size: 8.5pt;
    }
    footer {
      margin-top: 1.15rem;
      padding-top: 0.55rem;
      border-top: 1px solid #e2e8f0;
      color: #475569;
      font-size: 8.8pt;
    }
  </style>
</head>
<body>
  <header>
    <h1>Groxy AI v1.6.0 &mdash; Release Walkthrough Guide</h1>
    <p class="subtitle">Lovable/Base44-Style Iterative Section Co-Pilot &bull; Golden-Ratio Design-Craft Playbook &bull; Atomic One-Slot Builder Patch</p>
    <p class="meta">Post-1.0 Ecosystem Step 4 &bull; Built natively on GRAB v1.1.0 + Grex JS v1.0.0 + GrabLab CMS v1.0.1 + Grex Theme Builder v1.0.0 &bull; Status: Complete</p>
  </header>

  <section class="callout">
    <p><strong>What Groxy AI v1.6.0 Delivers in Plain English:</strong> Operators can now ask Groxy in plain conversation to refine a <em>single section</em> of a Grex Theme Builder page (for example, &ldquo;make this hero calmer, keep one primary button, and tighten spacing&rdquo;) without regenerating the whole page or touching sibling sections. Every proposal is checked against the Golden-Ratio Design-Craft Playbook, Light and Dark WCAG AA contrast, exact <code>ADR-025c</code> numbers, and the 22-rule <code>Grade A/A+</code> gate, then shown as a side-by-side diff before applying via one-click undoable <code>applyAiLayout</code>.</p>
  </section>

  <section>
    <h2>1. Iterative Section Co-Pilot (<code>POST /api/groxy/section-refine</code> &amp; <code>/apply</code>)</h2>
    <ul>
      <li><strong>Targeted Subtree Isolation (<code>C1</code>):</strong> Resolves <code>section_id</code> using Builder semantics (<code>node.id</code> else <code>node.props.id</code>), rejecting missing IDs (<code>404</code>), duplicate IDs (<code>422</code>), and structural nodes (<code>Fragment</code>, <code>TemplatePart</code>, slot root). Every sibling section and ancestor stays byte-for-byte identical.</li>
      <li><strong>Human-in-the-Loop Diff &amp; Single-Use <code>rtok_&lt;hex&gt;</code> Ledger (<code>C2</code>, <code>C8</code>):</strong> Stages a side-by-side text and structural diff with an approval token hashed in SQLite (<code>groxy_section_refine_ledger</code>). If a human edits any sibling section between propose and apply, apply returns <code>409 SECTION_SLOT_DRIFT</code> instead of overwriting their work.</li>
      <li><strong>One-Slot Dispatch &amp; 1-Click Undo (<code>C3</code>):</strong> Concurrent apply races resolve atomically (one <code>201</code> winner, <code>409</code> losers/replays, <code>403</code> mismatches). The winner dispatches strictly via one-slot <code>POST /api/mcp/layout</code> (<code>actor: "groxy-ai"</code>), verifies readback digest parity, and preserves 1-click <code>Ctrl+Z</code> <code>applyAiLayout</code> undo.</li>
      <li><strong>Local-First Modes:</strong> Runs deterministically offline with zero API fees by default, with optional local Ollama (<code>127.0.0.1:11434</code>) offline fallback or <code>GRAB-E402</code> SSRF-allowlisted HTTPS BYOK enrichment.</li>
    </ul>
  </section>

  <section>
    <h2>2. Golden-Ratio Design-Craft Playbook (<code>playbook/design-craft.v1.json</code>)</h2>
    <table>
      <thead>
        <tr>
          <th>Rule ID</th>
          <th>Family</th>
          <th>What It Checks &amp; Repairs</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>GROXY-CRAFT-001</code></td>
          <td>Spacing Rhythm</td>
          <td>Enforces <code>8pt</code> spacing via live <code>--grex-*</code> tokens (<code>4pt</code> allowed only for tight inline pairs) and snaps off-grid values to the nearest live 8pt token.</td>
        </tr>
        <tr>
          <td><code>GROXY-CRAFT-002</code></td>
          <td>Line Measure</td>
          <td>Targets <code>60&ndash;65ch</code> readable body copy via live measure tokens; reports <code>token_unavailable</code> if missing (<code>C4</code>) instead of inventing tokens or hardcoding <code>65ch</code>.</td>
        </tr>
        <tr>
          <td><code>GROXY-CRAFT-003</code></td>
          <td>CTA Hierarchy</td>
          <td>Allows at most one primary CTA per fold and deterministically demotes extra primary CTAs to secondary.</td>
        </tr>
        <tr>
          <td><code>GROXY-CRAFT-004</code></td>
          <td>Surface Elevation &amp; Contrast</td>
          <td>Checks Light/Dark <code>--grex-surface-1</code> / <code>--grex-surface-2</code> (reporting <code>token_unavailable</code> if absent) and repairs Light/Dark contrast to WCAG AA <code>&gt;= 4.5:1</code> (<code>C6</code>).</td>
        </tr>
        <tr>
          <td><code>GROXY-CRAFT-005</code></td>
          <td>Full-Stack CMS Wiring</td>
          <td>Binds <code>ForEach</code> grids and <code>Form</code> inputs strictly to live GrabLab CMS types/fields with exact <code>ADR-025c</code> strings and never fabricates form <code>action</code> URLs (<code>C7</code>).</td>
        </tr>
      </tbody>
    </table>
  </section>

  <section>
    <h2>3. Ecosystem Compatibility Matrix &amp; Verification Gates</h2>
    <table>
      <thead>
        <tr>
          <th>Ecosystem Layer</th>
          <th>Repository</th>
          <th>Required Version Range</th>
          <th>Touched in Release?</th>
          <th>Neighbor Upgrade Required?</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Core Language, Bytecode VM &amp; Grisp Server</strong></td>
          <td><code>urbanspress/grab</code></td>
          <td><code>&gt;= v1.1.0 (&lt; v2.0.0)</code></td>
          <td>No</td>
          <td>No &bull; 100% drop-in compatible</td>
        </tr>
        <tr>
          <td><strong>Reactive Frontend Runtime &amp; 20-Element Library</strong></td>
          <td><code>urbanspress/grex-js</code></td>
          <td><code>&gt;= v1.0.0 (&lt; v2.0.0)</code></td>
          <td>No</td>
          <td>No &bull; 100% drop-in compatible</td>
        </tr>
        <tr>
          <td><strong>Flagship Zero-Plugin CMS</strong></td>
          <td><code>urbanspress/grablab-cms</code></td>
          <td><code>&gt;= v1.0.1 (&lt; v2.0.0)</code></td>
          <td>No</td>
          <td>No &bull; 100% drop-in compatible</td>
        </tr>
        <tr>
          <td><strong>Exclusive <code>mode: "visual"</code> Theme &amp; Studio</strong></td>
          <td><code>urbanspress/grex-builder</code></td>
          <td><code>&gt;= v1.0.0 (&lt; v2.0.0)</code></td>
          <td>No</td>
          <td>No &bull; 100% drop-in compatible</td>
        </tr>
        <tr>
          <td><strong>Autonomous Design, Content &amp; SEO Agent</strong></td>
          <td><code>urbanspress/groxy-ai</code></td>
          <td><code>&gt;= v0.1.0</code></td>
          <td>Yes (<code>v1.6.0</code>)</td>
          <td>No &bull; 100% drop-in compatible</td>
        </tr>
      </tbody>
    </table>
    <ul>
      <li><strong>Verification Gates:</strong> <code>grab check</code> passed; byte-for-byte canonical <code>grab format</code> matched on both <code>.grab</code> files; <code>87/87</code> Node unit/DOM tests passed (zero <code>&lt;div&gt;</code> elements, zero <code>innerHTML</code> writes, Light/Dark WCAG AA); full 4-layer integration suite (Gates 1, 2, 3A, 3B on <code>127.0.0.1</code>) passed 100% printing <code>release-ready: True</code>.</li>
      <li><strong>Strict Sibling Boundary Protection:</strong> All 8 frozen sibling repositories in <code>C:\\Development\\*</code> verified clean with zero modifications; untracked <code>playbook/genres/</code> preserved.</li>
    </ul>
  </section>

  <footer>
    <p>Groxy AI v1.6.0 &bull; Urban's Press / GRAB Ecosystem &bull; SemVer Tier: MINOR (1.x.0) &bull; Approved &amp; Frozen &mdash; Complete</p>
  </footer>
</body>
</html>
"""


def render_v170_html() -> str:
    return """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Groxy AI v1.7.0 Walkthrough Guide</title>
  <style>
    @page { size: letter; margin: 0.65in; }
    * { box-sizing: border-box; }
    body {
      font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.48;
      font-size: 9.6pt;
      margin: 0;
    }
    header {
      border-bottom: 3px solid #047857;
      padding-bottom: 0.65rem;
      margin-bottom: 0.9rem;
    }
    h1 { margin: 0 0 0.2rem 0; font-size: 19pt; color: #064e3b; }
    .subtitle { margin: 0; color: #334155; font-size: 10.6pt; font-weight: 600; }
    .meta { margin: 0.3rem 0 0 0; color: #475569; font-size: 9pt; }
    h2 {
      margin: 1rem 0 0.4rem 0;
      font-size: 12.2pt;
      color: #065f46;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 0.16rem;
      page-break-after: avoid;
    }
    p { margin: 0.3rem 0 0.5rem 0; }
    ul { margin: 0.2rem 0 0.6rem 1.2rem; padding: 0; }
    li { margin-bottom: 0.22rem; }
    .callout {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-left: 4px solid #047857;
      border-radius: 6px;
      padding: 0.6rem 0.8rem;
      margin: 0.65rem 0;
      page-break-inside: avoid;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 0.65rem 0 0.9rem 0;
      font-size: 8.8pt;
      page-break-inside: avoid;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 0.36rem 0.48rem;
      text-align: left;
      vertical-align: top;
    }
    th { background: #ecfdf5; color: #0f172a; font-weight: 700; }
    code {
      font-family: Consolas, "Courier New", monospace;
      background: #f1f5f9;
      padding: 0.06rem 0.25rem;
      border-radius: 4px;
      font-size: 8.5pt;
    }
    footer {
      margin-top: 1.15rem;
      padding-top: 0.55rem;
      border-top: 1px solid #e2e8f0;
      color: #475569;
      font-size: 8.8pt;
    }
  </style>
</head>
<body>
  <header>
    <h1>Groxy AI v1.7.0 &mdash; Release Walkthrough Guide</h1>
    <p class="subtitle">Multi-Genre Storytelling Brain &bull; Hemingway Clarity &amp; Readability Auditor &bull; XSS-Safe <code>schema.org/Book</code> JSON-LD Engine</p>
    <p class="meta">Post-1.0 Ecosystem Step 4 &bull; Built natively on GRAB v1.1.0 + Grex JS v1.0.0 + GrabLab CMS v1.0.1 + Grex Theme Builder v1.0.0 &bull; Status: Complete</p>
  </header>

  <section class="callout">
    <p><strong>What Groxy AI v1.7.0 Delivers in Plain English:</strong> Authors and publishers now have a built-in, zero-fee storytelling studio inside <code>/groxy</code> backed by six validated genre playbooks (<em>Urban Fiction</em>, <em>Thriller / Mystery</em>, <em>Romance</em>, <em>Sci-Fi / Fantasy</em>, <em>Self-Help / Re-Entry</em>, and <em>True Crime</em>). Groxy drafts chapter outlines with cliffhanger hooks, POV-grounded chapter drafts, 4-paragraph back-cover conversion blurbs, and pure-Grex series reading-order grids, audits prose clarity deterministically like Hemingway, emits <code>&lt;/script&gt;</code>-escaped <code>schema.org/Book</code> JSON-LD with exact <code>ADR-025c</code> pricing, and saves everything strictly as human-reviewed GrabLab CMS drafts or 1-click undoable Grex Builder slots.</p>
  </section>

  <section>
    <h2>1. Multi-Genre Playbook Registry &amp; Author Mode Co-Writer</h2>
    <ul>
      <li><strong>Six Fail-Closed Genre Playbooks (<code>playbook/genres/*.v1.json</code>, <code>C1</code>):</strong> Validated at startup and load time against <code>groxy-genre-playbook-v1.0</code>, enforcing exact <code>ADR-025c</code> base-10 pricing tiers (<code>"0.00"</code>, <code>"2.99"</code>, <code>"4.99"</code>, <code>"9.99"</code>, <code>"14.99"</code>), plain <code>https://schema.org/...</code> vocabulary URLs, and zero inline HTML/XSS. Paired with the reusable <code>.agents/skills/genre-research/SKILL.md</code> skill.</li>
      <li><strong>Author Mode Generation (<code>POST /api/groxy/author/generate</code>, <code>C2–C5</code>):</strong> Grounded in <code>storage/BRAND-DNA.md</code>, <code>storage/SITE-CONTEXT.md</code>, and optional <code>GRAB-E401</code>-confined <code>storage/BOOK-BIBLE.md</code>. Runs offline deterministically by default, with optional local Ollama (<code>127.0.0.1:11434</code>) clean fallback or <code>GRAB-E402</code> SSRF-allowlisted BYOK enrichment (prompt-isolated JSON inputs, zero secret leaks).</li>
      <li><strong>Atomic Single-Winner Apply (<code>POST /api/groxy/author/apply</code>, <code>C6–C8</code>):</strong> Stages recursive canonical <code>payload_sha256</code> + single-use <code>atok_&lt;hex&gt;</code> tokens in <code>groxy_author_ledger</code> (<code>scripts/migrate_commerce.grab</code> v4). Enforces CSRF (<code>403</code>), target binding (<code>403</code>), Builder <code>slot_sha256</code> sibling-drift checks (<code>409 AUTHOR_SLOT_DRIFT</code>), and atomic single-winner consumption (<code>201</code> winner, <code>409</code> replay/race). Content dispatches strictly via GrabLab CMS <code>create_entry_draft</code> (<code>status_enforced: "draft"</code>) with live <code>list_content_types</code> custom-field filtering; <code>series_reading_grid</code> dispatches via one-slot <code>POST /api/mcp/layout</code> (<code>actor: "groxy-ai"</code>, <code>Ctrl+Z</code> undo parity).</li>
    </ul>
  </section>

  <section>
    <h2>2. Hemingway Clarity Auditor, <code>schema.org/Book</code> JSON-LD &amp; Pure Grex UI</h2>
    <table>
      <thead>
        <tr>
          <th>Capability</th>
          <th>Endpoint / Module</th>
          <th>Guarantees Enforced</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Hemingway Readability Auditor</strong></td>
          <td><code>POST /api/groxy/author/readability-audit</code></td>
          <td>Deterministic reading grade level, passive voice %, adverb density %, complex/nested clause chains, dialogue-to-narration pacing, and plain-English line-level rewrite suggestions as exact <code>ADR-025c</code> base-10 wire strings.</td>
        </tr>
        <tr>
          <td><strong><code>schema.org/Book</code> &amp; <code>BookSeries</code> JSON-LD</strong></td>
          <td><code>author-studio.js</code> &amp; <code>src/groxy.grab</code></td>
          <td>Validates <code>bookFormat</code>, <code>isbn</code>, <code>numberOfPages</code>, <code>inLanguage</code>, <code>genre</code>, <code>typicalAgeRange</code>, and exact <code>offers.price</code> (<code>422</code> on JS floats); escapes <code>&lt;/script&gt;</code>, <code>&lt;</code>, <code>&gt;</code>, <code>&amp;</code>, <code>U+2028</code>, and <code>U+2029</code>.</td>
        </tr>
        <tr>
          <td><strong>Pure Grex Author Studio Panel</strong></td>
          <td><code>/groxy</code> (<code>author-studio.js</code>)</td>
          <td><code>divCount === 0</code>, <code>innerHTMLWriteCount === 0</code>, zero <code>eval()</code>, full <code>Enter</code>/<code>Space</code>/<code>Escape</code> keyboard accessibility with focus restoration, and Light/Dark WCAG AA <code>&gt;= 4.5:1</code> contrast.</td>
        </tr>
      </tbody>
    </table>
  </section>

  <section>
    <h2>3. Ecosystem Compatibility Matrix &amp; Verification Gates</h2>
    <table>
      <thead>
        <tr>
          <th>Ecosystem Layer</th>
          <th>Repository</th>
          <th>Required Version Range</th>
          <th>Touched in Release?</th>
          <th>Neighbor Upgrade Required?</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Core Language, Bytecode VM &amp; Grisp Server</strong></td>
          <td><code>urbanspress/grab</code></td>
          <td><code>&gt;= v1.1.0 (&lt; v2.0.0)</code></td>
          <td>No</td>
          <td>No &bull; 100% drop-in compatible</td>
        </tr>
        <tr>
          <td><strong>Reactive Frontend Runtime &amp; 20-Element Library</strong></td>
          <td><code>urbanspress/grex-js</code></td>
          <td><code>&gt;= v1.0.0 (&lt; v2.0.0)</code></td>
          <td>No</td>
          <td>No &bull; 100% drop-in compatible</td>
        </tr>
        <tr>
          <td><strong>Flagship Zero-Plugin CMS</strong></td>
          <td><code>urbanspress/grablab-cms</code></td>
          <td><code>&gt;= v1.0.1 (&lt; v2.0.0)</code></td>
          <td>No</td>
          <td>No &bull; 100% drop-in compatible</td>
        </tr>
        <tr>
          <td><strong>Exclusive <code>mode: "visual"</code> Theme &amp; Studio</strong></td>
          <td><code>urbanspress/grex-builder</code></td>
          <td><code>&gt;= v1.0.0 (&lt; v2.0.0)</code></td>
          <td>No</td>
          <td>No &bull; 100% drop-in compatible</td>
        </tr>
        <tr>
          <td><strong>Autonomous Design, Content &amp; SEO Agent</strong></td>
          <td><code>urbanspress/groxy-ai</code></td>
          <td><code>&gt;= v0.1.0</code></td>
          <td>Yes (<code>v1.7.0</code>)</td>
          <td>No &bull; 100% drop-in compatible</td>
        </tr>
      </tbody>
    </table>
    <ul>
      <li><strong>Verification Gates:</strong> <code>grab check</code> passed; byte-for-byte canonical <code>grab format</code> matched on both <code>.grab</code> files; <code>94/94</code> Node unit/DOM tests passed (including <code>tests/unit_author_studio.test.js</code>); full 4-layer integration suite (Gates 1, 2, 3A, 3B on <code>127.0.0.1</code>) passed 100% printing <code>release-ready: True</code>.</li>
      <li><strong>Strict Sibling Boundary Protection:</strong> All 8 frozen sibling repositories in <code>C:\\Development\\*</code> verified clean with zero modifications.</li>
    </ul>
  </section>

  <footer>
    <p>Groxy AI v1.7.0 &bull; Urban's Press / GRAB Ecosystem &bull; SemVer Tier: MINOR (1.x.0) &bull; Approved &amp; Frozen &mdash; Complete</p>
  </footer>
</body>
</html>
"""


def main():
    version = sys.argv[1].lstrip("v") if len(sys.argv) > 1 else "1.0.0"
    renderers = {
        "0.1.0": render_v010_html,
        "0.2.0": render_v020_html,
        "0.3.0": render_v030_html,
        "0.4.0": render_v040_html,
        "1.0.0": render_v100_html,
        "1.1.0": render_v110_html,
        "1.2.0": render_v120_html,
        "1.3.0": render_v130_html,
        "1.5.0": render_v150_html,
        "1.6.0": render_v160_html,
        "1.7.0": render_v170_html,
    }
    if version not in renderers:
        raise ValueError(f"Unsupported guide version '{version}'. Available: {', '.join(sorted(renderers))}")

    HTML_DIR.mkdir(parents=True, exist_ok=True)
    PDF_DIR.mkdir(parents=True, exist_ok=True)

    html_path = HTML_DIR / f"Groxy-AI-v{version}-Guide.html"
    pdf_path = PDF_DIR / f"Groxy-AI-v{version}-Guide.pdf"
    html_path.write_text(renderers[version](), encoding="utf-8")

    if version == "1.1.0":
        from generate_v110_pdf import build_pdf

        build_pdf()
        return
    if version == "1.2.0":
        from generate_v120_pdf import build_pdf

        build_pdf()
        return
    if version == "1.3.0":
        from generate_v130_pdf import build_pdf

        build_pdf()
        return

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
