import test from "node:test";
import assert from "node:assert/strict";

import { GrexSecurityError } from "../public/groxy/grex.js";
import {
  analyzeMediaAltText,
  approveMediaAltEnrichment,
  escapeJsonLdForScript,
  generateSchemaOrgJsonLd,
} from "../public/groxy/site-context.js";

test("generateSchemaOrgJsonLd produces deterministic Article, BlogPosting, Product (ADR-025c), FAQPage, BreadcrumbList & WebSite schemas", () => {
  const productRes = generateSchemaOrgJsonLd({
    schema_type: "Product",
    site_name: "Urban Press Store",
    site_url: "https://store.urbanpress.example",
    entry: {
      title: "Studio Kettle",
      slug: "studio-kettle",
      full_path: "/products/studio-kettle",
      custom_fields: { price: "49.99", currency: "USD", sku: "KTL-049" },
    },
    include_breadcrumbs: true,
    include_website: true,
  });

  assert.equal(productRes.schema_version, "0.4.0");
  assert.equal(productRes.decimal_integrity_verified, true);
  assert.equal(productRes.xss_safe, true);
  assert.deepEqual(productRes.types_generated, ["Product", "BreadcrumbList", "WebSite"]);

  const productNode = productRes.json_ld["@graph"].find((n) => n["@type"] === "Product");
  assert.equal(typeof productNode.offers.price, "string");
  assert.equal(productNode.offers.price, "49.99");
  assert.equal(productNode.offers.priceCurrency, "USD");

  const faqBlogRes = generateSchemaOrgJsonLd({
    site_url: "https://store.urbanpress.example",
    entry: {
      content_type: "post",
      title: "Semantic HTML FAQ & Architecture",
      full_path: "/blog/semantic-html-faq",
      grex_layout: {
        type: "Section",
        children: [
          {
            type: "Accordion",
            props: {
              items: [
                { title: "Why zero wrapper divs?", content: "Smaller DOM and faster LCP." },
                { title: "Are prices exact?", content: "Yes, ADR-025c keeps GrabDecimal wire strings." },
              ],
            },
          },
        ],
      },
    },
  });
  assert.deepEqual(faqBlogRes.types_generated, ["BlogPosting", "FAQPage"]);
  const faqNode = faqBlogRes.json_ld["@graph"].find((n) => n["@type"] === "FAQPage");
  assert.equal(faqNode.mainEntity.length, 2);
});

test("generateSchemaOrgJsonLd strictly rejects JavaScript float prices (ADR-025c) and escapes </script> XSS payloads", () => {
  assert.throws(
    () =>
      generateSchemaOrgJsonLd({
        schema_type: "Product",
        product: { name: "Float Leak", price: 49.99 },
      }),
    GrexSecurityError
  );

  assert.throws(
    () =>
      generateSchemaOrgJsonLd({
        schema_type: "Product",
        product: { name: "IEEE Drift String", price: "0.30000000000000004" },
      }),
    GrexSecurityError
  );

  const xssAttempt = '</script><script>alert("xss")</script> & Sons';
  const safeRes = generateSchemaOrgJsonLd({
    schema_type: "Article",
    entry: {
      title: `Injected Title ${xssAttempt}`,
      full_path: "/articles/xss-check",
      meta_description: `Summary ${xssAttempt}`,
    },
  });

  assert.ok(!safeRes.json_ld_escaped.toLowerCase().includes("</script>"));
  assert.ok(!safeRes.json_ld_escaped.includes("<script>"));
  assert.ok(safeRes.json_ld_escaped.includes("\\u003c/script\\u003e"));
  assert.ok(safeRes.json_ld_escaped.includes("\\u0026"));

  // Exactly 1 outer opening/closing script wrapper tag in script_tag_payload
  const closingTags = safeRes.script_tag_payload.match(/<\/script>/gi) || [];
  assert.equal(closingTags.length, 1);
  assert.equal(escapeJsonLdForScript("</script>&"), "\\u003c/script\\u003e\\u0026");
});

test("Media Library alt-text enrichment detects missing/filename alts, preserves decorative items, and enforces single-use approval tokens", () => {
  const store = new Map();
  const plan = analyzeMediaAltText(
    {
      media: [
        { id: 11, filename: "IMG_1234.jpg", alt_text: "IMG_1234.jpg", decorative: false, context_entry_title: "Artisan Coffee Kettle" },
        { id: 12, filename: "DSC_0042.png", alt_text: "", is_decorative: false, caption: "Steaming stainless pour-over kettle on cedar counter" },
        { id: 13, filename: "bg-wave.svg", alt_text: "", decorative: true },
        { id: 14, filename: "hero-team.webp", alt_text: "Software engineers collaborating around an accessible display", is_decorative: false },
      ],
    },
    store
  );

  assert.equal(plan.schema_version, "0.4.0");
  assert.equal(plan.mutates_live_cms, false);
  assert.equal(plan.approval_required, true);
  assert.ok(plan.approval_token.startsWith("altok_"));
  assert.equal(plan.summary.needs_enrichment, 2);
  assert.equal(plan.summary.decorative_preserved, 1);
  assert.equal(plan.summary.already_valid, 1);

  const img1 = plan.items.find((i) => i.media_id === 11);
  const img2 = plan.items.find((i) => i.media_id === 12);
  const dec = plan.items.find((i) => i.media_id === 13);
  assert.equal(img1.needs_enrichment, true);
  assert.ok(img1.proposed_alt.length >= 12 && img1.proposed_alt.length <= 125);
  assert.equal(img2.proposed_alt, "Steaming stainless pour-over kettle on cedar counter");
  assert.equal(dec.decorative, true);
  assert.equal(dec.proposed_alt, "");
  assert.equal(dec.aria_hidden, "true");
  assert.equal(dec.status, "decorative_preserved");

  // Missing or invalid token rejected with 403
  assert.equal(approveMediaAltEnrichment({ approval_token: "", updates: [] }, store).status, 403);
  assert.equal(approveMediaAltEnrichment({ approval_token: "altok_fake", updates: [{ media_id: 11 }] }, store).status, 403);

  // Valid single-use approval preserves decorative item even if accidentally passed in updates
  const okRes = approveMediaAltEnrichment(
    {
      approval_token: plan.approval_token,
      updates: [
        { media_id: 11, alt_text: img1.proposed_alt },
        { media_id: 12, alt_text: img2.proposed_alt },
        { media_id: 13, alt_text: "Should stay decorative empty" },
      ],
    },
    store
  );
  assert.equal(okRes.ok, true);
  assert.equal(okRes.single_use_consumed, true);
  assert.equal(okRes.approved_count, 2);
  assert.equal(okRes.preserved_decorative_count, 1);
  const decOut = okRes.approved_items.find((a) => a.media_id === 13);
  assert.equal(decOut.alt_text, "");
  assert.equal(decOut.aria_hidden, "true");
  assert.equal(decOut.status, "decorative_preserved");

  // Replay of same approval_token rejected with 409 Conflict
  const replayRes = approveMediaAltEnrichment(
    { approval_token: plan.approval_token, updates: [{ media_id: 11, alt_text: img1.proposed_alt }] },
    store
  );
  assert.equal(replayRes.ok, false);
  assert.equal(replayRes.status, 409);
});
