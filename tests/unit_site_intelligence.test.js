import test from "node:test";
import assert from "node:assert/strict";

import { GrexSecurityError } from "../public/groxy/grex.js";
import {
  analyzeInternalLinkingGraph,
  buildNightlyWatchDigest,
  buildPortableSiteDna,
  buildSiteContextSnapshot,
  GENERIC_ANCHOR_TEXTS,
  parseSiteContextMarkdown,
  renderPortableSiteDnaMarkdown,
  renderSiteContextMarkdown,
} from "../public/groxy/site-context.js";

const FIXTURE_SITE_CONTEXT = {
  site_name: "Urban Press Commerce & Guides",
  site_url: "https://shop.urbanpress.example",
  active_theme: "grex-builder",
  categories: ["Commerce", "Guides"],
  tags: ["grab-decimal", "seo", "wcag-aa"],
  menus: [
    {
      slug: "primary",
      location: "primary",
      items: [
        { label: "Home", url: "/" },
        { label: "Semantic Themes Guide", url: "/guides/semantic-themes" },
      ],
    },
    {
      slug: "footer",
      location: "footer",
      items: [{ label: "Espresso Kettle", url: "/products/espresso-kettle" }],
    },
    {
      slug: "mobile",
      location: "mobile",
      items: [{ label: "Home", url: "/" }],
    },
  ],
  redirects: [
    { old_path: "/old-guide", target_path: "/v2-guide", status_code: 301 },
    { old_path: "/v2-guide", target_path: "/guides/semantic-themes", status_code: 301 },
    { old_path: "/loop-a", target_path: "/loop-b", status_code: 301 },
    { old_path: "/loop-b", target_path: "/loop-a", status_code: 301 },
    { old_path: "/self-loop", target_path: "/self-loop", status_code: 301 },
  ],
  entries: [
    {
      id: 1,
      title: "Urban Press Studio Home",
      slug: "home",
      full_path: "/",
      content_type: "page",
      status: "published",
      body_html:
        '<p>Explore <a href="/guides/semantic-themes">Semantic Themes Architecture</a> and <a href="/old-guide">click here</a>.</p>',
    },
    {
      id: 2,
      title: "Semantic Themes Architecture",
      slug: "semantic-themes",
      full_path: "/guides/semantic-themes",
      content_type: "post",
      status: "published",
      categories: ["Guides"],
      tags: ["seo", "wcag-aa"],
      slug_history: ["/guides/legacy-semantic"],
      body_html:
        '<p>Read our <a href="/products/espresso-kettle">Precision Espresso Kettle</a> or visit <a href="/404-missing">removed page</a>.</p>',
    },
    {
      id: 3,
      title: "Precision Espresso Kettle",
      slug: "espresso-kettle",
      full_path: "/products/espresso-kettle",
      content_type: "product",
      status: "published",
      categories: ["Commerce"],
      tags: ["grab-decimal", "seo"],
      custom_fields: { price: "149.95", currency: "USD", sku: "KTL-14995" },
      body_html: '<p>Built for baristas following <a href="/">home studio guides</a>.</p>',
    },
    {
      id: 4,
      title: "Semantic SEO Orphan Blueprint",
      slug: "semantic-seo-orphan",
      full_path: "/guides/semantic-seo-orphan",
      content_type: "post",
      status: "published",
      categories: ["Guides"],
      tags: ["seo", "wcag-aa"],
      recommended_anchor: "Semantic SEO Blueprint",
      body_html: "<p>Orphan article covering semantic themes and SEO architecture.</p>",
    },
    {
      id: 5,
      title: "Redirect Loop Target Entry",
      slug: "loop-a",
      full_path: "/loop-a",
      content_type: "page",
      status: "published",
      tags: ["seo"],
      body_html: "<p>Entry trapped in a 301 loop.</p>",
    },
  ],
  products: [
    {
      title: "Collector Grinder",
      path: "/products/collector-grinder",
      sku: "GRD-10020",
      price: "10020",
      currency: "USD",
    },
  ],
  media: [
    { id: 1, filename: "IMG_9981.jpg", alt_text: "IMG_9981.jpg", decorative: false },
    { id: 2, filename: "divider.svg", alt_text: "", is_decorative: true },
  ],
};

test("buildSiteContextSnapshot & renderSiteContextMarkdown preserve exact ADR-025c prices, menus, and 301 redirects", () => {
  const snap = buildSiteContextSnapshot(FIXTURE_SITE_CONTEXT);
  assert.equal(snap.schema_version, "0.4.0");
  assert.equal(snap.read_only, true);
  assert.equal(snap.decimal_integrity_verified, true);
  assert.equal(snap.counts.entries, 5);
  assert.equal(snap.counts.products, 2);
  assert.deepEqual(snap.menus.locations.sort(), ["footer", "mobile", "primary"]);
  assert.ok(snap.redirects.some((r) => r.old_path === "/guides/legacy-semantic" && r.target_path === "/guides/semantic-themes"));

  const kettle = snap.products.find((p) => p.sku === "KTL-14995");
  const grinder = snap.products.find((p) => p.sku === "GRD-10020");
  assert.equal(typeof kettle.price, "string");
  assert.equal(kettle.price, "149.95");
  assert.equal(grinder.price, "10020");

  const md = renderSiteContextMarkdown(snap);
  assert.ok(md.includes("# SITE-CONTEXT.md — Urban Press Commerce & Guides"));
  assert.ok(md.includes('`"149.95"` USD'));
  assert.ok(md.includes('`"10020"` USD'));
  assert.ok(md.includes("`/old-guide` -> `/v2-guide` (301)"));
  const parsed = parseSiteContextMarkdown(md);
  assert.ok(parsed.sections.includes("Navigation Menus (Primary, Footer, Mobile)"));

  assert.throws(
    () =>
      buildSiteContextSnapshot({
        entries: [{ slug: "bad", title: "Bad", custom_fields: { price: 49.99 } }],
      }),
    GrexSecurityError
  );
});

test("analyzeInternalLinkingGraph detects orphans, broken links, generic anchors, chains, and excludes 301 loops strictly", () => {
  const originalBodySnapshot = FIXTURE_SITE_CONTEXT.entries.map((e) => e.body_html);
  const report = analyzeInternalLinkingGraph({ site_context: FIXTURE_SITE_CONTEXT });

  assert.equal(report.schema_version, "0.4.0");
  assert.equal(report.read_only, true);
  assert.equal(report.mutates_live_cms, false);
  // Confirm zero mutation of live input HTML
  assert.deepEqual(
    FIXTURE_SITE_CONTEXT.entries.map((e) => e.body_html),
    originalBodySnapshot
  );

  // Orphan detected
  assert.ok(report.orphan_pages.some((o) => o.path === "/guides/semantic-seo-orphan"));
  // Broken internal link detected
  assert.ok(report.broken_links.some((b) => b.target_path === "/404-missing"));
  // Generic "click here" anchor flagged
  assert.ok(report.generic_anchors.some((g) => g.anchor_text.toLowerCase() === "click here"));
  // Redirect chain & loops detected
  assert.ok(report.redirect_chains.length >= 1);
  assert.ok(report.redirect_loops.length >= 2);
  assert.ok(report.excluded_loop_targets.includes("/loop-a"));
  assert.ok(report.excluded_loop_targets.includes("/loop-b"));
  assert.ok(report.excluded_loop_targets.includes("/self-loop"));

  // Suggestions MUST NOT point to any loop path and MUST NOT use generic anchors
  assert.ok(report.suggestions.length >= 1);
  for (const s of report.suggestions) {
    assert.ok(!report.excluded_loop_targets.includes(s.target_path), `Loop path leaked into suggestions: ${s.target_path}`);
    assert.ok(!report.excluded_loop_targets.includes(s.source_path), `Loop source leaked: ${s.source_path}`);
    assert.ok(!GENERIC_ANCHOR_TEXTS.includes(s.anchor_text.toLowerCase()), `Generic anchor suggested: ${s.anchor_text}`);
    assert.equal(s.read_only_preview, true);
  }
  assert.ok(report.suggestions.some((s) => s.target_path === "/guides/semantic-seo-orphan"));

  // Deterministic authority range 0..100
  for (const node of report.nodes) {
    assert.ok(node.authority_score >= 0 && node.authority_score <= 100);
  }
});

test("buildNightlyWatchDigest & buildPortableSiteDna produce non-intrusive digest and Gashboard/grabman Site DNA bundle", () => {
  const digest = buildNightlyWatchDigest({ site_context: FIXTURE_SITE_CONTEXT });
  assert.equal(digest.schema_version, "0.4.0");
  assert.equal(digest.digest_name, "Morning Boost Report");
  assert.equal(digest.notification_mode, "quiet_digest");
  assert.equal(digest.popups, false);
  assert.equal(digest.silent_edits, false);
  assert.equal(digest.mutates_live_cms, false);
  assert.ok(digest.site_health_score >= 0 && digest.site_health_score <= 100);
  assert.ok(digest.boost_opportunities.every((o) => o.cta_label === "🚀 Let Groxy Boost This"));

  const dna = buildPortableSiteDna({
    site_context: FIXTURE_SITE_CONTEXT,
    style_pack: "creator-academy",
    design_system_md:
      "# GRAB-DESIGN-SYSTEM.md\n\n## 1. Design Tokens\n### Light Mode\n| Token | Value |\n|---|---|\n| `--grex-primary` | `#0f766e` |\n\n## 2. Reusable Classes\n- `.grex-c-hero`\n",
  });
  assert.equal(dna.schema_version, "0.4.0");
  assert.equal(dna.bundle_name, "groxy-site-dna-v0.4.0");
  assert.ok(dna.compatible_consumers.includes("gashboard"));
  assert.ok(dna.compatible_consumers.includes("grabman"));
  assert.equal(dna.active_style_pack.id, "creator-academy");
  assert.equal(dna.decimal_integrity_verified, true);
  assert.ok(dna.design_system.reusable_classes.includes("hero"));

  const dnaMd = renderPortableSiteDnaMarkdown(dna);
  assert.ok(dnaMd.includes("# Groxy Site DNA Export (0.4.0)"));
  assert.ok(dnaMd.includes("# SITE-CONTEXT.md"));
});
