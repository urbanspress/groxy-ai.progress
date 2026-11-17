import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  AUTHOR_STUDIO_VERSION,
  AuthorStudioError,
  CANONICAL_GENRE_PRICING_TIERS,
  GROXY_VERSION,
  REQUIRED_GENRE_SLUGS,
  auditAuthorStudioUi,
  auditReadabilityHemingway,
  buildSeriesReadingGridLayout,
  canonicalJson,
  generateBookJsonLd,
  mountAuthorStudio,
  sha256,
  validateGenrePlaybook,
} from "../public/groxy/author-studio.js";
import * as assetAuthorStudio from "../assets/author-studio.js";
import { computeContrastRatio } from "../public/groxy/grex.js";
import { auditDom, createDomDocument } from "./helpers/dom-shim.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

test("v1.7.0 author-studio exports match between public/groxy and assets", () => {
  assert.equal(GROXY_VERSION, "1.7.0");
  assert.equal(AUTHOR_STUDIO_VERSION, "1.7.0");
  assert.equal(assetAuthorStudio.GROXY_VERSION, "1.7.0");
  assert.equal(typeof assetAuthorStudio.mountAuthorStudio, "function");
});

test("C1/C2: All 6 genre playbooks and .agents/skills/genre-research/SKILL.md pass fail-closed validation", () => {
  const skillPath = path.join(REPO_ROOT, ".agents", "skills", "genre-research", "SKILL.md");
  assert.equal(fs.existsSync(skillPath), true, ".agents/skills/genre-research/SKILL.md must exist");
  const skillText = fs.readFileSync(skillPath, "utf8");
  assert.ok(skillText.includes("groxy-genre-playbook-v1.0"));
  assert.ok(skillText.includes("ADR-025c"));

  for (const slug of REQUIRED_GENRE_SLUGS) {
    const pPath = path.join(REPO_ROOT, "playbook", "genres", `${slug}.v1.json`);
    assert.equal(fs.existsSync(pPath), true, `Missing genre playbook: ${slug}.v1.json`);
    const pb = JSON.parse(fs.readFileSync(pPath, "utf8"));
    const validated = validateGenrePlaybook(pb, slug);
    assert.equal(validated.schema_version, "groxy-genre-playbook-v1.0");
    assert.equal(validated.schema_org_book_defaults["@context"], "https://schema.org");
    assert.equal(validated.schema_org_book_defaults.bookFormat.startsWith("https://schema.org/"), true);
    assert.equal(validated.schema_org_book_defaults.offers_defaults.availability.startsWith("https://schema.org/"), true);
    const tierVals = new Set(Object.values(validated.publishing_and_pricing_tiers.pricing_tiers_usd));
    for (const reqTier of CANONICAL_GENRE_PRICING_TIERS) {
      assert.ok(tierVals.has(reqTier), `${slug} must include ADR-025c tier ${reqTier}`);
    }
  }
});

test("C1/C2: Fail-closed playbook validator rejects floats, Markdown schema URLs, and XSS payloads with 422", () => {
  const basePb = JSON.parse(
    fs.readFileSync(path.join(REPO_ROOT, "playbook", "genres", "urban-fiction.v1.json"), "utf8")
  );

  // Raw JS float in pricing tier -> 422
  const floatPb = structuredClone(basePb);
  floatPb.publishing_and_pricing_tiers.pricing_tiers_usd.book_1_standard_price = 2.99;
  assert.throws(
    () => validateGenrePlaybook(floatPb, "urban-fiction"),
    (err) => err instanceof AuthorStudioError && err.status === 422 && err.code === "ADR025C_WIRE_REQUIRED"
  );

  // Markdown link in schema_org_book_defaults -> 422
  const mdPb = structuredClone(basePb);
  mdPb.schema_org_book_defaults.bookFormat = "[https://schema.org/EBook](https://schema.org/EBook)";
  assert.throws(
    () => validateGenrePlaybook(mdPb, "urban-fiction"),
    (err) => err instanceof AuthorStudioError && err.status === 422
  );

  // Inline <script> XSS -> 422
  const xssPb = structuredClone(basePb);
  xssPb.target_audience.reading_motivations.push("<script>alert(1)</script>");
  assert.throws(
    () => validateGenrePlaybook(xssPb, "urban-fiction"),
    (err) => err instanceof AuthorStudioError && err.status === 422 && err.code === "GENRE_PLAYBOOK_XSS"
  );
});

test("C2: Hemingway Readability Auditor emits exact wire strings and detects passive voice, adverbs, and complex clauses", () => {
  const urbanPb = JSON.parse(
    fs.readFileSync(path.join(REPO_ROOT, "playbook", "genres", "urban-fiction.v1.json"), "utf8")
  );
  const prose =
    "The ledger was stolen by Marcus quickly, and the warehouse doors were locked very tightly because nobody wanted the auditors to uncover the missing shipments that had been hidden beneath the floorboards since Tuesday. " +
    '"Give me the keys," Maya said. ' +
    '"Not tonight," Marcus replied.';

  const report = auditReadabilityHemingway(prose, urbanPb);
  assert.equal(report.ok, true);
  assert.equal(report.genre_slug, "urban-fiction");
  assert.equal(typeof report.metrics.grade_level, "string");
  assert.match(report.metrics.grade_level, /^\d+\.\d{2}$/);
  assert.match(report.metrics.passive_voice_percent, /^\d+\.\d{2}$/);
  assert.match(report.metrics.adverb_density_percent, /^\d+\.\d{2}$/);
  assert.match(report.metrics.dialogue_ratio_percent, /^\d+\.\d{2}$/);
  assert.ok(Number(report.metrics.passive_voice_percent) > 0);
  assert.ok(Number(report.metrics.adverb_density_percent) > 0);
  assert.ok(Number(report.metrics.complex_sentence_count) >= 1);
  assert.ok(report.suggestions.some((s) => s.category === "passive_voice"));
  assert.ok(report.suggestions.some((s) => s.category === "adverb_clutter"));
  assert.ok(report.suggestions.some((s) => s.category === "complex_clause"));
});

test("C2/C3: schema.org/Book & BookSeries JSON-LD escapes </script>, <, >, &, U+2028, U+2029 and rejects floats with 422", () => {
  const thrillerPb = JSON.parse(
    fs.readFileSync(path.join(REPO_ROOT, "playbook", "genres", "thriller.v1.json"), "utf8")
  );
  const res = generateBookJsonLd({
    genrePlaybook: thrillerPb,
    artifactType: "series_reading_grid",
    bookMeta: {
      title: "Midnight Ledger </script><img src=x>&\u2028\u2029",
      author_name: "J. Cole",
      isbn: "978-1-4028-9462-6",
      bookFormat: "Paperback",
      numberOfPages: "312",
      price: "14.99",
      series_name: "Midnight Casefiles",
    },
    siteUrl: "https://plotific.example",
  });

  assert.equal(res.ok, true);
  assert.equal(res.schema_type, "BookSeries+Book");
  assert.equal(res.json_ld_escaped.includes("</script>"), false);
  assert.equal(res.json_ld_escaped.includes("<"), false);
  assert.equal(res.json_ld_escaped.includes(">"), false);
  assert.equal(res.json_ld_escaped.includes("&"), false);
  assert.equal(res.json_ld_escaped.includes("\u2028"), false);
  assert.equal(res.json_ld_escaped.includes("\u2029"), false);
  assert.ok(res.json_ld_escaped.includes("\\u003c/script\\u003e"));
  assert.equal(res.json_ld_object["@graph"][1].offers.price, "14.99");
  assert.equal(res.json_ld_object["@graph"][1].numberOfPages, "312");
  assert.equal(res.json_ld_object["@graph"][1].bookFormat, "https://schema.org/Paperback");

  // Reject JS float price (422)
  assert.throws(
    () =>
      generateBookJsonLd({
        genrePlaybook: thrillerPb,
        bookMeta: { title: "Bad Price", price: 4.99, numberOfPages: "280" },
      }),
    (err) => err instanceof AuthorStudioError && err.status === 422
  );

  // Reject JS number numberOfPages (422)
  assert.throws(
    () =>
      generateBookJsonLd({
        genrePlaybook: thrillerPb,
        bookMeta: { title: "Bad Pages", price: "4.99", numberOfPages: 280 },
      }),
    (err) => err instanceof AuthorStudioError && err.status === 422
  );
});

test("C4/C7: series_reading_grid compiles zero-<div> Grex layout with exact ADR-025c tiers & Light/Dark WCAG AA >= 4.5:1", () => {
  const romancePb = JSON.parse(
    fs.readFileSync(path.join(REPO_ROOT, "playbook", "genres", "romance.v1.json"), "utf8")
  );
  const { layout, design_craft } = buildSeriesReadingGridLayout({
    genrePlaybook: romancePb,
    brief: { series_name: "Harbor Hearts", author_name: "Nadia Brooks" },
    cmsContentTypes: [{ slug: "post", fields: [] }],
  });

  const serialized = JSON.stringify(layout);
  assert.equal(/\bdiv\b/i.test(serialized), false);
  for (const priceTier of CANONICAL_GENRE_PRICING_TIERS) {
    assert.ok(serialized.includes(priceTier), `Series grid must carry exact tier ${priceTier}`);
  }
  assert.equal(design_craft.valid, true);
  assert.equal(design_craft.light_contrast_passed, true);
  assert.equal(design_craft.dark_contrast_passed, true);

  // Verify Light & Dark Author Studio UI contrast ratios and auditAccessibility()
  assert.ok(computeContrastRatio("#0f172a", "#ffffff") >= 4.5);
  assert.ok(computeContrastRatio("#f8fafc", "#0f172a") >= 4.5);
  assert.ok(computeContrastRatio("#f8fafc", "#1e293b") >= 4.5);
  assert.equal(auditAuthorStudioUi("light").valid, true);
  assert.equal(auditAuthorStudioUi("dark").valid, true);
  assert.equal(auditAuthorStudioUi("light").accessibility.ok, true);
  assert.equal(auditAuthorStudioUi("dark").accessibility.ok, true);
  assert.deepEqual(
    auditAuthorStudioUi("light").accessibility.issues.filter((i) => i.severity === "error"),
    []
  );
  assert.deepEqual(
    auditAuthorStudioUi("dark").accessibility.issues.filter((i) => i.severity === "error"),
    []
  );
});

test("C4: mountAuthorStudio maintains divCount === 0, innerHTMLWriteCount === 0, keyboard nav & Escape focus restoration", async () => {
  const { doc, root } = createDomDocument({ csrfToken: "csrf-author-ui" });

  let calls = [];
  const mockFetch = async (url, init = {}) => {
    calls.push({ url, body: JSON.parse(init.body || "{}") });
    if (url === "/api/groxy/author/readability-audit") {
      return new Response(
        JSON.stringify({
          ok: true,
          score: 96,
          grade: "A+",
          metrics: {
            grade_level: "6.40",
            passive_voice_percent: "0.00",
            adverb_density_percent: "0.00",
            dialogue_ratio_percent: "45.00",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
    if (url === "/api/groxy/author/generate") {
      return new Response(
        JSON.stringify({
          ok: true,
          author_plan_id: "aplan-0123456789abcdef0123456789abcdef",
          genre_slug: "urban-fiction",
          artifact_type: "chapter_outline",
          target_slot: "home",
          payload_sha256: "a".repeat(64),
          approval_token: "atok_" + "b".repeat(64),
          artifact: { title: "Crown of Concrete — Chapter 1 Outline" },
          hemingway_audit: {
            score: 96,
            grade: "A+",
            metrics: {
              grade_level: "6.40",
              passive_voice_percent: "0.00",
              adverb_density_percent: "0.00",
              dialogue_ratio_percent: "48.00",
            },
          },
          schema_org_json_ld: {
            script_tag_preview: '<script type="application/ld+json">{"@type":"Book"}</script>',
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
    if (url === "/api/groxy/author/apply") {
      return new Response(
        JSON.stringify({
          ok: true,
          approved: true,
          status_enforced: "draft",
          draft_id: "42",
        }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      );
    }
    return new Response("{}", { status: 404 });
  };

  const studio = mountAuthorStudio({ root, document: doc, csrfToken: "csrf-author-ui", fetchFn: mockFetch });
  const domAudit = auditDom(root, doc);
  assert.equal(domAudit.divCount, 0);
  assert.equal(domAudit.innerHTMLWriteCount, 0);
  assert.deepEqual(domAudit.unlabeledControls, []);
  assert.equal(domAudit.scriptElements, 0);

  await studio.runReadabilityAudit();
  assert.equal(studio.getReadability().grade, "A+");

  const staged = await studio.generateProposal();
  assert.equal(staged.author_plan_id.startsWith("aplan-"), true);

  const reviewBtn = root.querySelector("#author-review-apply-btn");
  reviewBtn.dispatchEvent({ type: "keydown", key: "Enter", preventDefault() {} });
  const dialog = root.querySelector("#author-confirm-dialog");
  assert.equal(dialog.getAttribute("open"), "open");

  dialog.dispatchEvent({ type: "keydown", key: "Escape", preventDefault() {} });
  assert.equal(dialog.getAttribute("open"), null);

  studio.openConfirmDialog();
  const applied = await studio.applyStaged();
  assert.equal(applied.status_enforced, "draft");
  assert.equal(studio.getStaged(), null);
  assert.equal(calls.length, 3);

  const canonicalDigest = await sha256(canonicalJson({ a: 1, b: "4.99" }));
  assert.equal(canonicalDigest.length, 64);

  studio.dispose();
});
