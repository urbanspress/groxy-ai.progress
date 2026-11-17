/** Groxy AI v1.3.0 — deterministic, draft-only post-purchase email flows. */
export const EMAIL_FLOWS_VERSION = "1.3.0";
export const GROXY_VERSION = "1.5.0";
const MONEY = /^(?:0|[1-9]\d*)(?:\.\d+)?$/;
const PURPOSES = ["Order Receipt & Welcome", "Quick-Start / Setup Guide", "Check-In & Review Request", "Targeted Cross-Sell / Reorder"];
const FOOTER = "Unsubscribe or manage preferences: {{unsubscribe_url}}\n{{sender_name}}\n{{sender_postal_address}}";
const fail = (message, code, status = 422) => Object.assign(new Error(message), { code, status });

export function assertExactMoney(value, field = "amount") {
  if (typeof value !== "string" || !MONEY.test(value)) throw fail(field + " must be an exact base-10 decimal string.", "DECIMAL_INVALID");
  return value;
}

export function canonicalJson(value) {
  if (Array.isArray(value)) return "[" + value.map(canonicalJson).join(",") + "]";
  if (value && typeof value === "object") return "{" + Object.keys(value).sort().map((key) => JSON.stringify(key) + ":" + canonicalJson(value[key])).join(",") + "}";
  return JSON.stringify(value);
}

export async function sha256(value, cryptoImpl = globalThis.crypto) {
  if (!cryptoImpl?.subtle) throw new Error("SHA-256 is unavailable.");
  const bytes = new TextEncoder().encode(typeof value === "string" ? value : canonicalJson(value));
  return [...new Uint8Array(await cryptoImpl.subtle.digest("SHA-256", bytes))].map((n) => n.toString(16).padStart(2, "0")).join("");
}

/** Deterministic templates keep missing facts as explicit merge fields. */
export function generateEmailFlow({ brief = "", brand_dna, site_context, products = [], order = {}, overrides = [], design_tokens = {}, flow_id = "flow_preview" } = {}) {
  if (!brand_dna || brand_dna.schema !== "brand-dna.v1" || !site_context) throw fail("Configure valid Brand DNA and synchronize SITE-CONTEXT.md before designing a flow.", "CONTEXT_REQUIRED", 409);
  if (typeof brief !== "string" || brief.length > 4000) throw fail("brief must be at most 4,000 characters.", "BRIEF_INVALID");
  for (const [key, value] of Object.entries({ ...(brand_dna.prices || {}), ...(order.amounts || {}) })) assertExactMoney(value, key);
  const name = typeof products[0]?.name === "string" ? products[0].name : "{{product_name}}";
  const related = typeof products[1]?.name === "string" ? products[1].name : "{{related_product_name}}";
  if (products[0]?.price !== undefined) assertExactMoney(products[0].price, "product_price");
  if (products[1]?.price !== undefined) assertExactMoney(products[1].price, "related_product_price");
  const business = brand_dna.business_name;
  const copies = [
    ["Thank you, {{customer_name}} — your order is received", "A note from " + business, "Thank you for choosing " + business + ". We have received your order for {{order_items}}. Order total: {{order_total}} {{currency}}.", "Order details"],
    ["Getting started with " + name, "Your first steps, from " + business, "Here is a place to begin with " + name + ": {{verified_setup_instructions}}. If you need a hand, {{support_contact}} can help.", "Quick-start guide"],
    ["How is everything going, {{customer_name}}?", "We are here if you need us", "We hope your " + name + " is proving useful. Reply to {{support_contact}} for help. If you have time, share an honest review at {{review_url}}.", "Check-in"],
    ["A next step you may find useful", "Selected for customers interested in " + name, "If it suits your needs, explore " + related + (products[1]?.price === undefined ? "" : " at " + assertExactMoney(products[1].price, "related_product_price") + " " + (brand_dna.currency || "USD")) + ". No offer or availability is implied.", "Explore related products"],
  ];
  const delays = ["immediate (draft suggestion)", "2 days after fulfillment (draft suggestion)", "7 days after fulfillment (draft suggestion)", "14 days after fulfillment (draft suggestion)"];
  const steps = PURPOSES.map((purpose, index) => {
    const copy = copies[index], override = overrides[index] || {};
    const subject = override.subject ?? copy[0], preheader = override.preheader ?? copy[1], body = override.plain_text ?? copy[2];
    if ([subject, preheader, body].some((v) => typeof v !== "string") || subject.length > 200 || preheader.length > 300 || body.length > 20000) throw fail("Email step " + (index + 1) + " has invalid or oversized fields.", "STEP_TOO_LONG");
    const footer = { unsubscribe: "{{unsubscribe_url}}", physical_address: "{{sender_postal_address}}" };
    const layout = { element: "Section", tag: "section", props: { id: "email-step-" + (index + 1), class: "grex-c-card", "aria-label": purpose }, children: [
      { element: "Heading", props: { id: "email-step-" + (index + 1) + "-heading", level: 1, text: purpose } },
      { element: "Text", tag: "p", props: { text: body } },
      { element: "Text", tag: "footer", props: { text: FOOTER } },
    ] };
    return { step_id: "step_" + (index + 1), sequence: index + 1, purpose, subject, preheader, plain_text: body + "\n\n" + FOOTER, layout, cta: copy[3], suggested_delay: delays[index], merge_fields: ["customer_name", "product_name", "order_items", "order_total", "currency", "verified_setup_instructions", "support_contact", "review_url", "related_product_name", "unsubscribe_url", "sender_name", "sender_postal_address"], footer, design_tokens };
  });
  return { schema_version: "1.3.0", flow_id, step_count: 4, brief, steps, status: "draft", sending_enabled: false, dispatch: { mode: "draft_only", trigger_enabled: false, scheduling_enabled: false }, activation_blockers: ["Resolve unsubscribe and preference handling.", "Verify sender identity and physical postal address.", "Confirm consent, suppression, and message intent.", "Verify order and product merge fields before activation."], provider_used: "deterministic", fallback_used: false };
}

const append = (doc, parent, tag, value = "", attrs = {}) => { const node = doc.createElement(tag); for (const [key, val] of Object.entries(attrs)) node.setAttribute(key, String(val)); node.textContent = value; parent.appendChild(node); return node; };

export function mountEmailFlowStudio({ root, document: doc = globalThis.document, csrfToken = "", fetchFn = globalThis.fetch } = {}) {
  if (!root || !doc) throw new TypeError("A root and document are required.");
  const section = append(doc, root, "section", "", { id: "email-flow-designer", "aria-labelledby": "email-flow-heading" });
  append(doc, section, "h2", "Post-Purchase Email Flow Designer", { id: "email-flow-heading" });
  append(doc, section, "p", "Review four brand-grounded messages. Approval saves a CMS draft only; it does not send or activate email.");
  const form = append(doc, section, "form");
  const label = append(doc, form, "label", "Flow brief");
  const brief = append(doc, label, "textarea", "", { name: "brief", maxlength: 4000, "aria-label": "Flow brief" });
  const modeLabel = append(doc, form, "label", "Generation mode");
  const mode = append(doc, modeLabel, "select", "", { name: "mode", "aria-label": "Generation mode" });
  for (const item of [["deterministic", "Built-in templates"], ["ollama", "Local Ollama (optional)"], ["byok", "Configured provider (optional)"]]) append(doc, mode, "option", item[1], { value: item[0] });
  const preview = append(doc, section, "section", "", { id: "email-flow-preview", "aria-live": "polite", "aria-label": "Flow preview" });
  const status = append(doc, section, "p", "No preview staged.", { id: "email-flow-status", role: "status" });
  append(doc, form, "button", "Generate Preview", { type: "submit" });
  let staged = null;
  form.addEventListener("submit", async (event) => {
    event.preventDefault(); staged = null; preview.replaceChildren(); status.textContent = "Generating and validating preview…";
    try {
      const response = await fetchFn("/api/groxy/email-flows/design", { method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken }, body: JSON.stringify({ brief: brief.value, mode: mode.value }) });
      const result = await response.json(); if (!response.ok) throw Object.assign(new Error(result.error || "Flow generation failed."), { status: response.status });
      staged = result;
      for (const product of result.product_facts || []) {
        append(doc, preview, "p", "Verified product: " + String(product.name || "{{product_name}}") + (typeof product.price === "string" ? " · exact price " + product.price : " · price not supplied"));
      }
      if (result.order_facts && Object.keys(result.order_facts).length) {
        append(doc, preview, "h3", "Verified order facts");
        for (const [key, value] of Object.entries(result.order_facts)) append(doc, preview, "p", key.replaceAll("_", " ") + ": " + (typeof value === "string" ? value : JSON.stringify(value)));
      }
      for (const step of result.steps) { const card = append(doc, preview, "article", "", { "aria-labelledby": step.step_id + "-title" }); append(doc, card, "h3", step.sequence + ". " + step.purpose, { id: step.step_id + "-title" }); append(doc, card, "p", "Subject: " + step.subject); append(doc, card, "p", "Preheader: " + step.preheader); append(doc, card, "p", step.plain_text); append(doc, card, "p", "Suggested timing: " + step.suggested_delay); }
      append(doc, preview, "h3", "Activation blockers"); for (const item of result.activation_blockers) append(doc, preview, "p", item);
      const approve = append(doc, section, "button", "Approve & Save Draft Flow", { type: "button", id: "email-flow-approve" });
      approve.addEventListener("click", async () => { approve.disabled = true; status.textContent = "Saving approved flow as a CMS draft…"; try {
        const apply = await fetchFn("/api/groxy/email-flows/apply", { method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken }, body: JSON.stringify({ flow_id: staged.flow_id, step_count: staged.step_count, flow_sha256: staged.flow_sha256, approval_token: staged.approval_token }) });
        const saved = await apply.json(); if (!apply.ok) throw new Error(saved.error || "Draft save failed."); staged = null; approve.remove(); status.textContent = "Saved CMS draft " + saved.draft_id + ". Sending remains disabled.";
      } catch (error) { status.textContent = error.message; approve.disabled = false; } });
      status.textContent = "Four-step preview ready. " + result.provider_used + (result.fallback_used ? " (deterministic fallback used)." : ".") + " Review each step before approval.";
    } catch (error) { status.textContent = error.message; }
  });
  form.addEventListener("input", () => { if (staged) { staged = null; status.textContent = "Edits require a fresh validated preview."; } });
  return { section, getStaged: () => staged, dispose: () => section.parentNode?.removeChild(section) };
}
