import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { assertExactMoney, canonicalJson, generateEmailFlow, mountEmailFlowStudio } from "../public/groxy/email-flows.js";
import { createVisionClient, assertAllowedNetworkUrl, GroxyMcpError } from "../public/groxy/mcp-client.js";
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

test("canonical JSON recursively sorts objects, preserves array order, and matches UTF-8 digest fixture", async () => {
  const fixture = { z: [{ y: "café", a: "19.90" }, { b: 2, a: 1 }], a: { d: true, c: null } };
  const canonical = '{"a":{"c":null,"d":true},"z":[{"a":"19.90","y":"café"},{"a":1,"b":2}]}';
  assert.equal(canonicalJson(fixture), canonical);
  const source = await readFile(new URL("../src/groxy.grab", import.meta.url), "utf8");
  assert.match(source, /make canonical_json using value/);
  assert.match(source, /set canonical to canonical_json using immutable/);
  assert.match(source, /crypto\.sha256_hex using \(canonical_json using immutable\)/);
});

test("email-flow provider fallback and BYOK SSRF rejection stay explicit", async () => {
  const offline = createVisionClient({ fetchImpl: async () => { throw new Error("offline"); } });
  const fallback = await offline.analyze({ provider: "ollama", screenshot_base64: "eA==" });
  assert.equal(fallback.provider_used, "deterministic");
  assert.equal(fallback.fallback_used, true);
  assert.throws(() => assertAllowedNetworkUrl("https://169.254.169.254/latest/meta-data", ["169.254.169.254"]), (err) => err instanceof GroxyMcpError && err.code === "GRAB-E402");
  const source = await readFile(new URL("../src/groxy.grab", import.meta.url), "utf8");
  assert.match(source, /GROXY_EMAIL_FLOWS_BYOK_URL/);
  assert.match(source, /code: "GRAB-E402"/);
});

test("email-flow approval uses an atomic single-winner gate before CMS dispatch", async () => {
  const source = await readFile(new URL("../src/groxy.grab", import.meta.url), "utf8");
  const consume = source.indexOf('cache.limit using groxy_cache, ("email-flow-consume:" joined with flow_id)');
  const dispatch = source.indexOf('call_cms_mcp_tool using cms_url, cms_token, "create_entry_draft", args, 302');
  assert.ok(consume >= 0 && dispatch > consume, "atomic cache limit must be acquired before create_entry_draft");
  assert.match(source.slice(consume, dispatch), /FLOW_APPROVAL_REPLAY/);
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
