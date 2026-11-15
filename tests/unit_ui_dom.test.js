import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { auditDom, createDomDocument } from "./helpers/dom-shim.js";
import { mountGroxyDashboard, SAMPLE_AUDIT_PRESETS } from "../public/groxy/dashboard.js";

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
