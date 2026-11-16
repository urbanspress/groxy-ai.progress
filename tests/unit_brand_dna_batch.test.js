import test from "node:test";
import assert from "node:assert/strict";
import {
  BRAND_DNA_QUESTIONS,
  BrandDnaValidationError,
  mountBrandDnaWizard,
  normalizeBrandDna,
  renderBrandDnaMarkdown,
  validateExactDecimal,
} from "../public/groxy/brand-dna.js";
import {
  applyCampaignPreview,
  assertBatchBounds,
  escapeJsonLd,
  generateDeterministicCampaign,
  makeCampaignSlug,
  mountBatchCampaignStudio,
  normalizeCampaignText,
} from "../public/groxy/batch-campaign.js";
import { buildPortableSiteDna } from "../public/groxy/site-context.js";
import { auditDom, createDomDocument } from "./helpers/dom-shim.js";

const profileInput = {
  business_name: "North Star Studio", business_type: "Design studio", niche: "Accessible web design",
  target_audience: "small business owners", pain_points: ["hard to find local customers"],
  service_area: "Albany, NY", location_terms: ["Capital Region"],
  voice_weights: { authoritative: 30, warm_friendly: 35, bold_direct: 15, technical_expert: 20 },
  forbidden_terms: ["guaranteed rankings"], preferred_ctas: ["Book a consultation"], avoided_ctas: ["Buy now"],
  offer_types: ["consultation"], prices: { default: "129.50" }, currency: "USD",
  guarantees: { status: "unknown", details: "" }, style_pack: "emerald-editorial", design_tokens: ["--grex-space-md"],
};

test("Brand DNA presents ten wizard questions and normalizes bounded exact profile data", () => {
  assert.equal(BRAND_DNA_QUESTIONS.length, 10);
  const profile = normalizeBrandDna(profileInput, { revision: 2, now: "2026-11-15T00:00:00.000Z" });
  assert.equal(profile.schema, "brand-dna.v1");
  assert.equal(profile.prices.default, "129.50");
  assert.equal(profile.revision, 2);
  assert.match(renderBrandDnaMarkdown(profile), /do not infer guarantees/i);
});

test("Brand DNA rejects float prices and noncanonical values", () => {
  assert.throws(() => normalizeBrandDna({ ...profileInput, prices: { default: 12.5 } }), BrandDnaValidationError);
  for (const value of [12.5, "1e3", "+1.00", "01.00", "NaN"]) assert.throws(() => validateExactDecimal(value));
});

test("wizard is semantic, labeled, and uses no div or innerHTML writes", () => {
  const { doc, root } = createDomDocument();
  const wizard = mountBrandDnaWizard({ root, document: doc, fetchFn: null });
  const safety = auditDom(root, doc);
  assert.equal(safety.divCount, 0);
  assert.equal(safety.innerHTMLWriteCount, 0);
  assert.equal(safety.unlabeledControls.length, 0);
  assert.equal(root.querySelectorAll("input").length >= 10, true);
  const steps = root.querySelectorAll("fieldset");
  assert.equal(steps.length, 10);
  assert.equal(steps.filter((step) => !step.hidden).length, 1);
  root.querySelector("#brand-dna-wizard-next").dispatchEvent("click");
  assert.equal(steps.filter((step) => !step.hidden).length, 1);
  assert.match(root.querySelector("#brand-dna-progress").textContent, /Question 2 of 10/);
  wizard.dispose();
});

test("batch campaign studio has labeled controls and uses no div or innerHTML writes", () => {
  const { doc, root } = createDomDocument();
  const panel = mountBatchCampaignStudio({ root, document: doc, fetchFn: null });
  const safety = auditDom(root, doc);
  assert.equal(safety.divCount, 0);
  assert.equal(safety.innerHTMLWriteCount, 0);
  assert.equal(safety.unlabeledControls.length, 0);
  assert.equal(root.querySelectorAll("input").length, 3);
  assert.equal(root.querySelectorAll("select").length, 2);
  assert.equal(root.querySelectorAll("textarea").length, 1);
  panel.dispose();
});

test("portable Site DNA includes validated additive Brand DNA and preserves legacy shape", () => {
  const profile = normalizeBrandDna(profileInput, { revision: 1 });
  const dna = buildPortableSiteDna({ site_context: { site_name: "Example", site_url: "https://example.test" }, brand_dna: profile });
  assert.equal(dna.brand_dna.revision, 1);
  const legacy = buildPortableSiteDna({ site_context: { site_name: "Example", site_url: "https://example.test" } });
  assert.equal("brand_dna" in legacy, false);
  assert.throws(() => buildPortableSiteDna({ brand_dna: { ...profile, prices: { default: 12.5 } } }));
});

test("batch bounds accept 1 and 40 and reject out-of-range values", () => {
  assert.equal(assertBatchBounds(1), 1);
  assert.equal(assertBatchBounds(40), 40);
  assert.throws(() => assertBatchBounds(0), RangeError);
  assert.throws(() => assertBatchBounds(41), RangeError);
});

test("deterministic campaign is repeatable and avoids normalized existing and intra-batch collisions", () => {
  const input = { brief: "Accessible local website planning.", item_count: 4, brand_dna: normalizeBrandDna(profileInput), site_context: { entries: [{ title: "A practical guide to Accessible local website planning", slug: "a-practical-guide-to-accessible-local-website-planning" }] } };
  const one = generateDeterministicCampaign(input);
  const two = generateDeterministicCampaign(input);
  assert.deepEqual(one.items, two.items);
  assert.equal(new Set(one.items.map((x) => normalizeCampaignText(x.title))).size, 4);
  assert.equal(new Set(one.items.map((x) => x.slug)).size, 4);
  assert.notEqual(one.items[0].slug, makeCampaignSlug(input.site_context.entries[0].slug));
  assert.ok(one.items.every((x) => typeof x.schema_json_ld === "string" && x.status === "draft"));
});

test("product campaign keeps exact decimal strings and script-safe schema.org JSON-LD", () => {
  const p = normalizeBrandDna(profileInput);
  const result = generateDeterministicCampaign({ brief: "Locally crafted ceramic mug.", item_count: 1, content_type: "product", brand_dna: p });
  assert.equal(result.items[0].custom_fields.price, "129.50");
  assert.match(result.items[0].schema_json_ld, /schema.org/);
  assert.equal(result.items[0].schema_json_ld.includes("</script>"), false);
  assert.equal(escapeJsonLd({ x: "</script>" }).includes("</script>"), false);
  assert.throws(() => generateDeterministicCampaign({ brief: "Crafted mug for locals.", item_count: 1, content_type: "product", brand_dna: { ...p, prices: {} } }));
});

test("batch apply sends one explicit CSRF protected single-use approval payload", async () => {
  const calls = [];
  const result = await applyCampaignPreview({ csrfToken: "csrf", batch_id: "batch_1", approval_token: "btok_1", fetchFn: async (url, options) => {
    calls.push([url, options]); return { ok: true, json: async () => ({ created_count: 1 }) };
  } });
  assert.equal(result.created_count, 1);
  assert.equal(calls[0][0], "/api/groxy/batch-create/apply");
  assert.equal(calls[0][1].headers["X-CSRF-Token"], "csrf");
  assert.deepEqual(JSON.parse(calls[0][1].body), { batch_id: "batch_1", approval_token: "btok_1" });
});
