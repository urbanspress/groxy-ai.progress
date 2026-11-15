import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_PRICING_TIERS,
  generatePageOrSection,
  LAYOUT_BLUEPRINTS,
  listStylePacks,
  normalizePricingTiers,
  STYLE_PACKS,
  toGrexValidationNode,
} from "../public/groxy/generator.js";
import {
  auditAccessibility,
  GrexSecurityError,
  validateElementNode,
} from "../public/groxy/grex.js";
import { mapGroxySlotToBuilderSlot } from "../public/groxy/mcp-client.js";

const LIVE_DESIGN_SYSTEM_MD = `
# GRAB-DESIGN-SYSTEM.md

## 1. Design Tokens
### Light Mode
| Token | Value |
|---|---|
| \`--grex-color-bg\` | \`#ffffff\` |
| \`--grex-color-surface\` | \`#f8fafc\` |
| \`--grex-color-text\` | \`#0f172a\` |
| \`--grex-color-primary\` | \`#047857\` |
| \`--grex-space-lg\` | \`2rem\` |
| \`--grex-radius-md\` | \`0.75rem\` |

### Dark Mode
| Token | Value |
|---|---|
| \`--grex-color-bg\` | \`#0f172a\` |
| \`--grex-color-text\` | \`#f8fafc\` |
| \`--grex-color-primary\` | \`#34d399\` |

## 2. Reusable Classes
- \`.grex-c-hero\`
- \`.grex-c-hero-card\`
- \`.grex-c-card\`
- \`.grex-c-btn-primary\`
- \`.grex-c-badge-pill\`
- \`.grex-c-grid-3\`
- \`.grex-c-cta-button\`
`;

const SAMPLE_SITE_CONTEXT = {
  entries: [
    {
      id: "10",
      content_type: "page",
      title: "Semantic Architecture Guide",
      slug: "semantic-architecture",
      excerpt: "Zero wrapper divs on GRAB and Grex JS.",
      featured_image_url: "/static/theme/hero-overview.png",
      featured_image_alt: "Semantic architecture overview diagram",
    },
    {
      id: "11",
      content_type: "page",
      title: "Live Pricing Guide",
      slug: "pricing",
      excerpt: "Transparent base-10 pricing tiers.",
    },
    {
      id: "12",
      content_type: "page",
      title: "About Groxy Studio",
      slug: "about",
      excerpt: "Autonomous design and SEO composition.",
    },
    {
      id: "13",
      content_type: "post",
      title: "Blog & Engineering Updates",
      slug: "blog",
      excerpt: "Release notes and benchmark writeups.",
    },
  ],
  redirects: [{ old_slug: "legacy-pricing", new_slug: "pricing" }],
  menus: [
    { label: "Pricing", href: "/pricing" },
    { label: "About", href: "/about" },
  ],
  media: [
    {
      url: "/static/theme/hero-overview.png",
      alt: "Semantic architecture overview diagram",
    },
  ],
};

function walkLayoutNodes(node, visitor) {
  if (!node || typeof node !== "object") return;
  visitor(node);
  for (const child of node.children || []) {
    walkLayoutNodes(child, visitor);
  }
  if (Array.isArray(node.props?.items)) {
    for (const item of node.props.items) {
      for (const contentChild of item?.content || []) {
        walkLayoutNodes(contentChild, visitor);
      }
    }
  }
}

test("listStylePacks exposes all 8 Industry & Goal-Aware Style Packs, 5 Blueprints, contrast >= 4.5:1, and supports goal/industry filtering", () => {
  const catalog = listStylePacks();
  assert.equal(catalog.schema_version, "0.4.0");
  assert.equal(catalog.total_style_packs, 8);
  assert.deepEqual(
    catalog.style_packs.map((p) => p.id),
    [
      "emerald-editorial",
      "obsidian-tech",
      "warm-commerce",
      "swiss-minimal",
      "local-service-trust",
      "creative-studio-bold",
      "creator-academy",
      "wellness-organic",
    ]
  );
  assert.deepEqual(
    catalog.blueprints.map((b) => b.id),
    ["full_landing_page", "hero_section", "pricing_grid", "faq_accordion", "foreach_showcase"]
  );
  for (const pack of catalog.style_packs) {
    assert.ok(Array.isArray(pack.industries) && pack.industries.length > 0);
    assert.ok(Array.isArray(pack.conversion_goals) && pack.conversion_goals.length > 0);
    assert.ok(pack.tokens && pack.tokens.light && pack.tokens.dark);
    assert.equal(pack.contrast_report.wcag_aa, true, `WCAG AA failed on pack ${pack.id}`);
    assert.ok(
      pack.contrast_report.min_ratio >= 4.5,
      `Contrast ratio < 4.5 on ${pack.id}: ${pack.contrast_report.min_ratio}`
    );
  }

  const saasPacks = listStylePacks({ goal: "saas" });
  assert.deepEqual(
    saasPacks.style_packs.map((p) => p.id),
    ["obsidian-tech"]
  );
  const servicePacks = listStylePacks({ industry: "home_services" });
  assert.deepEqual(
    servicePacks.style_packs.map((p) => p.id),
    ["local-service-trust"]
  );
});

test("generatePageOrSection produces valid, WCAG AA, Grade A/A+ zero-div trees across all 40 blueprint x style-pack combinations", () => {
  let combos = 0;
  for (const blueprint of LAYOUT_BLUEPRINTS) {
    for (const stylePackId of Object.keys(STYLE_PACKS)) {
      combos += 1;
      const res = generatePageOrSection({
        blueprint: blueprint.id,
        style_pack: stylePackId,
        focus_keyword: "semantic theme builder",
        topic_title: "Semantic Theme Builder Showcase",
        target_audience: "publishers and web designers",
        foreach_collection: "posts",
        design_system_md: LIVE_DESIGN_SYSTEM_MD,
        site_context: SAMPLE_SITE_CONTEXT,
      });

      assert.equal(res.schema_version, "0.3.0");
      assert.equal(res.blueprint, blueprint.id);
      assert.equal(res.style_pack, stylePackId);
      assert.equal(res.approval_required, true);
      assert.ok(res.approval_token.startsWith("tok_"));

      assert.equal(res.validation.grex_schema_valid, true);
      assert.equal(res.validation.div_count, 0);
      assert.equal(res.validation.wcag_aa_passed, true);
      assert.equal(res.validation.decimal_integrity_verified, true);

      assert.ok(
        res.audit_report.overall_score >= 90,
        `Expected >= 90 for ${blueprint.id}/${stylePackId}, got ${res.audit_report.overall_score}`
      );
      assert.ok(res.audit_report.overall_grade === "A" || res.audit_report.overall_grade === "A+");
      assert.equal(res.audit_report.publish_safe, true);

      // Independent strict Grex v1.0.0 schema + accessibility check
      const grexNode = toGrexValidationNode(res.candidate_layout);
      validateElementNode(grexNode, { strictProps: true });
      const a11y = auditAccessibility(grexNode, { defaultBg: "#ffffff" });
      assert.equal(a11y.ok, true, `${blueprint.id}/${stylePackId} failed independent auditAccessibility`);

      // Verify zero wrapper <div>, zero <script>, zero <iframe>, zero inline on* handlers
      walkLayoutNodes(res.candidate_layout, (n) => {
        const typeLower = String(n.type || n.element || "").toLowerCase();
        const tagLower = String(n.tag || "").toLowerCase();
        assert.notEqual(typeLower, "div");
        assert.notEqual(tagLower, "div");
        assert.notEqual(typeLower, "script");
        assert.notEqual(tagLower, "script");
        assert.notEqual(typeLower, "iframe");
        assert.notEqual(tagLower, "iframe");
        for (const k of Object.keys(n.props || {})) {
          assert.ok(!/^on[a-z]+$/i.test(k), `Forbidden inline handler prop ${k}`);
        }
      });
    }
  }
  assert.equal(combos, 40);
});

test("generator consumes live GRAB-DESIGN-SYSTEM.md tokens & .grex-c-* classes with zero unknown classes", () => {
  const res = generatePageOrSection({
    blueprint: "hero_section",
    style_pack: "emerald-editorial",
    focus_keyword: "accessible design system",
    design_system_md: LIVE_DESIGN_SYSTEM_MD,
    site_context: SAMPLE_SITE_CONTEXT,
  });

  assert.ok(res.design_system_summary.tokens_applied.includes("--grex-color-bg"));
  assert.ok(res.design_system_summary.tokens_applied.includes("--grex-color-primary"));
  assert.ok(res.design_system_summary.reusable_classes_applied.includes("grex-c-hero"));
  assert.deepEqual(res.design_system_summary.unknown_classes_used, []);
});

test("generator automatically repairs inaccessible light-on-light token overrides to pass WCAG AA", () => {
  const brokenTokensMd = `
# GRAB-DESIGN-SYSTEM.md
## 1. Design Tokens
### Light Mode
| Token | Value |
|---|---|
| \`--grex-color-bg\` | \`#ffffff\` |
| \`--grex-color-surface\` | \`#ffffff\` |
| \`--grex-color-text\` | \`#d1d5db\` |
| \`--grex-color-primary\` | \`#e5e7eb\` |
`;
  const res = generatePageOrSection({
    blueprint: "pricing_grid",
    style_pack: "swiss-minimal",
    focus_keyword: "contrast safe studio",
    design_system_md: brokenTokensMd,
  });

  assert.equal(res.validation.wcag_aa_passed, true);
  assert.equal(res.audit_report.publish_safe, true);
  assert.ok(res.audit_report.overall_score >= 90);
});

test("foreach_showcase binds queryLoop collection dynamically with semantic Card items", () => {
  const res = generatePageOrSection({
    blueprint: "foreach_showcase",
    style_pack: "obsidian-tech",
    focus_keyword: "dynamic grab collection",
    foreach_collection: "guides",
    site_context: SAMPLE_SITE_CONTEXT,
  });

  let foundForEach = null;
  walkLayoutNodes(res.candidate_layout, (n) => {
    if (n.type === "ForEach" || n.element === "ForEach") {
      foundForEach = n;
    }
  });
  assert.ok(foundForEach, "Expected a ForEach element in foreach_showcase");
  assert.equal(foundForEach.queryLoop.content_type, "guides");
});

test("ADR-025c: exact base-10 GrabDecimal & GrabInteger wire strings are preserved byte-for-byte and JS floats are rejected", () => {
  const customTiers = [
    {
      name: "Community",
      price: "0.00",
      sku: "10010",
      cta_label: "Start Community",
      cta_href: "/pricing",
      features: ["Zero wrapper div output"],
    },
    {
      name: "Growth",
      price: "29.00",
      compare_at_price: "39.00",
      sku: "10020",
      cta_label: "Choose Growth",
      cta_href: "/about",
      features: ["Exact base-10 price strings"],
    },
    {
      name: "Scale",
      price: "149.95",
      sku: "10030",
      cta_label: "Explore Scale",
      cta_href: "/blog",
      features: ["1-click Grex Builder undo"],
    },
  ];

  const normalized = normalizePricingTiers(customTiers);
  assert.equal(normalized[0].price, "0.00");
  assert.equal(normalized[1].price, "29.00");
  assert.equal(normalized[1].compare_at_price, "39.00");
  assert.equal(normalized[1].sku, "10020");
  assert.equal(normalized[2].price, "149.95");

  const res = generatePageOrSection({
    blueprint: "pricing_grid",
    style_pack: "warm-commerce",
    focus_keyword: "precision pricing grid",
    pricing_tiers: customTiers,
    site_context: SAMPLE_SITE_CONTEXT,
  });

  assert.equal(res.candidate_entry.custom_fields.featured_price, "29.00");
  assert.equal(res.candidate_entry.custom_fields.featured_sku, "10020");

  const serializedTexts = [];
  walkLayoutNodes(res.candidate_layout, (n) => {
    if (typeof n.props?.text === "string") {
      serializedTexts.push(n.props.text);
    }
  });
  const combinedText = serializedTexts.join(" | ");
  assert.ok(combinedText.includes("0.00"));
  assert.ok(combinedText.includes("29.00"));
  assert.ok(combinedText.includes("149.95"));

  assert.throws(
    () => normalizePricingTiers([{ name: "BadFloat", price: 29.99, sku: "10020" }]),
    GrexSecurityError
  );
  assert.throws(
    () => normalizePricingTiers([{ name: "BadCurrency", price: "$29.00", sku: "10020" }]),
    GrexSecurityError
  );
  assert.throws(
    () =>
      normalizePricingTiers([
        { name: "UnsafeUrl", price: DEFAULT_PRICING_TIERS[0].price, cta_href: "javascript:alert(1)" },
      ]),
    GrexSecurityError
  );
});

test("generator avoids slug collisions, redirect URLs, and rejects unknown blueprint or style pack", () => {
  const res = generatePageOrSection({
    blueprint: "faq_accordion",
    style_pack: "emerald-editorial",
    slug: "pricing",
    focus_keyword: "semantic workflow",
    site_context: SAMPLE_SITE_CONTEXT,
  });
  assert.equal(res.candidate_entry.slug, "pricing-v2");

  walkLayoutNodes(res.candidate_layout, (n) => {
    if (typeof n.props?.href === "string") {
      assert.notEqual(n.props.href, "/legacy-pricing");
      assert.notEqual(n.props.href, `/${res.candidate_entry.slug}`);
    }
  });

  assert.throws(
    () => generatePageOrSection({ blueprint: "nonexistent_blueprint" }),
    GrexSecurityError
  );
  assert.throws(
    () => generatePageOrSection({ style_pack: "nonexistent-pack" }),
    GrexSecurityError
  );
});

test("mapGroxySlotToBuilderSlot maps Groxy slots cleanly to valid Grex Builder template keys", () => {
  assert.equal(mapGroxySlotToBuilderSlot("main"), "home");
  assert.equal(mapGroxySlotToBuilderSlot("hero"), "home");
  assert.equal(mapGroxySlotToBuilderSlot("landing"), "home");
  assert.equal(mapGroxySlotToBuilderSlot("footer"), "part:footer");
  assert.equal(mapGroxySlotToBuilderSlot("header"), "part:header");
  assert.equal(mapGroxySlotToBuilderSlot("sidebar"), "part:sidebar");
  assert.equal(mapGroxySlotToBuilderSlot("single"), "single");
  assert.equal(mapGroxySlotToBuilderSlot("part:hero-banner"), "part:hero-banner");
});
