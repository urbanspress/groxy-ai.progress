import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { auditDom, createDomDocument } from "./helpers/dom-shim.js";
import { mountGroxyDashboard, SAMPLE_AUDIT_PRESETS } from "../public/groxy/dashboard.js";
import { generatePageOrSection } from "../public/groxy/generator.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VIEW_PATH = path.resolve(__dirname, "..", "views", "dashboard.grab.html");

test("views/dashboard.grab.html contains zero wrapper <div> tags and zero innerHTML calls", () => {
  const html = fs.readFileSync(VIEW_PATH, "utf8");
  assert.equal(/<div\b/i.test(html), false, "dashboard.grab.html must contain zero <div> elements");
  assert.equal(html.includes("groxy-csrf"), true);
  assert.equal(html.includes('id="groxy-inspector-root"'), true);
});

test("mountGroxyDashboard renders cleanly with zero <div>, zero innerHTML, WCAG AA labels, and reactive preset updates", async () => {
  const { doc, root } = createDomDocument({ csrfToken: "csrf-unit-test" });

  let auditCalls = 0;
  let inspectCalls = 0;
  const mockFetch = async (url, init) => {
    if (url === "/api/groxy/audit") {
      auditCalls += 1;
      const body = JSON.parse(init.body);
      // Verify exact GrabDecimal string was preserved by the UI
      assert.equal(typeof body.entry.custom_fields.price, "string");
      return new Response(
        JSON.stringify({
          schema_version: "0.1.0",
          playbook_version: "1.0.0",
          audited_at: "2026-11-14T12:00:00Z",
          target: { entry_id: "101", content_type: "post", title: body.entry.title, slug: body.entry.slug },
          overall_score: 98,
          overall_grade: "A+",
          publish_safe: true,
          categories: {
            on_page_seo: { label: "On-Page SEO", score: 100, grade: "A+" },
            content_a11y: { label: "Content & WCAG Accessibility", score: 100, grade: "A+" },
            performance_dom: { label: "Performance & Clean DOM", score: 100, grade: "A+" },
            linking_readiness: { label: "Off-Page / Internal Linking Readiness", score: 92, grade: "A" },
          },
          findings: [],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
    if (url === "/api/groxy/mcp/inspect") {
      inspectCalls += 1;
      return new Response(
        JSON.stringify({
          ok: true,
          grab_cli_tools: ["grab_check", "grab_format", "grab_inspect_routes", "grab_inspect_schema", "grab_scaffold"],
          grablab_tools_expected: ["list_content_types", "query_entries", "create_entry_draft", "update_entry_layout", "list_media", "list_menus"],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
    return new Response("{}", { status: 404 });
  };

  const handle = mountGroxyDashboard({
    root,
    document: doc,
    csrfToken: "csrf-unit-test",
    fetchImpl: mockFetch,
  });

  // Initial DOM & WCAG AA safety checks
  const domAudit = auditDom(root, doc);
  assert.equal(domAudit.divCount, 0);
  assert.equal(domAudit.innerHTMLWriteCount, 0);
  assert.equal(domAudit.headingOrderOk, true);
  assert.deepEqual(domAudit.unlabeledControls, []);
  assert.equal(domAudit.missingAltImages, 0);
  assert.equal(domAudit.scriptElements, 0);
  assert.deepEqual(domAudit.unsafeUrls, []);
  assert.deepEqual(domAudit.inlineHandlers, []);
  const visionStudio = root.querySelector("#vision-clone-studio");
  assert.ok(visionStudio, "Screenshot-to-Grex studio panel is mounted");
  assert.equal(visionStudio.querySelector("input").getAttribute("aria-label"), "Reference screenshot PNG, JPEG, or WebP");
  assert.ok(visionStudio.querySelector('button'));

  const safety = handle.auditDomSafety();
  assert.equal(safety.divCount, 0);

  // Playbook table starts with all 22 rows in tbody
  const playbookTable = root.querySelector("#groxy-playbook-table");
  assert.equal(playbookTable.querySelector("tbody").children.length, 22);

  // Filter playbook to performance_dom (5 rules)
  const filterSelect = root.querySelector("#groxy-playbook-filter");
  filterSelect.value = "performance_dom";
  filterSelect.dispatchEvent({ type: "change" });
  assert.equal(playbookTable.querySelector("tbody").children.length, 5);

  // Switch preset to unsafe and confirm grade drops to F / publish_safe false
  const presetSelect = root.querySelector("#groxy-preset-select");
  presetSelect.value = "unsafe";
  presetSelect.dispatchEvent({ type: "change" });
  const unsafeReport = handle.getCurrentReport();
  assert.equal(unsafeReport.overall_grade, "F");
  assert.equal(unsafeReport.publish_safe, false);

  // Switch back to product preset (verifies exact GrabDecimal "1000.00") and submit live fetch audit
  presetSelect.value = "product";
  presetSelect.dispatchEvent({ type: "change" });
  assert.equal(SAMPLE_AUDIT_PRESETS.product.entry.custom_fields.price, "1000.00");
  await handle.runAudit();
  assert.equal(auditCalls, 1);
  assert.equal(handle.getCurrentReport().overall_grade, "A+");

  // Click Inspect MCP Bridge button
  const inspectBtn = root.querySelector("#groxy-inspect-mcp-btn");
  inspectBtn.dispatchEvent({ type: "click" });
  await new Promise((r) => setTimeout(r, 15));
  assert.equal(inspectCalls, 1);
  assert.ok(root.querySelector("#groxy-mcp-summary").textContent.includes("Verified 5 GRAB CLI MCP tools"));

  // Confirm DOM shim still enforces zero innerHTML writes
  assert.throws(() => {
    root.innerHTML = "<div>bad</div>";
  }, /innerHTML/);
  assert.equal(doc.innerHTMLWriteCount, 1);

  handle.dispose();
});

test("Pre-Publish Review Gate & Side-by-Side Boost Diff Viewer maintain zero <div>, zero innerHTML, and human approval", async () => {
  const { doc, root } = createDomDocument({ csrfToken: "csrf-v020-ui" });

  let approveCalls = 0;
  let lastApproveBody = null;
  const mockFetch = async (url, init) => {
    if (url === "/api/groxy/boost/approve") {
      approveCalls += 1;
      lastApproveBody = JSON.parse(init.body);
      return new Response(
        JSON.stringify({
          ok: true,
          approved: true,
          ready_for_publish: true,
          boost_id: lastApproveBody.boost_id,
          draft_status: "draft",
          actor: "groxy-ai",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
    return new Response("{}", { status: 404 });
  };

  const handle = mountGroxyDashboard({
    root,
    document: doc,
    csrfToken: "csrf-v020-ui",
    fetchImpl: mockFetch,
  });

  // Switch to unsafe preset (F grade)
  const presetSelect = root.querySelector("#groxy-preset-select");
  presetSelect.value = "unsafe";
  presetSelect.dispatchEvent({ type: "change" });

  // Open Pre-Publish Review Gate
  await handle.triggerPrePublishReview();
  const revState = handle.getReviewState();
  assert.equal(revState.gate_status, "review_required");
  assert.equal(revState.audit_report.overall_grade, "F");

  const prepublishPanel = root.querySelector("#groxy-prepublish-panel");
  assert.ok(prepublishPanel.querySelector("#groxy-make-live-btn"));
  const boostBtn = prepublishPanel.querySelector("#groxy-boost-btn");
  assert.ok(boostBtn);
  assert.ok(boostBtn.textContent.includes("Let Groxy Boost This"));

  // Check zero <div> & WCAG AA while Pre-Publish Review Gate is open
  let domAudit = auditDom(root, doc);
  assert.equal(domAudit.divCount, 0);
  assert.equal(domAudit.innerHTMLWriteCount, 0);
  assert.equal(domAudit.headingOrderOk, true);
  assert.deepEqual(domAudit.unlabeledControls, []);

  // Trigger 🚀 Let Groxy Boost This
  await handle.triggerBoost();
  const boostState = handle.getBoostState();
  assert.ok(boostState);
  assert.equal(boostState.before_report.overall_grade, "F");
  assert.ok(boostState.after_report.overall_score >= 90);
  assert.equal(boostState.after_report.publish_safe, true);
  assert.equal(boostState.candidate_entry.custom_fields.price, "19.95");
  assert.equal(approveCalls, 0, "Nothing may be persisted or approved before human clicks Approve & Make This Live");

  const diffPanel = root.querySelector("#groxy-boost-diff-panel");
  assert.ok(diffPanel.querySelector("#groxy-boost-score-lift").textContent.includes("→"));
  assert.ok(diffPanel.querySelector("#groxy-diff-list").children.length >= 3);
  assert.ok(diffPanel.querySelector("#groxy-approve-boost-btn"));
  assert.ok(diffPanel.querySelector("#groxy-discard-boost-btn"));

  // Check zero <div> & WCAG AA while Side-by-Side Diff Viewer is open
  domAudit = auditDom(root, doc);
  assert.equal(domAudit.divCount, 0);
  assert.equal(domAudit.innerHTMLWriteCount, 0);
  assert.equal(domAudit.headingOrderOk, true);
  assert.deepEqual(domAudit.unlabeledControls, []);

  // Click Approve & Make This Live
  await handle.approveBoost();
  assert.equal(approveCalls, 1);
  assert.equal(lastApproveBody.boost_id, boostState.boost_id);
  assert.equal(lastApproveBody.approval_token, boostState.approval_token);
  assert.equal(handle.getCurrentReport().publish_safe, true);
  assert.ok(handle.getCurrentReport().overall_score >= 90);
  assert.ok(root.querySelector("#groxy-publish-notice").textContent.includes("Approved"));

  // Toggle groxy_assist_enabled OFF and verify bypassed gate
  const assistToggle = root.querySelector("#groxy-assist-toggle");
  assistToggle.checked = false;
  assistToggle.dispatchEvent({ type: "change" });
  const bypassed = await handle.triggerPrePublishReview();
  assert.equal(bypassed.gate_status, "bypassed");
  assert.ok(root.querySelector("#groxy-gate-bypassed"));

  domAudit = auditDom(root, doc);
  assert.equal(domAudit.divCount, 0);
  assert.equal(domAudit.innerHTMLWriteCount, 0);

  handle.dispose();
});

test("Visual Generator Studio renders Style Packs, Blueprint previews, exact GrabDecimal tiers, Discard, and Approve with zero <div> / innerHTML", async () => {
  const { doc, root } = createDomDocument({ csrfToken: "csrf-v030-gen-ui" });

  let generateCalls = 0;
  let applyCalls = 0;
  let lastGenerateBody = null;
  let lastApplyBody = null;
  const stagedTokens = new Map();

  const mockFetch = async (url, init = {}) => {
    if (url === "/api/groxy/generate-layout") {
      generateCalls += 1;
      assert.equal(init.headers["X-CSRF-Token"], "csrf-v030-gen-ui");
      lastGenerateBody = JSON.parse(init.body);
      const generated = generatePageOrSection(lastGenerateBody);
      stagedTokens.set(generated.generation_id, generated.approval_token);
      return new Response(JSON.stringify(generated), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (url === "/api/groxy/generate-layout/apply") {
      applyCalls += 1;
      assert.equal(init.headers["X-CSRF-Token"], "csrf-v030-gen-ui");
      lastApplyBody = JSON.parse(init.body);
      const expected = stagedTokens.get(lastApplyBody.generation_id);
      if (!expected || expected !== lastApplyBody.approval_token) {
        return new Response(JSON.stringify({ error: "Invalid approval_token" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
      stagedTokens.delete(lastApplyBody.generation_id);
      return new Response(
        JSON.stringify({
          schema_version: "0.3.0",
          generation_id: lastApplyBody.generation_id,
          approved: true,
          actor: "groxy-ai",
          command_stack_action: "applyAiLayout",
          undo_available: true,
          status_enforced: "draft",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
    return new Response("{}", { status: 404 });
  };

  const handle = mountGroxyDashboard({
    root,
    document: doc,
    csrfToken: "csrf-v030-gen-ui",
    fetchImpl: mockFetch,
  });

  // Verify initial studio form controls are labeled and div-free
  assert.ok(root.querySelector("#groxy-generator-studio-panel"));
  let domAudit = auditDom(root, doc);
  assert.equal(domAudit.divCount, 0);
  assert.equal(domAudit.innerHTMLWriteCount, 0);
  assert.deepEqual(domAudit.unlabeledControls, []);
  assert.equal(domAudit.headingOrderOk, true);

  // Configure Pricing Grid + Warm Commerce pack + exact GrabDecimal strings
  const blueprintSel = root.querySelector("#groxy-gen-blueprint");
  blueprintSel.value = "pricing_grid";
  blueprintSel.dispatchEvent({ type: "change" });

  const packSel = root.querySelector("#groxy-gen-style-pack");
  packSel.value = "warm-commerce";
  packSel.dispatchEvent({ type: "change" });

  const p0 = root.querySelector("#groxy-gen-starter-price");
  p0.value = "0.00";
  p0.dispatchEvent({ type: "input" });
  const p1 = root.querySelector("#groxy-gen-pro-price");
  p1.value = "29.00";
  p1.dispatchEvent({ type: "input" });
  const p2 = root.querySelector("#groxy-gen-ent-price");
  p2.value = "149.95";
  p2.dispatchEvent({ type: "input" });

  const preview1 = await handle.triggerGeneratePreview();
  assert.ok(preview1);
  assert.equal(generateCalls, 1);
  assert.equal(applyCalls, 0);
  assert.equal(lastGenerateBody.pricing_tiers[0].price, "0.00");
  assert.equal(lastGenerateBody.pricing_tiers[1].price, "29.00");
  assert.equal(lastGenerateBody.pricing_tiers[2].price, "149.95");

  const scorecardText = root.querySelector("#groxy-gen-scorecard").textContent;
  assert.ok(scorecardText.includes("Grade A"));
  assert.ok(scorecardText.includes("Divs: 0"));

  const canvasText = root.querySelector("#groxy-generator-canvas").textContent;
  assert.ok(canvasText.includes("0.00"));
  assert.ok(canvasText.includes("29.00"));
  assert.ok(canvasText.includes("149.95"));
  assert.ok(root.querySelector("#groxy-generator-tokens").children.length > 0);
  assert.ok(root.querySelector("#groxy-generator-tree").textContent.includes("<Section>"));

  domAudit = auditDom(root, doc);
  assert.equal(domAudit.divCount, 0);
  assert.equal(domAudit.innerHTMLWriteCount, 0);
  assert.equal(domAudit.headingOrderOk, true);
  assert.equal(domAudit.missingAltImages, 0);
  assert.deepEqual(domAudit.unsafeUrls, []);
  assert.deepEqual(domAudit.inlineHandlers, []);

  // Discard Preview locally without touching /apply
  root.querySelector("#groxy-discard-gen-btn").dispatchEvent({ type: "click" });
  assert.equal(applyCalls, 0);
  assert.equal(handle.getGeneratorState(), null);
  assert.ok(root.querySelector("#groxy-gen-notice").textContent.includes("Discarded"));

  // Switch to Full Landing Page and generate, inspect DOM safety, then Approve & Dispatch
  blueprintSel.value = "full_landing_page";
  blueprintSel.dispatchEvent({ type: "change" });
  const preview2 = await handle.triggerGeneratePreview();
  assert.ok(preview2);
  assert.equal(generateCalls, 2);

  domAudit = auditDom(root, doc);
  assert.equal(domAudit.divCount, 0);
  assert.equal(domAudit.innerHTMLWriteCount, 0);
  assert.equal(domAudit.headingOrderOk, true);
  assert.equal(domAudit.missingAltImages, 0);
  assert.deepEqual(domAudit.unsafeUrls, []);
  assert.deepEqual(domAudit.inlineHandlers, []);

  const applyRes = await handle.approveGeneratedLayout();
  assert.equal(applyCalls, 1);
  assert.equal(applyRes.approved, true);
  assert.equal(applyRes.actor, "groxy-ai");
  assert.equal(applyRes.command_stack_action, "applyAiLayout");
  assert.equal(applyRes.status_enforced, "draft");
  assert.equal(lastApplyBody.generation_id, preview2.generation_id);
  assert.equal(lastApplyBody.approval_token, preview2.approval_token);

  const approveNotice = root.querySelector("#groxy-gen-notice").textContent;
  assert.ok(approveNotice.includes("Approved"));
  assert.ok(approveNotice.includes("groxy-ai"));
  assert.ok(approveNotice.includes("applyAiLayout"));
  assert.ok(approveNotice.includes("draft"));

  domAudit = auditDom(root, doc);
  assert.equal(domAudit.divCount, 0);
  assert.equal(domAudit.innerHTMLWriteCount, 0);

  handle.dispose();
});

test("v0.4.0 Semantic Studio UI Panels render Site Context, Link Graph, JSON-LD, Media Alt Queue, and Morning Digest with zero divs and full a11y", async () => {
  const { doc, root } = createDomDocument({ csrfToken: "csrf-v040-ui" });

  const handle = mountGroxyDashboard({
    root,
    document: doc,
    csrfToken: "csrf-v040-ui",
  });

  // All 8 Style Packs listed by default; filtering narrows dynamically
  const packSel = root.querySelector("#groxy-gen-style-pack");
  assert.equal(packSel.children.length, 8);
  const goalSel = root.querySelector("#groxy-gen-goal-filter");
  goalSel.value = "saas";
  goalSel.dispatchEvent({ type: "change" });
  assert.equal(packSel.children.length, 1);
  assert.equal(packSel.value, "obsidian-tech");
  goalSel.value = "";
  goalSel.dispatchEvent({ type: "change" });
  assert.equal(packSel.children.length, 8);

  // Verify Site Context sync & Site DNA export
  const syncRes = await handle.syncSiteContext();
  assert.equal(syncRes.ok, true);
  assert.ok(root.querySelector("#groxy-site-context-preview").textContent.includes("# SITE-CONTEXT.md"));
  const dna = await handle.exportSiteDna();
  assert.equal(dna.schema_version, "0.4.0");
  assert.ok(dna.compatible_consumers.includes("gashboard"));
  assert.ok(root.querySelector("#groxy-site-dna-preview").textContent.includes("groxy-site-dna-v0.4.0"));

  // Verify Read-Only Link Graph Panel excludes 301 loops
  const linkRep = await handle.analyzeLinks();
  assert.equal(linkRep.mutates_live_cms, false);
  const linksSummary = root.querySelector("#groxy-links-summary").textContent;
  assert.ok(linksSummary.includes("301 Loops Excluded"));
  assert.ok(linksSummary.includes("/loop-alpha"));

  // Verify Schema.org JSON-LD Preview Panel (exact price + XSS escaping)
  const schemaPreview = await handle.generateSchemaPreview();
  assert.equal(schemaPreview.xss_safe, true);
  assert.ok(root.querySelector("#groxy-schema-preview").textContent.includes('"@type": "Product"'));
  assert.ok(root.querySelector("#groxy-schema-status").textContent.includes("ADR-025c Price Verified: Yes"));

  // Verify Media Alt Queue + single-use approval + decorative preservation
  const app1 = await handle.approveSelectedMediaAlt();
  assert.equal(app1.ok, true);
  assert.equal(app1.approved_count, 2);
  assert.ok(root.querySelector("#groxy-media-approval-status").textContent.includes("Single-use token consumed"));

  // Verify Nightly Watch Digest
  const dig = await handle.runNightlyWatch();
  assert.equal(dig.popups, false);
  assert.equal(dig.silent_edits, false);
  assert.ok(root.querySelector("#groxy-watch-score").textContent.includes("Morning Boost Report"));

  const domAudit = auditDom(root, doc);
  assert.equal(domAudit.divCount, 0);
  assert.equal(domAudit.innerHTMLWriteCount, 0);
  assert.deepEqual(domAudit.unlabeledControls, []);
  assert.equal(domAudit.headingOrderOk, true);
  assert.equal(domAudit.missingAltImages, 0);
  assert.deepEqual(domAudit.unsafeUrls, []);
  assert.deepEqual(domAudit.inlineHandlers, []);

  handle.dispose();
});
