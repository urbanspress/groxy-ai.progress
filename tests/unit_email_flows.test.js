import test from "node:test";
import assert from "node:assert/strict";
import { assertExactMoney, canonicalJson, generateEmailFlow, mountEmailFlowStudio } from "../public/groxy/email-flows.js";
import { auditDom, createDomDocument } from "./helpers/dom-shim.js";

const brand_dna = { schema: "brand-dna.v1", revision: 7, business_name: "North Star Studio", prices: { default: "19.90" }, currency: "USD" };
const site_context = { site_name: "North Star", products: [{ name: "Scale", price: "19.90" }] };

test("email flow creates four ordered brand-grounded messages with required footers", () => {
  const flow = generateEmailFlow({ brief: "Help customers get started", brand_dna, site_context, products: [{ name: "Scale", price: "19.90" }] });
  assert.equal(flow.step_count, 4);
  assert.deepEqual(flow.steps.map((step) => step.sequence), [1, 2, 3, 4]);
  assert.match(flow.steps[0].plain_text, /North Star Studio/);
  assert.match(flow.steps[0].plain_text, /{{unsubscribe_url}}/);
  assert.match(flow.steps[0].plain_text, /{{sender_postal_address}}/);
  assert.equal(flow.steps[0].layout.props["aria-label"], "Order Receipt & Welcome");
  assert.equal(flow.sending_enabled, false);
});

test("identical normalized input generates deterministic step content and canonical digest input", () => {
  const a = generateEmailFlow({ brief: "Help customers", brand_dna, site_context });
  const b = generateEmailFlow({ brief: "Help customers", brand_dna, site_context });
  assert.deepEqual(a.steps, b.steps);
  assert.equal(canonicalJson({ b: 1, a: 2 }), '{"a":2,"b":1}');
});

test("flow context is required and exact commercial values reject JavaScript numbers", () => {
  assert.throws(() => generateEmailFlow({ brand_dna }), { status: 409 });
  assert.equal(assertExactMoney("19.90"), "19.90");
  for (const value of [19.9, "1e3", "+1", "01.00"]) assert.throws(() => assertExactMoney(value));
});

test("email flow studio uses labeled semantic DOM without div or innerHTML writes", () => {
  const { doc, root } = createDomDocument();
  const studio = mountEmailFlowStudio({ root, document: doc, fetchFn: null });
  const safety = auditDom(root, doc);
  assert.equal(safety.divCount, 0);
  assert.equal(safety.innerHTMLWriteCount, 0);
  assert.equal(safety.unlabeledControls.length, 0);
  assert.equal(root.querySelector("#email-flow-designer") !== null, true);
  studio.dispose();
});
