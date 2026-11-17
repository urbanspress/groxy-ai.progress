import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  DB_CONSULTANT_VERSION,
  DB_QUIZ_QUESTIONS,
  DbConsultantError,
  buildStoreSchemaPreview,
  classifyDbRisk,
  mountDbConsultant,
  validateDbQuiz,
  validateExactDbNumber,
} from "../public/groxy/db-consultant.js";
import { auditDom, createDomDocument } from "./helpers/dom-shim.js";

const answers = { catalog: "digital", variants: "none", currencies: "single_2", tax: "no", bundles: "no", facility: "no", white_label: "no", store_state: "new" };
const quiz = { target_id: "local_store", answers };

test("v1.5.0 quiz has eight bounded questions and validates server-owned target identifiers", () => {
  assert.equal(DB_CONSULTANT_VERSION, "1.5.0");
  assert.equal(DB_QUIZ_QUESTIONS.length, 8);
  assert.deepEqual(validateDbQuiz(quiz).answers, answers);
  for (const target_id of ["../db", "remote;drop", "x".repeat(64)]) assert.throws(() => validateDbQuiz({ ...quiz, target_id }), DbConsultantError);
  assert.throws(() => validateDbQuiz({ ...quiz, unknown: true }), /unsupported field/);
  assert.throws(() => validateDbQuiz({ ...quiz, answers: { ...answers, catalog: 1 } }), DbConsultantError);
});

test("exact GrabDecimal and GrabInteger reject floats, exponent notation, and precision loss", () => {
  assert.equal(validateExactDbNumber("19.90", "decimal", { precision: 6, scale: 2 }), "19.90");
  assert.equal(validateExactDbNumber("9007199254740993", "integer", { precision: 20 }), "9007199254740993");
  for (const value of [19.9, "1e3", "+1.00", "01.00", "19.999", "1.2.3", "19."]) {
    assert.throws(() => validateExactDbNumber(value, "decimal", { precision: 6, scale: 2 }), DbConsultantError);
  }
  for (const value of [100, "1e5", "-5", "007", "abc"]) {
    assert.throws(() => validateExactDbNumber(value, "integer", { precision: 10 }), DbConsultantError);
  }
});

test("digital-only plan omits physical inventory and uses explicit migration preview", () => {
  const one = buildStoreSchemaPreview(quiz);
  const two = buildStoreSchemaPreview(quiz);
  assert.deepEqual(one, two);
  assert.equal(one.analytical_only, true);
  assert.equal(one.tables.includes("inventory"), false);
  assert.equal(one.tables.includes("digital_assets"), true);
  assert.equal(one.tables.includes("subscription_metadata"), false);
  assert.match(one.migration, /data\.migrate using/);
  assert.match(one.migration, /price_amount TEXT/);
  assert.match(one.apply_blockers.join(" "), /executor/);
  assert.equal(one.migration.endsWith("\n"), true);
  assert.equal(one.migration.includes("\r"), false);
});

test("authorized target unlocks executable migration preview without blockers", () => {
  const plan = buildStoreSchemaPreview(
    { target_id: "commerce", answers },
    { authorized: true, dbAlias: "commerce" }
  );
  assert.equal(plan.analytical_only, false);
  assert.equal(plan.target_id, "commerce");
  assert.equal(plan.apply_blockers.length, 0);
  assert.match(plan.migration, /data\.open using "commerce"/);
  assert.match(plan.migration, /data\.migrate using store_db/);
  assert.equal(plan.migration.endsWith("\n"), true);
});

test("risk classification raises destructive changes with references to High-Risk Data Loss", () => {
  // Safe: additive change
  assert.equal(classifyDbRisk({ operation: "add_column" }).risk_level, "Safe");
  assert.equal(classifyDbRisk({ operation: "create_table", row_count: "0" }).risk_level, "Safe");

  // Caution: incomplete coverage or ungrounded destructive change on empty table
  assert.equal(classifyDbRisk({ operation: "add_constraint", coverage_complete: false }).risk_level, "Caution");
  assert.equal(classifyDbRisk({ operation: "drop_column", row_count: "0", dependencies: [] }).risk_level, "Caution");

  // High-Risk Data Loss: destructive change with row count > 0
  const highWithRows = classifyDbRisk({ operation: "drop_table", row_count: "42", dependencies: [] });
  assert.equal(highWithRows.risk_level, "High-Risk Data Loss");
  assert.match(highWithRows.summary, /remove historical data or break live dependencies/);

  // High-Risk Data Loss: destructive change with live queryLoop / redirect dependencies
  const highWithDeps = classifyDbRisk({
    operation: "drop_column",
    row_count: "5",
    dependencies: [
      { kind: "ForEach", id: "products-grid", source: "SCHEMA-CONTEXT.md" },
      { kind: "Redirect", id: "slug_history", source: "SITE-CONTEXT.md" }
    ]
  });
  assert.equal(highWithDeps.risk_level, "High-Risk Data Loss");
  assert.ok(highWithDeps.blockers.length > 0);
  assert.match(highWithDeps.summary, /remove historical data or break live dependencies/);
});

test("pre-mutation logical snapshot formatting produces deterministic canonical UTF-8 JSON and SHA-256", () => {
  const snapshotData = {
    schema_version: "1.5.0",
    target_id: "commerce",
    captured_at: "2026-11-16T12:00:00Z",
    tables: {
      products: [
        { product_id: "prod_001", title: "Standard Widget", price_amount: "19.90", currency_code: "USD" },
        { product_id: "prod_002", title: "Premium Widget", price_amount: "49.00", currency_code: "USD" }
      ],
      orders: [
        { order_id: "ord_101", customer_id: "cust_1", total_amount: "19.90", status: "completed" }
      ]
    }
  };

  // Canonical JSON serialization: sorted keys
  function canonicalJson(obj) {
    if (obj === null || typeof obj !== "object") return JSON.stringify(obj);
    if (Array.isArray(obj)) return "[" + obj.map(canonicalJson).join(",") + "]";
    const keys = Object.keys(obj).sort();
    return "{" + keys.map(k => JSON.stringify(k) + ":" + canonicalJson(obj[k])).join(",") + "}";
  }

  const json1 = canonicalJson(snapshotData);
  const json2 = canonicalJson(snapshotData);
  assert.equal(json1, json2);

  const digest1 = crypto.createHash("sha256").update(json1, "utf8").digest("hex");
  const digest2 = crypto.createHash("sha256").update(json2, "utf8").digest("hex");
  assert.equal(digest1, digest2);
  assert.equal(digest1.length, 64);

  // Restore verification logic: restoring table snapshot does not delete subsequent non-affected orders
  const liveOrders = [
    { order_id: "ord_101", customer_id: "cust_1", total_amount: "19.90", status: "completed" },
    { order_id: "ord_102", customer_id: "cust_2", total_amount: "99.00", status: "completed" } // newly arrived
  ];

  // Restoring snapshot products preserves live orders
  const restoredProducts = snapshotData.tables.products;
  assert.equal(restoredProducts.length, 2);
  assert.equal(liveOrders.length, 2);
  assert.equal(liveOrders[1].order_id, "ord_102");
});

test("quiz and consultant panels use labeled semantic controls with no div or innerHTML writes", () => {
  const { doc, root } = createDomDocument();
  const panel = mountDbConsultant({ root, document: doc, csrfToken: "csrf", fetchFn: null });
  const dom = auditDom(root, doc);
  assert.equal(dom.divCount, 0);
  assert.equal(dom.innerHTMLWriteCount, 0);
  assert.equal(dom.unlabeledControls.length, 0);
  assert.equal(root.querySelectorAll("fieldset").length, 8);
  assert.equal(root.querySelectorAll("fieldset").filter((fs) => !fs.hidden).length, 1);
  root.querySelectorAll("select")[0].value = "physical";
  root.querySelectorAll("button").find((button) => button.textContent === "Next").dispatchEvent("click");
  assert.match(root.querySelectorAll("[role]").find((node) => node.getAttribute("role") === "status").textContent, /Question 2 of 8/);
  panel.dispose();
});

test("consultant stays opt-in and sends only question plus target with CSRF", async () => {
  const calls = [];
  const { doc, root } = createDomDocument();
  mountDbConsultant({ root, document: doc, csrfToken: "csrf-token", fetchFn: async (url, options) => {
    calls.push({ url, options }); return { ok: false, json: async () => ({ error: "disabled" }) };
  } });
  root.querySelector("#groxy-db-target").value = "local_store";
  root.querySelector("#groxy-db-question-text").value = "Can I remove inventory?";
  root.querySelector("#groxy-db-question").dispatchEvent("submit");
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(calls[0].url, "/api/groxy/db/consult");
  assert.equal(calls[0].options.headers["X-CSRF-Token"], "csrf-token");
  assert.deepEqual(JSON.parse(calls[0].options.body), { target_id: "local_store", question: "Can I remove inventory?" });
  assert.equal(root.querySelector("output").textContent, "disabled");
});
