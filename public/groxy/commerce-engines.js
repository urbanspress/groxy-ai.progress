/** Deterministic, local-first commerce plan builders for Groxy AI v1.5.0. */
import { auditAccessibility, validateElementNode } from "./grex.js";
export const COMMERCE_VERSION = "1.5.0";
export const GROXY_VERSION = "1.8.0";
export const COMMERCE_ENGINES = Object.freeze(["recovery", "concierge", "bundles", "reviews-mine", "campaign-plan"]);
const FOOTER = "Unsubscribe or manage preferences: {{unsubscribe_url}}\n{{sender_name}}\n{{sender_postal_address}}";
const fail = (message, code = "COMMERCE_INVALID", status = 422) => Object.assign(new Error(message), { code, status });

export function canonicalJson(value) {
  if (value === null || typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw fail("Non-finite JSON numbers are not supported.", "CANONICAL_TYPE");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return "[" + value.map(canonicalJson).join(",") + "]";
  if (value && typeof value === "object") return "{" + Object.keys(value).sort().map((key) => JSON.stringify(key) + ":" + canonicalJson(value[key])).join(",") + "}";
  throw fail("Unsupported canonical JSON value.", "CANONICAL_TYPE");
}

export async function sha256(value, cryptoImpl = globalThis.crypto) {
  if (!cryptoImpl?.subtle) throw fail("SHA-256 is unavailable.", "CRYPTO_UNAVAILABLE", 503);
  const bytes = new TextEncoder().encode(typeof value === "string" ? value : canonicalJson(value));
  return [...new Uint8Array(await cryptoImpl.subtle.digest("SHA-256", bytes))].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function parseMoney(value, field, scale = 2) {
  if (typeof value !== "string" || !/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value)) throw fail(`${field} must be an exact non-negative base-10 decimal string.`, "ADR-025C");
  const [whole, fraction = ""] = value.split(".");
  if (fraction.length > scale) throw fail(`${field} exceeds the currency precision of ${scale} places.`, "ADR-025C");
  return { amount: BigInt(whole) * (10n ** BigInt(scale)) + BigInt((fraction + "0".repeat(scale)).slice(0, scale) || "0"), scale };
}
function moneyString(amount, scale = 2) {
  const unit = 10n ** BigInt(scale), whole = amount / unit, fraction = (amount % unit).toString().padStart(scale, "0");
  return scale ? `${whole}.${fraction}` : String(whole);
}
function addMoney(values, field = "subtotal") {
  if (!values.length) return "0.00";
  const parsed = values.map((value, i) => parseMoney(value, `${field}[${i}]`));
  return moneyString(parsed.reduce((sum, value) => sum + value.amount, 0n));
}
function discountAmount(base, rule, field = "discount") {
  if (!rule) return 0n;
  if (rule.authorized !== true) throw fail(`${field} must be explicitly authorized.`);
  if (rule.type === "fixed") return parseMoney(rule.amount, `${field}.amount`).amount;
  if (rule.type === "percent") {
    const percent = parseMoney(rule.percentage, `${field}.percentage`).amount;
    const numerator = base * percent, denominator = 10000n;
    if (numerator % denominator !== 0n) throw fail(`${field} produces a fractional currency minor unit.`);
    return numerator / denominator;
  }
  throw fail(`${field} has an unsupported discount type.`);
}
function assertCount(value, field, max) {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value) || BigInt(value) > BigInt(max)) throw fail(`${field} must be an exact positive integer string no greater than ${max}.`);
  return BigInt(value);
}
function safeText(value, field, max) {
  if (typeof value !== "string" || value.length > max) throw fail(`${field} must be text of at most ${max} characters.`);
  return value;
}
const escapeJsonLd = (value) => JSON.stringify(value).replaceAll("<", "\\u003c");
const node = (element, tag, props, children = []) => ({ element, tag, props, children });
const layout = (title, text, tag = "section") => node("Section", tag, { id: "groxy-commerce-preview", class: "grex-c-card", label: title }, [
  node("Heading", "h2", { level: 2, text: title }), node("Text", "p", { text }),
]);
const requireContext = ({ brand_dna, site_context }) => {
  if (!brand_dna || brand_dna.schema !== "brand-dna.v1" || !site_context || !Array.isArray(site_context.products)) throw fail("Configure Brand DNA and synchronize SITE-CONTEXT.md before generating a commerce plan.", "COMMERCE_CONTEXT_REQUIRED", 409);
};
function findProducts(ids, site_context) {
  const known = new Map(site_context.products.map((product) => [String(product.sku || product.id), product]));
  return ids.map((id) => {
    const product = known.get(String(id));
    if (!product) throw fail(`SKU ${id} is not present in verified SITE-CONTEXT.md.`, "SKU_UNVERIFIED", 422);
    if (typeof product.price !== "string") throw fail(`SKU ${id} has no exact verified price string.`, "SKU_PRICE_UNVERIFIED", 422);
    parseMoney(product.price, `SKU ${id} price`);
    return product;
  });
}
function emailStep(sequence, purpose, subject, preheader, text, delay) {
  const body = `${text}\n\n${FOOTER}`;
  return { sequence, purpose, subject, preheader, plain_text: body, suggested_delay: delay, footer: { unsubscribe_url: "{{unsubscribe_url}}", sender_name: "{{sender_name}}", sender_postal_address: "{{sender_postal_address}}" }, layout: node("Section", "section", { id: `commerce-email-${sequence}`, class: "grex-c-card", "aria-label": purpose }, [node("Heading", "h2", { level: 2, text: purpose }), node("Text", "p", { text: body })]) };
}

export function buildRecovery(input, context) {
  requireContext(context);
  const cart = input.cart;
  if (!Array.isArray(cart) || !cart.length || cart.length > 100) throw fail("cart must contain 1 to 100 verified line items.");
  const currency = cart[0].currency;
  if (typeof currency !== "string" || !/^[A-Z]{3}$/.test(currency)) throw fail("cart currency must be an ISO currency code.");
  const lines = cart.map((line, i) => {
    const product = findProducts([line.sku], context.site_context)[0];
    if (line.currency !== currency || line.unit_price !== product.price || (product.currency && line.currency !== product.currency)) throw fail(`cart[${i}] price or currency differs from verified site facts.`);
    const quantity = assertCount(line.quantity, `cart[${i}].quantity`, 1000000);
    const unit = parseMoney(line.unit_price, `cart[${i}].unit_price`).amount;
    return { sku: String(line.sku), name: product.name || `SKU ${line.sku}`, quantity: line.quantity, unit_price: line.unit_price, line_total: moneyString(unit * quantity), currency };
  });
  const subtotal = addMoney(lines.map((line) => line.line_total));
  if (input.subtotal !== subtotal) throw fail("supplied subtotal does not match exact line totals.");
  const discount = discountAmount(parseMoney(subtotal, "subtotal").amount, input.discount_rule, "discount_rule");
  if (discount > parseMoney(subtotal, "subtotal").amount) throw fail("discount cannot exceed the cart subtotal.");
  const discountedTotal = moneyString(parseMoney(subtotal, "subtotal").amount - discount);
  const summary = lines.map((line) => `${line.quantity} × ${line.name}: ${line.line_total} ${currency}`).join("; ");
  const steps = [
    emailStep(1, "Cart reminder", "Your cart is ready when you are", "A reminder from {{sender_name}}", `You left these verified items in your cart: ${summary}. Cart subtotal: ${subtotal} ${currency}. Checkout link: {{checkout_url}}.`, "1 hour (suggestion only)"),
    emailStep(2, "Questions and help", "Questions about your cart?", "We can help you compare the details", `Your cart contains ${summary}. For product or policy questions, contact {{verified_support_contact}}. No unverified shipping or policy details are implied.`, "24 hours (suggestion only)"),
    emailStep(3, "Final reminder", "A final cart reminder", "Your saved cart details", `Your cart subtotal is ${subtotal} ${currency}; authorized discount: ${moneyString(discount)} ${currency}; resulting total: ${discountedTotal} ${currency}. Checkout link: {{checkout_url}}.`, "72 hours (suggestion only)"),
  ];
  return { artifacts: [{ kind: "email_sequence", steps, subtotal, discount: moneyString(discount), total: discountedTotal, currency }], calculations: { lines, subtotal, discount: moneyString(discount), total: discountedTotal, currency }, activation_blockers: ["Resolve unsubscribe URL and sender identity/address.", "Verify recipient permission and suppression controls.", "Resolve the checkout URL before any future activation."], layout: layout("Cart recovery preview", `${summary}. Subtotal: ${subtotal} ${currency}; reviewed total: ${discountedTotal} ${currency}.`) };
}

export function buildConcierge(input, context) {
  requireContext(context);
  const question = safeText(input.question, "question", 4000).trim();
  if (!question) throw fail("question is required.");
  const products = findProducts((input.skus || []).map(String), context.site_context);
  const found = products.filter((product) => [product.name, product.description, product.specifications].filter(Boolean).some((fact) => question.toLocaleLowerCase().includes(String(product.name || "").toLocaleLowerCase())));
  const supported = found.length > 0;
  const answer = supported ? found.map((p) => `${p.name}: ${p.description || "Verified product listing."} Price: ${p.price} ${p.currency || context.brand_dna.currency || "currency not verified"}.`).join(" ") : "This detail is not verified in the available site and brand context. Please contact the verified support contact if one is listed.";
  const sources = supported ? found.map((p) => ({ source: "SITE-CONTEXT.md", sku: String(p.sku || p.id) })) : [];
  const widget = node("Section", "aside", { id: "groxy-concierge", class: "grex-c-card", label: "Storefront concierge preview" }, [node("Heading", "h2", { level: 2, text: "Storefront concierge" }), node("Text", "p", { text: answer }), node("Modal", "dialog", { open: false, title: "Storefront concierge details" }, [node("Heading", "h3", { level: 3, text: "Storefront concierge details" }), node("Text", "p", { text: answer }), node("Button", "button", { type: "button", text: "Close", label: "Close concierge details" })])]);
  return { artifacts: [{ kind: "grounded_answer", question, answer, sources, verified: supported }, { kind: "widget", layout: widget, keyboard: ["Escape closes dialog", "focus returns to opener"] }], unresolved: supported ? [] : ["No matching verified answer found."], layout: widget };
}

export function buildBundles(input, context) {
  requireContext(context);
  const anchors = findProducts((input.anchor_skus || []).map(String), context.site_context);
  const relatedIds = new Set(anchors.flatMap((p) => p.related_skus || p.complementary_skus || []).map(String));
  const related = context.site_context.products.filter((p) => relatedIds.has(String(p.sku || p.id)) && !anchors.some((a) => String(a.sku || a.id) === String(p.sku || p.id)));
  if (!related.length) return { recommendations: [], unresolved: ["No verified complementary SKU relationship is available."], approval_required: false };
  const proposals = related.slice(0, Math.min(5, input.max_proposals || 5)).map((product) => {
    const items = [...anchors, product];
    const subtotal = addMoney(items.map((item) => item.price), "bundle subtotal");
    const discount = discountAmount(parseMoney(subtotal, "bundle subtotal").amount, input.discount_rule, "discount_rule");
    if (discount > parseMoney(subtotal, "bundle subtotal").amount) throw fail("bundle discount cannot exceed its subtotal.");
    return { items: items.map((item) => ({ sku: String(item.sku || item.id), name: item.name, quantity: "1", unit_price: item.price, line_total: item.price })), subtotal, discount: moneyString(discount), bundle_price: moneyString(parseMoney(subtotal, "bundle subtotal").amount - discount), savings: moneyString(discount), currency: product.currency || anchors[0].currency || context.brand_dna.currency || "USD", reason: `Verified related SKU link to ${anchors.map((p) => p.name).join(", ")}.` };
  });
  return { recommendations: proposals, layout: layout("Related products", proposals.map((p) => p.items.map((i) => i.name).join(" + ")).join("; ")), unresolved: [] };
}

export function buildReviewsMine(input, context) {
  requireContext(context);
  if (!Array.isArray(input.reviews) || input.reviews.length > 200) throw fail("reviews must contain at most 200 records.");
  const unique = new Map();
  for (const review of input.reviews) {
    if (typeof review.source_id !== "string" || !review.source_id || typeof review.text !== "string" || review.text.length > 4000) throw fail("Each review needs a bounded source_id and text.");
    if (!unique.has(review.source_id)) unique.set(review.source_id, review);
  }
  const patterns = [
    { key: "shipping", terms: ["shipping", "delivery", "arrived", "late"] },
    { key: "quality", terms: ["quality", "broken", "defect", "durable", "broke"] },
    { key: "fit", terms: ["fit", "size", "sizing", "compatible"] },
  ];
  const alerts = patterns.map((pattern) => {
    const evidence = [...unique.values()].filter((review) => pattern.terms.some((term) => review.text.toLocaleLowerCase().includes(term)));
    return evidence.length ? { topic: pattern.key, count: evidence.length, denominator: unique.size, review_ids: evidence.map((r) => r.source_id), status: "operator_review_signal", verified_purchase_count: evidence.filter((r) => r.verified_purchase === true).length } : null;
  }).filter(Boolean);
  const facts = context.site_context.faqs || [];
  const faqs = facts.slice(0, 20).filter((faq) => typeof faq.question === "string" && typeof faq.answer === "string");
  const jsonld = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })) };
  const serialized = escapeJsonLd(jsonld);
  const faqLayout = node("Section", "section", { id: "groxy-review-faq", class: "grex-c-card", label: "Verified FAQ preview" }, [node("Heading", "h2", { level: 2, text: "Frequently asked questions" }), node("Accordion", "section", { items: faqs.map((faq, i) => ({ id: `commerce-faq-${i + 1}`, question: faq.question, answer: faq.answer })) })]);
  return { summary: { unique_review_count: unique.size, alerts }, faqs, jsonld_escaped: serialized, layout: faqLayout };
}

export function buildCampaignPlan(input, context) {
  requireContext(context);
  const brief = safeText(input.brief, "brief", 4000);
  const start = Date.parse(input.starts_at), end = Date.parse(input.ends_at);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end || !/(Z|[+-]\d\d:\d\d)$/.test(input.starts_at || "") || !/(Z|[+-]\d\d:\d\d)$/.test(input.ends_at || "")) throw fail("Campaign dates must be explicit timezone-aware timestamps in increasing order.");
  const products = findProducts((input.skus || []).map(String), context.site_context);
  const promotion = input.discount_rule;
  const pricing = products.map((p) => {
    const regular = parseMoney(p.price, `${p.name} price`).amount;
    const discount = discountAmount(regular, promotion, "discount_rule");
    if (discount > regular) throw fail("campaign discount cannot exceed the verified product price.");
    return { sku: String(p.sku || p.id), regular_price: p.price, discount: moneyString(discount), promotional_price: moneyString(regular - discount), currency: p.currency || context.brand_dna.currency || "USD" };
  });
  const facts = products.map((p, i) => `${p.name}: ${pricing[i].regular_price} ${pricing[i].currency}; campaign price ${pricing[i].promotional_price} ${pricing[i].currency}`).join("; ") || "No product pricing was supplied.";
  const steps = [emailStep(1, "Announcement", "A new update from {{sender_name}}", brief.slice(0, 100), `${brief}\n${facts}\nCampaign window: ${input.starts_at} to ${input.ends_at}.`, "campaign date metadata only"), emailStep(2, "Reminder", "A reminder about the campaign", "Review the details", `Here are the verified details: ${facts}. Campaign window: ${input.starts_at} to ${input.ends_at}.`, "campaign date metadata only"), emailStep(3, "Closing message", "Campaign window closes at the stated time", "The published campaign terms should be checked", `${facts}. Campaign window: ${input.starts_at} to ${input.ends_at}. No automatic offer activation or message sending is configured.`, "campaign date metadata only")];
  const hero = layout("Campaign preview", `${brief} ${facts}. Offer window: ${input.starts_at} to ${input.ends_at}.`);
  return { artifacts: [{ kind: "hero", layout: hero }, { kind: "landing_page_draft", content: `${brief}\n\n${facts}` }, { kind: "email_sequence", steps }], pricing, layout: hero, activation_blockers: ["Verify authorized offer terms.", "Resolve unsubscribe URL and sender identity/address.", "Confirm campaign dates and recipient controls before any future activation."] };
}

export const BUILDERS = Object.freeze({ recovery: buildRecovery, concierge: buildConcierge, bundles: buildBundles, "reviews-mine": buildReviewsMine, "campaign-plan": buildCampaignPlan });

function toGrexNode(layoutNode, palette = "light") {
  const { element, tag, props = {}, children = [] } = layoutNode;
  const ariaLabel = props["aria-label"] || props.aria_label;
  const attrs = { ...(props.id ? { id: props.id } : {}), ...(props.class ? { class: props.class } : {}), ...(props.role ? { role: props.role } : {}), ...(ariaLabel ? { "aria-label": ariaLabel } : {}) };
  const normalizedProps = { ...props };
  delete normalizedProps.id; delete normalizedProps.class; delete normalizedProps["aria-label"]; delete normalizedProps.aria_label; delete normalizedProps.role;
  if (element === "Section" && !normalizedProps.label) normalizedProps.label = ariaLabel || "Commerce preview";
  const node = { type: element, tag, props: normalizedProps, attrs, styles: { color: palette === "dark" ? "#f8fafc" : "#0f172a", "background-color": palette === "dark" ? "#0f172a" : "#ffffff" } };
  const auditChildren = [...children];
  if (element === "Accordion" && Array.isArray(props.items)) {
    for (const item of props.items) if (Array.isArray(item.content)) auditChildren.push(...item.content);
  }
  if (auditChildren.length) node.children = auditChildren.map((child) => toGrexNode(child, palette));
  return node;
}

/** Validate and audit a commerce layout with the bundled Grex JS v1.0.0 contracts. */
export function auditCommerceLayout(layoutNode, palette = "light") {
  const tree = toGrexNode(layoutNode, palette);
  validateElementNode(tree);
  const accessibility = auditAccessibility(tree);
  return { valid: true, palette, accessibility };
}

/** Audit the Commerce Studio's semantic controls and native preview/help widgets. */
export function auditCommerceStudio(palette = "light") {
  const content = [
    { element: "Select", tag: "select", props: { label: "Commerce engine", options: COMMERCE_ENGINES.map((value) => ({ value, label: value })) }, children: [] },
    { element: "Input", tag: "input", props: { label: "Authorized target slot", type: "text", required: true }, children: [] },
    { element: "Input", tag: "textarea", props: { label: "Engine request JSON", type: "textarea", required: true }, children: [] },
    { element: "Button", tag: "button", props: { type: "submit", text: "Generate grounded preview" }, children: [] },
    { element: "Button", tag: "button", props: { type: "button", text: "Approve and stage the reviewed commerce plan", disabled: true }, children: [] },
    { element: "Text", tag: "p", props: { text: "No commerce plan is staged." }, children: [] },
    { element: "Button", tag: "button", props: { type: "button", text: "Open preview dialog" }, children: [] },
    { element: "Modal", tag: "dialog", props: { open: true, title: "Commerce plan review" }, children: [
      { element: "Heading", tag: "h3", props: { level: 3, text: "Commerce plan review" }, children: [] },
      { element: "Text", tag: "p", props: { text: "Reviewed commerce plan details" }, children: [] },
      { element: "Button", tag: "button", props: { type: "button", text: "Close preview" }, children: [] },
    ] },
    { element: "Accordion", tag: "section", props: { items: [{ question: "Keyboard and approval help", content: [{ element: "Text", tag: "p", props: { text: "Tab moves between controls. Enter submits. Space or Enter activates buttons." }, children: [] }] }] }, children: [] },
  ];
  return auditCommerceLayout({ element: "Section", tag: "aside", props: { label: "Storefront Commerce Studio" }, children: [
    { element: "Heading", tag: "h2", props: { level: 2, text: "Storefront Commerce Studio" }, children: [] },
    { element: "Form", tag: "form", props: {}, children: content.slice(0, 5) },
    ...content.slice(5),
  ] }, palette);
}

/** Review-first API panel. Server output is rendered as text and never parsed as HTML. */
export function mountCommerceStudio({ root, document: doc = globalThis.document, csrfToken = "", fetchFn = globalThis.fetch?.bind(globalThis) } = {}) {
  if (!root || !doc) throw new TypeError("Commerce Studio requires a root and document.");
  const section = doc.createElement("section"); section.id = "commerce-studio"; section.className = "groxy-card groxy-commerce-studio"; section.setAttribute("aria-labelledby", "commerce-studio-title");
  const title = doc.createElement("h2"); title.id = "commerce-studio-title"; title.textContent = "Storefront Commerce Studio"; section.appendChild(title);
  const intro = doc.createElement("p"); intro.textContent = "Generate grounded previews for recovery, concierge, bundles, reviews, and campaigns. Review the returned sources, exact values, blockers, and destinations before staging."; section.appendChild(intro);
  const form = doc.createElement("form"); form.id = "commerce-studio-form";
  const engineLabel = doc.createElement("label"); engineLabel.htmlFor = "commerce-engine"; engineLabel.textContent = "Commerce engine";
  const engine = doc.createElement("select"); engine.id = "commerce-engine"; engine.setAttribute("aria-label", "Commerce engine"); engineLabel.appendChild(engine);
  for (const value of COMMERCE_ENGINES) { const option = doc.createElement("option"); option.value = value; option.textContent = value; engine.appendChild(option); }
  const slotLabel = doc.createElement("label"); slotLabel.htmlFor = "commerce-target-slot"; slotLabel.textContent = "Authorized target slot";
  const slot = doc.createElement("input"); slot.id = "commerce-target-slot"; slot.setAttribute("aria-label", "Authorized target slot"); slot.required = true; slot.value = "commerce-studio"; slotLabel.appendChild(slot);
  const payloadLabel = doc.createElement("label"); payloadLabel.htmlFor = "commerce-request"; payloadLabel.textContent = "Engine request JSON";
  const payload = doc.createElement("textarea"); payload.id = "commerce-request"; payload.setAttribute("aria-label", "Engine request JSON"); payload.required = true; payload.rows = 8; payload.value = "{}"; payloadLabel.appendChild(payload);
  const generate = doc.createElement("button"); generate.type = "submit"; generate.textContent = "Generate grounded preview"; generate.className = "groxy-btn";
  const apply = doc.createElement("button"); apply.type = "button"; apply.textContent = "Approve & Stage Commerce Plan"; apply.setAttribute("aria-label", "Approve and stage the reviewed commerce plan"); apply.className = "groxy-btn"; apply.disabled = true;
  form.appendChild(engineLabel); form.appendChild(slotLabel); form.appendChild(payloadLabel); form.appendChild(generate); form.appendChild(apply); section.appendChild(form);
  const status = doc.createElement("output"); status.id = "commerce-status"; status.setAttribute("aria-live", "polite"); status.setAttribute("aria-atomic", "true"); status.textContent = "No commerce plan is staged."; section.appendChild(status);
  const preview = doc.createElement("pre"); preview.id = "commerce-preview"; preview.setAttribute("aria-label", "Commerce plan preview"); section.appendChild(preview);
  const previewOpen = doc.createElement("button"); previewOpen.type = "button"; previewOpen.textContent = "Open preview dialog"; previewOpen.setAttribute("aria-haspopup", "dialog"); previewOpen.setAttribute("aria-controls", "commerce-preview-dialog"); previewOpen.disabled = true; previewOpen.className = "groxy-btn groxy-btn-secondary"; section.appendChild(previewOpen);
  const previewDialog = doc.createElement("dialog"); previewDialog.id = "commerce-preview-dialog"; previewDialog.setAttribute("aria-labelledby", "commerce-preview-dialog-title"); previewDialog.className = "groxy-commerce-dialog";
  const dialogTitle = doc.createElement("h2"); dialogTitle.id = "commerce-preview-dialog-title"; dialogTitle.textContent = "Commerce plan review"; previewDialog.appendChild(dialogTitle);
  const dialogPreview = doc.createElement("pre"); dialogPreview.setAttribute("aria-label", "Reviewed commerce plan details"); previewDialog.appendChild(dialogPreview);
  const closePreview = doc.createElement("button"); closePreview.type = "button"; closePreview.textContent = "Close preview"; closePreview.className = "groxy-btn groxy-btn-secondary"; previewDialog.appendChild(closePreview); section.appendChild(previewDialog);
  const help = doc.createElement("details"); help.className = "groxy-commerce-keyboard-help";
  const helpSummary = doc.createElement("summary"); helpSummary.textContent = "Keyboard and approval help"; help.appendChild(helpSummary);
  const helpText = doc.createElement("p"); helpText.textContent = "Use Tab to move between controls. Enter submits the preview form; Space or Enter activates buttons. Editing the request clears its approval. The approval button stages a draft only."; help.appendChild(helpText); section.appendChild(help);
  root.appendChild(section);
  let staged = null;
  const closeDialog = () => {
    if (typeof previewDialog.close === "function" && previewDialog.open) previewDialog.close();
    else previewDialog.removeAttribute("open");
    previewOpen.focus?.();
  };
  previewOpen.addEventListener("click", () => {
    if (typeof previewDialog.showModal === "function") previewDialog.showModal();
    else previewDialog.setAttribute("open", "");
    closePreview.focus?.();
  });
  closePreview.addEventListener("click", closeDialog);
  previewDialog.addEventListener("cancel", (event) => { event.preventDefault(); closeDialog(); });
  previewDialog.addEventListener("keydown", (event) => { if (event.key === "Escape") closeDialog(); });
  const send = async (url, body) => {
    if (!fetchFn) throw new Error("Commerce API is unavailable in this browser.");
    const response = await fetchFn(url, { method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken }, body: JSON.stringify(body) });
    const result = await response.json();
    if (!response.ok) throw Object.assign(new Error(result.error || `Request failed (${response.status}).`), { status: response.status });
    return result;
  };
  form.addEventListener("submit", async (event) => {
    event.preventDefault(); staged = null; apply.disabled = true;
    try {
      const data = JSON.parse(payload.value);
      const result = await send(`/api/groxy/commerce/${engine.value}`, { ...data, target_slot: slot.value });
      if (result.approval_required && result.approval_token) staged = result;
      preview.textContent = JSON.stringify(result, null, 2);
      dialogPreview.textContent = preview.textContent;
      previewOpen.disabled = false;
      apply.disabled = !staged;
      status.textContent = staged ? `Preview ${result.plan_id} is ready. Sending and publication are disabled.` : "No apply token was issued for this result.";
    } catch (error) { status.textContent = error.message; preview.textContent = ""; dialogPreview.textContent = ""; previewOpen.disabled = true; }
  });
  apply.addEventListener("click", async () => {
    if (!staged) return;
    apply.disabled = true;
    try {
      const result = await send("/api/groxy/commerce/apply", { plan_id: staged.plan_id, engine: staged.engine, target_slot: staged.target_slot, payload_sha256: staged.payload_sha256, approval_token: staged.approval_token });
      staged = null; preview.textContent = JSON.stringify(result, null, 2); dialogPreview.textContent = preview.textContent; status.textContent = "Draft staging result received. Email sending and publication remain disabled.";
    } catch (error) { status.textContent = error.message; apply.disabled = !staged; }
  });
  form.addEventListener("input", () => { if (staged) { staged = null; apply.disabled = true; status.textContent = "Edits invalidate the preview approval. Generate a fresh plan."; } });
  return { section, dispose: () => section.parentNode?.removeChild(section), getStaged: () => staged };
}
