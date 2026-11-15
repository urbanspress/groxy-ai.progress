import test from "node:test";
import assert from "node:assert/strict";

import { boostEntryAndLayout, buildPrePublishReview } from "../public/groxy/booster.js";

const SAMPLE_DESIGN_SYSTEM_MD = `
# GRAB-DESIGN-SYSTEM.md

## 1. Design Tokens
### Light Mode
| Token | Value |
|---|---|
| \`--grex-color-bg\` | \`#ffffff\` |
| \`--grex-color-text\` | \`#0f172a\` |
| \`--grex-color-primary\` | \`#047857\` |

## 2. Reusable Classes
- \`.grex-c-hero-card\`
- \`.grex-c-feature-grid\`
`;

function makeFlawedInput() {
  return {
    groxy_assist_enabled: true,
    focus_keyword: "semantic cms",
    design_system_md: SAMPLE_DESIGN_SYSTEM_MD,
    entry: {
      id: "42",
      content_type: "product",
      title: "Post",
      slug: "admin-bad_slug",
      excerpt: "Too short.",
      body: "Short copy.",
      custom_fields: {
        price: "49.99",
        sku: "10042",
        inventory_count: "120",
      },
    },
    grex_layout: {
      element: "div",
      tag: "div",
      props: { id: "bad-root", class: "grex-c-nonexistent" },
      styles: { base: { color: "#9ca3af", "background-color": "#ffffff" } },
      children: [
        { element: "Heading", props: { id: "h1-a", level: 1, text: "Draft" } },
        { element: "Heading", props: { id: "h3-skip", level: 3, text: "Skipped H2 Section" } },
        { element: "Image", props: { id: "hero-img", src: "/static/theme/product-hero.png" } },
        { element: "Link", props: { id: "old-lnk", href: "/old-guide", text: "click here" } },
        { element: "Input", props: { id: "email-inp", type: "email", name: "contact_email" } },
      ],
    },
    site_context: {
      entries: [
        {
          id: "10",
          title: "Semantic CMS Architecture Guide",
          slug: "semantic-cms-architecture",
          slug_history: ["old-guide"],
        },
      ],
      redirects: [{ old_slug: "legacy-home", new_slug: "semantic-cms-architecture" }],
      menus: [{ label: "Guides", href: "/semantic-cms-architecture" }],
      media: [{ url: "/static/theme/product-hero.png", alt: "Semantic CMS product dashboard preview" }],
    },
  };
}

test("buildPrePublishReview bypasses cleanly when groxy_assist_enabled is false", () => {
  const res = buildPrePublishReview({
    groxy_assist_enabled: false,
    entry: { id: "1", title: "X" },
  });
  assert.equal(res.schema_version, "0.2.0");
  assert.equal(res.groxy_assist_enabled, false);
  assert.equal(res.gate_status, "bypassed");
  assert.equal(res.audit_report, null);
  assert.equal(res.actions[0].id, "make_live");
});

test("buildPrePublishReview runs 22-rule audit and exposes Make This Live + Let Groxy Boost This", () => {
  const res = buildPrePublishReview(makeFlawedInput());
  assert.equal(res.groxy_assist_enabled, true);
  assert.equal(res.gate_status, "review_required");
  assert.equal(res.audit_report.overall_grade, "F");
  assert.equal(res.audit_report.publish_safe, false);
  assert.equal(res.audit_report.findings.length, 22);
  assert.deepEqual(
    res.actions.map((a) => a.id),
    ["make_live", "boost"]
  );
  assert.equal(res.actions[1].icon, "rocket");
});

test("boostEntryAndLayout lifts F -> A/A+, removes <div>, repairs headings/alt/301 links, and locks GrabDecimal", () => {
  const input = makeFlawedInput();
  const originalSnapshot = JSON.stringify(input);

  const boosted = boostEntryAndLayout(input);

  // Original input never mutated in place
  assert.equal(JSON.stringify(input), originalSnapshot);

  // Before -> After score lift
  assert.equal(boosted.before_report.overall_grade, "F");
  assert.equal(boosted.before_report.publish_safe, false);
  assert.ok(boosted.after_report.overall_score >= 90, `Expected >= 90, got ${boosted.after_report.overall_score}`);
  assert.ok(["A", "A+"].includes(boosted.after_report.overall_grade));
  assert.equal(boosted.after_report.publish_safe, true);

  // Explicit human approval gate (GROXY-SAFE-001)
  assert.equal(boosted.approval_required, true);
  assert.ok(typeof boosted.approval_token === "string" && boosted.approval_token.startsWith("tok_"));

  // Exact ADR-025c base-10 wire strings preserved byte-for-byte
  assert.equal(boosted.candidate_entry.custom_fields.price, "49.99");
  assert.equal(boosted.candidate_entry.custom_fields.sku, "10042");
  assert.equal(boosted.candidate_entry.custom_fields.inventory_count, "120");

  // Zero wrapper <div> in candidate_layout
  const serializedLayout = JSON.stringify(boosted.candidate_layout);
  assert.equal(/"element"\s*:\s*"div"/i.test(serializedLayout), false);
  assert.equal(/"tag"\s*:\s*"div"/i.test(serializedLayout), false);

  // 301 redirect target /old-guide resolved to canonical /semantic-cms-architecture & vague anchor upgraded
  assert.equal(serializedLayout.includes("/old-guide"), false);
  assert.equal(serializedLayout.includes("/semantic-cms-architecture"), true);
  assert.equal(serializedLayout.toLowerCase().includes('"click here"'), false);

  // Image alt enriched from media library
  assert.equal(serializedLayout.includes("Semantic CMS product dashboard preview"), true);

  // Structured diffs populated
  assert.equal(Array.isArray(boosted.diffs), true);
  assert.ok(boosted.diffs.some((d) => d.field === "title" && d.changed));
  assert.ok(boosted.diffs.some((d) => d.field === "excerpt" && d.changed));
  assert.ok(boosted.diffs.some((d) => d.field === "slug" && d.changed && !d.after.startsWith("admin")));
  assert.ok(boosted.diffs.some((d) => d.field === "grex_layout" && d.rule_ids_fixed.includes("GROXY-DOM-001")));
});

test("boostEntryAndLayout strips XSS script/javascript URLs and prevents self-link loops", () => {
  const xssInput = {
    focus_keyword: "secure themes",
    entry: {
      id: "88",
      content_type: "page",
      title: "Secure Themes Guide",
      slug: "secure-themes-guide",
      excerpt: "",
    },
    grex_layout: {
      element: "Section",
      tag: "main",
      props: { id: "sec-main", onclick: "alert(1)" },
      children: [
        { element: "Heading", props: { level: 1, text: "Secure Themes Guide" } },
        { element: "Link", props: { href: "javascript:alert(1)", text: "read more" } },
        { element: "Link", props: { href: "/secure-themes-guide", text: "Self Loop" } },
      ],
    },
  };

  const boosted = boostEntryAndLayout(xssInput);
  assert.equal(boosted.before_report.overall_grade, "F");
  assert.equal(boosted.before_report.publish_safe, false);
  assert.equal(boosted.after_report.publish_safe, true);
  assert.ok(boosted.after_report.overall_score >= 90);
  const jsonOut = JSON.stringify(boosted.candidate_layout);
  assert.equal(jsonOut.includes("javascript:"), false);
  assert.equal(jsonOut.includes("onclick"), false);
});
