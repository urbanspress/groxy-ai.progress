/**
 * Groxy AI v1.5.0 — offline-first store schema planning and consultant panel.
 * Domain values remain strings; this module never executes SQL or mutates a DB.
 */
export const DB_CONSULTANT_VERSION = "1.5.0";
export const GROXY_VERSION = "1.8.0";
export const DB_QUIZ_QUESTIONS = Object.freeze([
  { id: "catalog", title: "What do you sell?", choices: ["physical", "digital", "subscription", "mixed"], help: "Controls catalog extensions. Subscription metadata does not enable billing." },
  { id: "variants", title: "Do products have variants?", choices: ["none", "variants", "variants_inventory"], help: "Inventory is added only when variants and stock tracking are selected." },
  { id: "currencies", title: "Which currency and price scales do you need?", choices: ["single_2", "single_0", "multiple"], help: "Currency and exact decimal scale are stored as text-safe decimal values." },
  { id: "tax", title: "Do you need to record operator-supplied tax rules?", choices: ["no", "yes", "unknown"], help: "Groxy records supplied rates only; it does not determine tax obligations." },
  { id: "bundles", title: "Do you offer bundles or discount tiers?", choices: ["no", "fixed", "percentage"], help: "No bundle tables are added unless selected." },
  { id: "facility", title: "Do facility fulfillment flags apply?", choices: ["no", "yes", "unknown"], help: "Unknown requirements remain unresolved; no eligibility rules are inferred." },
  { id: "white_label", title: "Do you need white-label partner references?", choices: ["no", "yes"], help: "Stores partner references only; it does not trigger fulfillment." },
  { id: "store_state", title: "Is this a new store or an existing store?", choices: ["new", "existing"], help: "Existing schemas must be inspected before an executable plan can be staged." },
]);

const ID = /^[A-Za-z_][A-Za-z0-9_]{0,62}$/;
const DECIMAL = /^(?:0|[1-9]\d*)(?:\.\d+)?$/;
const INTEGER = /^(?:0|[1-9]\d*)$/;
const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

export class DbConsultantError extends Error {
  constructor(code, message, status = 422) { super(message); this.name = "DbConsultantError"; this.code = code; this.status = status; }
}

export function validateDbQuiz(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new DbConsultantError("OBJECT_REQUIRED", "Answer the store quiz.");
  const allowed = new Set(["target_id", "answers", "generation_mode"]);
  if (Object.keys(input).some((key) => !allowed.has(key))) throw new DbConsultantError("UNKNOWN_FIELD", "The quiz contains an unsupported field.");
  if (typeof input.target_id !== "string" || !ID.test(input.target_id)) throw new DbConsultantError("TARGET_REQUIRED", "Choose a configured database target.");
  if (!input.answers || typeof input.answers !== "object" || Array.isArray(input.answers)) throw new DbConsultantError("ANSWERS_REQUIRED", "Answer all eight questions.");
  const expected = DB_QUIZ_QUESTIONS.map((q) => q.id);
  if (Object.keys(input.answers).length !== expected.length || expected.some((key) => !own(input.answers, key))) throw new DbConsultantError("EIGHT_ANSWERS_REQUIRED", "Answer all eight questions.");
  const answers = {};
  for (const q of DB_QUIZ_QUESTIONS) {
    if (typeof input.answers[q.id] !== "string" || !q.choices.includes(input.answers[q.id])) throw new DbConsultantError("INVALID_ANSWER", `Choose a listed answer for ${q.title}.`);
    answers[q.id] = input.answers[q.id];
  }
  const generation_mode = input.generation_mode ?? "deterministic";
  if (!new Set(["deterministic", "ollama", "byok"]).has(generation_mode)) throw new DbConsultantError("INVALID_MODE", "Choose deterministic, ollama, or byok.");
  return { target_id: input.target_id, answers, generation_mode };
}

export function validateExactDbNumber(value, kind, { precision = 18, scale = 2 } = {}) {
  if (typeof value !== "string") throw new DbConsultantError("ADR-025c", "Numeric database values must be exact base-10 strings.");
  const pattern = kind === "integer" ? INTEGER : DECIMAL;
  if (!pattern.test(value)) throw new DbConsultantError("ADR-025c", "Exponent notation, signs, and non-canonical numeric values are not accepted.");
  const [whole, fraction = ""] = value.split(".");
  if (whole.length + fraction.length > precision || (kind !== "integer" && fraction.length > scale)) throw new DbConsultantError("ADR-025c", "The exact numeric value exceeds the declared precision or scale.");
  return value;
}

function col(name, type, extra = "") { return `    ${name} ${type}${extra}`; }
const decimalCol = (name, precision = 18, scale = 2, required = true) => ({
  sql: col(name, "TEXT", `${required ? " NOT NULL" : ""} CHECK (${name} <> '' AND ${name} NOT GLOB '*[^0-9.]*' AND ${name} NOT GLOB '*.*.*' AND ${name} NOT GLOB '.*' AND ${name} NOT GLOB '*.' AND length(${name}) - length(replace(${name}, '.', '')) <= 1 AND (instr(${name}, '.') = 0 OR length(${name}) - instr(${name}, '.') <= ${scale}))`),
  definition: { name, grab_type: "GrabDecimal", precision, scale, nullable: !required, default: null, sqlite_storage: "TEXT exact base-10 wire string" },
});
const integerCol = (name, precision = 19, required = true) => ({
  sql: col(name, "TEXT", `${required ? " NOT NULL" : ""} CHECK (${name} <> '' AND ${name} NOT GLOB '*[^0-9]*' AND ${name} NOT GLOB '0[0-9]*')`),
  definition: { name, grab_type: "GrabInteger", precision, scale: 0, nullable: !required, default: null, sqlite_storage: "TEXT exact base-10 integer string" },
});
function table(name, columns) { if (!ID.test(name)) throw new DbConsultantError("INVALID_IDENTIFIER", "Unsafe schema identifier."); return `CREATE TABLE ${name} (\n${columns.join(",\n")}\n);`; }

/** Produces a minimal analytical plan. Existing target inspection is a server responsibility. */
export function buildStoreSchemaPreview(raw, { authorized = false, dbAlias = "commerce" } = {}) {
  const { target_id, answers } = validateDbQuiz(raw);
  const steps = [];
  const tables = [];
  const numeric_columns = [];
  const decimal = (name, p = 18, s = 2) => { const item = decimalCol(name, p, s); numeric_columns.push(item.definition); return item.sql; };
  const integer = (name, p = 19) => { const item = integerCol(name, p); numeric_columns.push(item.definition); return item.sql; };
  const addTable = (name, columns) => { tables.push(name); steps.push(table(name, columns)); };
  addTable("products", [col("product_id", "TEXT", " PRIMARY KEY"), col("name", "TEXT", " NOT NULL"), col("sku", "TEXT"), decimal("price_amount"), col("currency_code", "TEXT", " NOT NULL CHECK (length(currency_code) = 3)")]);
  addTable("orders", [col("order_id", "TEXT", " PRIMARY KEY"), col("currency_code", "TEXT", " NOT NULL"), decimal("total_amount"), col("created_at", "TEXT", " NOT NULL")]);
  addTable("order_lines", [col("order_line_id", "TEXT", " PRIMARY KEY"), col("order_id", "TEXT", " NOT NULL REFERENCES orders(order_id)"), col("product_id", "TEXT", " NOT NULL REFERENCES products(product_id)"), integer("quantity"), decimal("unit_amount")]);
  const omitted = [];
  if (["physical", "mixed"].includes(answers.catalog) && answers.variants === "variants_inventory") addTable("inventory", [col("inventory_id", "TEXT", " PRIMARY KEY"), col("product_id", "TEXT", " NOT NULL REFERENCES products(product_id)"), integer("quantity_on_hand")]);
  else omitted.push("inventory: no physical stock tracking was selected");
  if (answers.variants !== "none") addTable("product_variants", [col("variant_id", "TEXT", " PRIMARY KEY"), col("product_id", "TEXT", " NOT NULL REFERENCES products(product_id)"), col("sku", "TEXT")]); else omitted.push("product_variants: no variants selected");
  if (["digital", "mixed"].includes(answers.catalog)) addTable("digital_assets", [col("asset_id", "TEXT", " PRIMARY KEY"), col("product_id", "TEXT", " NOT NULL REFERENCES products(product_id)"), col("asset_ref", "TEXT", " NOT NULL")]); else omitted.push("digital_assets: no digital goods selected");
  if (["subscription", "mixed"].includes(answers.catalog)) addTable("subscription_metadata", [col("product_id", "TEXT", " PRIMARY KEY REFERENCES products(product_id)"), col("plan_label", "TEXT"), col("interval_label", "TEXT")]); else omitted.push("subscription_metadata: no subscription products selected");
  if (answers.currencies === "multiple") addTable("currency_rules", [col("currency_code", "TEXT", " PRIMARY KEY"), integer("minor_unit_scale", 1)]); else omitted.push("currency_rules: one currency selected");
  if (answers.tax === "yes") addTable("operator_tax_rules", [col("tax_rule_id", "TEXT", " PRIMARY KEY"), col("jurisdiction_label", "TEXT", " NOT NULL"), decimal("rate_percent", 7, 4), col("inclusive", "TEXT", " NOT NULL")]); else omitted.push("operator_tax_rules: not selected or requirements unknown");
  if (answers.bundles !== "no") addTable("bundles", [col("bundle_id", "TEXT", " PRIMARY KEY"), col("label", "TEXT", " NOT NULL")]); else omitted.push("bundles: no bundles or discount tiers selected");
  if (answers.facility === "yes") addTable("facility_fulfillment_flags", [col("order_id", "TEXT", " PRIMARY KEY REFERENCES orders(order_id)"), col("operator_flag", "TEXT", " NOT NULL")]); else omitted.push("facility_fulfillment_flags: not selected; unknown requirements remain unresolved");
  if (answers.white_label === "yes") addTable("white_label_partners", [col("partner_id", "TEXT", " PRIMARY KEY"), col("partner_ref", "TEXT", " NOT NULL")]); else omitted.push("white_label_partners: not selected");
  const targetName = authorized ? dbAlias : "configured_target";
  const isCommerceTarget = authorized && (dbAlias === "commerce" || target_id === "commerce");
  const baseMigrations = isCommerceTarget
    ? `record {version: 1, name: "create_commerce_approval_ledger", steps: ["CREATE TABLE groxy_commerce_plans (plan_id TEXT PRIMARY KEY, engine TEXT NOT NULL, target_slot TEXT NOT NULL, payload_sha256 TEXT NOT NULL, payload_json TEXT NOT NULL, token_verifier TEXT NOT NULL, operator_id TEXT NOT NULL, site_id TEXT NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL, expires_at TEXT NOT NULL, outcome_json TEXT NOT NULL)"]}, record {version: 2, name: "create_db_consultant_ledger", steps: ["CREATE TABLE db_consultant_ledger (plan_id TEXT PRIMARY KEY, target_id TEXT NOT NULL, origin TEXT NOT NULL, migration_sha256 TEXT NOT NULL, payload_sha256 TEXT NOT NULL, payload_json TEXT NOT NULL, token_verifier TEXT NOT NULL, operator_id TEXT NOT NULL, site_id TEXT NOT NULL, status TEXT NOT NULL, risk_level TEXT NOT NULL, risk_acknowledged INTEGER NOT NULL, created_at TEXT NOT NULL, expires_at TEXT NOT NULL, outcome_json TEXT NOT NULL)", "CREATE TABLE db_target_locks (target_id TEXT PRIMARY KEY, locked_by_plan TEXT NOT NULL, locked_at TEXT NOT NULL)"]}, `
    : "";
  const versionNum = isCommerceTarget ? 3 : 1;
  const migration = `use data\n\nset store_db to data.open using "${targetName}"\nset result to data.migrate using store_db, [${baseMigrations}record {version: ${versionNum}, name: "groxy_store_schema_v1", steps: [${steps.map((s) => JSON.stringify(s)).join(", ")}]}]\nshow result\n`;
  const canonicalMigration = migration.replace(/\r\n?/g, "\n").replace(/\n*$/, "\n");
  const diffBefore = authorized ? "Unchanged; live schema inspected." : "Unchanged; the target has not been inspected.";
  return { target_id, origin: "architect-quiz", rule_version: "store-schema-rules-1", answers, tables, omitted, numeric_columns, steps, migration: canonicalMigration, diff: { before: diffBefore, after: `Proposed tables: ${tables.join(", ")}.` }, apply_blockers: authorized ? [] : ["No authorized target registry or live schema evidence is configured; this is an analytical preview only.", "No verified snapshot and database mutation executor is configured; apply remains blocked."], analytical_only: !authorized };
}

export function classifyDbRisk({ operation = "inspect", row_count = "0", dependencies = [], coverage_complete = true } = {}) {
  const count = typeof row_count === "string" && INTEGER.test(row_count) ? row_count : null;
  const destructive = ["drop_table", "drop_column", "rename_column", "delete", "narrow_precision"].includes(operation);
  const hasDependencies = Array.isArray(dependencies) && dependencies.length > 0;
  const unknown = !coverage_complete || count === null || !Array.isArray(dependencies);
  const risk_level = destructive && (hasDependencies || count !== "0" || unknown) ? "High-Risk Data Loss" : destructive || unknown ? "Caution" : "Safe";
  return { risk_level, summary: risk_level === "Safe" ? "Inspected additive change with no detected dependencies." : risk_level === "Caution" ? "Operational care or more complete evidence is required." : "This change may remove historical data or break live dependencies.", findings: [{ rule_id: "DB-RISK-001", evidence: { operation, row_count: count ?? "unknown", dependencies: dependencies ?? [], coverage_complete }, certainty: unknown ? "incomplete" : "observed" }], blockers: unknown || (destructive && hasDependencies) ? [unknown ? "Inspection coverage is incomplete; executable planning is blocked." : "Resolve referenced live dependencies before applying this change."] : [], potential_data_loss: destructive ? "Affected rows or schema meaning may be lost." : "None identified.", alternatives: destructive ? ["Prefer additive replacement and a separately reviewed backfill."] : [], recovery_limitations: "A snapshot does not make later human writes safe to overwrite." };
}

const append = (doc, parent, tag, attrs = {}, content = "") => { const node = doc.createElement(tag); for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v)); node.textContent = content; parent.appendChild(node); return node; };

/** Eight-step semantic quiz and opt-in consultant. All untrusted text is textContent. */
export function mountDbConsultant({ root, document: doc = globalThis.document, csrfToken = "", fetchFn = globalThis.fetch } = {}) {
  if (!root || !doc) throw new TypeError("A root and document are required.");
  const section = append(doc, root, "section", { id: "groxy-db-consultant", class: "groxy-db-consultant grex-c-card", "aria-labelledby": "groxy-db-heading" });
  append(doc, section, "h2", { id: "groxy-db-heading" }, "Store Schema Architect & Talk to Groxy");
  append(doc, section, "p", {}, "Create an offline schema preview or ask for a read-only impact assessment. Database changes always require a separate reviewed approval.");
  const form = append(doc, section, "form", { id: "groxy-db-quiz" }); form.noValidate = true;
  const targetId = "groxy-db-target"; append(doc, form, "label", { for: targetId }, "Configured database target ID");
  const target = append(doc, form, "input", { id: targetId, name: "target_id", required: "required", maxlength: "63", pattern: "[A-Za-z_][A-Za-z0-9_]{0,62}" });
  const sets = DB_QUIZ_QUESTIONS.map((q, i) => {
    const fs = append(doc, form, "fieldset", { hidden: i !== 0 }); append(doc, fs, "legend", {}, `${i + 1}. ${q.title}`); append(doc, fs, "p", {}, q.help);
    const id = `groxy-db-answer-${q.id}`; append(doc, fs, "label", { for: id }, "Choose an answer"); const select = append(doc, fs, "select", { id, name: q.id, required: "required" });
    append(doc, select, "option", { value: "" }, "Select one"); for (const choice of q.choices) append(doc, select, "option", { value: choice }, choice.replaceAll("_", " "));
    return fs;
  });
  const progress = append(doc, form, "p", { role: "status", "aria-live": "polite" }, "Question 1 of 8");
  const nav = append(doc, form, "nav", { "aria-label": "Store schema quiz navigation" }); const prev = append(doc, nav, "button", { id: "groxy-db-previous", type: "button" }, "Previous"); const next = append(doc, nav, "button", { id: "groxy-db-next", type: "button" }, "Next");
  const submit = append(doc, form, "button", { type: "submit" }, "Build migration preview");
  const err = append(doc, form, "p", { role: "alert", id: "groxy-db-error" }); const result = append(doc, section, "section", { "aria-labelledby": "groxy-db-preview-heading" }); append(doc, result, "h3", { id: "groxy-db-preview-heading" }, "Plan review"); const preview = append(doc, result, "pre", { "aria-live": "polite" });
  let step = 0; const draw = () => { sets.forEach((fs, i) => { fs.hidden = i !== step; }); progress.textContent = `Question ${step + 1} of 8`; prev.hidden = step === 0; next.hidden = step === 7; submit.hidden = step !== 7; }; draw();
  prev.addEventListener("click", () => { step = Math.max(0, step - 1); draw(); sets[step].querySelector("select")?.focus?.(); });
  next.addEventListener("click", () => { const select = sets[step].querySelector("select"); if (!select.value) { err.textContent = "Choose an answer before continuing."; select.focus?.(); return; } err.textContent = ""; step = Math.min(7, step + 1); draw(); sets[step].querySelector("select")?.focus?.(); });
  form.addEventListener("keydown", (event) => { if (event.key === "Escape") { step = 0; draw(); sets[0].querySelector("select")?.focus?.(); } });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      if (!sets.every((fs) => fs.querySelector("select").value)) throw new DbConsultantError("EIGHT_ANSWERS_REQUIRED", "Answer all eight questions.");
      const body = validateDbQuiz({ target_id: target.value, answers: Object.fromEntries(DB_QUIZ_QUESTIONS.map((q) => [q.id, sets.find((fs) => fs.querySelector(`select[name="${q.id}"]`))?.querySelector("select").value])) });
      const analytical = buildStoreSchemaPreview(body);
      preview.textContent = `${analytical.diff.after}\n\nOmitted modules:\n${analytical.omitted.map((x) => `• ${x}`).join("\n")}\n\nMigration preview:\n${analytical.migration}\n\nApply blockers:\n${analytical.apply_blockers.map((x) => `• ${x}`).join("\n")}`;
      if (typeof fetchFn === "function") {
        const response = await fetchFn("/api/groxy/db/architect-quiz", { method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken }, body: JSON.stringify(body) });
        const data = await response.json(); if (!response.ok) throw new DbConsultantError(data.code || "PLAN_FAILED", data.error || "The schema plan could not be staged.", response.status);
        preview.textContent = JSON.stringify(data, null, 2);
      }
      err.textContent = "";
    } catch (e) { err.textContent = e.message; }
  });
  const consultantForm = append(doc, section, "form", { id: "groxy-db-question" });
  append(doc, consultantForm, "label", { for: "groxy-db-question-text" }, "Ask Groxy about your database (consultant must be enabled)");
  const question = append(doc, consultantForm, "textarea", { id: "groxy-db-question-text", maxlength: "4000", required: "required" });
  const ask = append(doc, consultantForm, "button", { type: "submit" }, "Ask read-only consultant");
  const consultOutput = append(doc, section, "output", { "aria-live": "polite" });
  consultantForm.addEventListener("submit", async (event) => { event.preventDefault(); if (!target.value || !question.value.trim()) { consultOutput.textContent = "Choose a configured target and enter a question."; return; }
    if (typeof fetchFn !== "function") { consultOutput.textContent = "Read-only consultation requires the configured server."; return; }
    ask.disabled = true; try { const response = await fetchFn("/api/groxy/db/consult", { method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken }, body: JSON.stringify({ target_id: target.value, question: question.value }) }); const data = await response.json(); consultOutput.textContent = response.ok ? JSON.stringify(data, null, 2) : (data.error || "Consultant is disabled or unavailable."); } catch { consultOutput.textContent = "The read-only consultant is unavailable."; } finally { ask.disabled = false; }
  });
  return { section, dispose: () => section.parentNode?.removeChild(section) };
}
