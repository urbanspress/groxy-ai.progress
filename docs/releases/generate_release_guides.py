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


def main():
    HTML_DIR.mkdir(parents=True, exist_ok=True)
    PDF_DIR.mkdir(parents=True, exist_ok=True)

    html_path = HTML_DIR / "Groxy-AI-v0.1.0-Guide.html"
    pdf_path = PDF_DIR / "Groxy-AI-v0.1.0-Guide.pdf"
    html_path.write_text(render_v010_html(), encoding="utf-8")

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
