/**
 * Groxy AI v1.3.0 — Brand DNA wizard helpers and zero-wrapper Grex panel.
 * Values are plain data; the module never inserts HTML or coerces prices to Number.
 */
export const BRAND_DNA_VERSION = "1.4.0";
export const BRAND_DNA_QUESTIONS = Object.freeze([
  { id: "business", title: "Business identity", fields: ["business_name", "business_type", "niche"] },
  { id: "audience", title: "Audience and needs", fields: ["target_audience", "pain_points"] },
  { id: "local", title: "Local search", fields: ["service_area", "location_terms"] },
  { id: "voice", title: "Brand voice", fields: ["voice_weights"] },
  { id: "forbidden", title: "Words and claims to avoid", fields: ["forbidden_terms"] },
  { id: "calls-to-action", title: "Preferred calls to action", fields: ["preferred_ctas", "avoided_ctas"] },
  { id: "offers", title: "Offers and exact prices", fields: ["offer_types", "prices", "currency"] },
  { id: "guarantees", title: "Guarantees and fulfillment", fields: ["guarantees"] },
  { id: "design", title: "Design identity", fields: ["style_pack", "design_tokens"] },
  { id: "review", title: "Examples and final review", fields: ["editorial_notes", "ready"] },
]);

const VOICE_KEYS = Object.freeze(["authoritative", "warm_friendly", "bold_direct", "technical_expert"]);
const DECIMAL = /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/;
const INTEGER = /^-?(?:0|[1-9]\d*)$/;
const text = (value, max = 500) => typeof value === "string" && value.length <= max;
const strings = (value, maxItems = 40, maxLength = 120) => Array.isArray(value) && value.length <= maxItems && value.every((item) => text(item, maxLength));

export class BrandDnaValidationError extends Error {
  constructor(field, code, message) { super(message); this.name = "BrandDnaValidationError"; this.field = field; this.code = code; }
}

export function validateExactDecimal(value, field = "price") {
  if (typeof value !== "string" || !DECIMAL.test(value) || value.startsWith("+") || /[eE]/.test(value)) {
    throw new BrandDnaValidationError(field, "ADR-025c", `${field} must be an exact base-10 decimal string.`);
  }
  if (value.startsWith("-")) throw new BrandDnaValidationError(field, "ADR-025c", `${field} cannot be negative.`);
  return value;
}

export function normalizeBrandDna(input, { revision = 0, now = new Date().toISOString() } = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new BrandDnaValidationError("profile", "OBJECT_REQUIRED", "A Brand DNA profile is required.");
  const p = input;
  for (const key of ["business_name", "business_type", "niche", "target_audience"]) {
    if (!text(p[key], 180) || !p[key].trim()) throw new BrandDnaValidationError(key, "REQUIRED", `${key} is required.`);
  }
  if (!strings(p.pain_points) || p.pain_points.length === 0) throw new BrandDnaValidationError("pain_points", "REQUIRED", "Add at least one audience pain point.");
  for (const key of ["service_area", "editorial_notes"]) if (p[key] !== undefined && !text(p[key], 1000)) throw new BrandDnaValidationError(key, "TOO_LONG", `${key} is too long.`);
  for (const key of ["location_terms", "forbidden_terms", "preferred_ctas", "avoided_ctas", "offer_types"]) {
    if (p[key] !== undefined && !strings(p[key])) throw new BrandDnaValidationError(key, "INVALID_LIST", `${key} must be a bounded list of text values.`);
  }
  if (!p.voice_weights || typeof p.voice_weights !== "object" || Array.isArray(p.voice_weights)) throw new BrandDnaValidationError("voice_weights", "REQUIRED", "Set all four voice weights.");
  const voice = {};
  for (const key of VOICE_KEYS) {
    const value = p.voice_weights[key];
    if (!Number.isInteger(value) || value < 0 || value > 100) throw new BrandDnaValidationError(`voice_weights.${key}`, "INVALID_WEIGHT", "Voice weights must be integers from 0 to 100.");
    voice[key] = value;
  }
  const prices = {};
  if (p.prices !== undefined) {
    if (!p.prices || typeof p.prices !== "object" || Array.isArray(p.prices)) throw new BrandDnaValidationError("prices", "INVALID_PRICES", "Prices must be named exact decimal strings.");
    for (const [key, value] of Object.entries(p.prices)) prices[key] = validateExactDecimal(value, `prices.${key}`);
  }
  if (p.currency !== undefined && !/^[A-Z]{3}$/.test(p.currency)) throw new BrandDnaValidationError("currency", "INVALID_CURRENCY", "Currency must be a three-letter uppercase code.");
  const guarantees = p.guarantees && typeof p.guarantees === "object" && !Array.isArray(p.guarantees) ? { ...p.guarantees } : { status: "unknown", details: "" };
  if (!new Set(["known", "unknown", "none"]).has(guarantees.status)) throw new BrandDnaValidationError("guarantees.status", "INVALID_STATUS", "Guarantee status must be known, unknown, or none.");
  if (!text(guarantees.details || "", 1000)) throw new BrandDnaValidationError("guarantees.details", "TOO_LONG", "Guarantee details are too long.");
  const stylePack = p.style_pack === undefined ? "" : p.style_pack;
  if (!text(stylePack, 100) || (stylePack && !/^[a-z0-9][a-z0-9-]*$/.test(stylePack))) throw new BrandDnaValidationError("style_pack", "INVALID_STYLE_PACK", "Choose a valid Design Style Pack id.");
  const tokens = p.design_tokens === undefined ? [] : p.design_tokens;
  if (!strings(tokens, 80, 80) || tokens.some((token) => !/^--grex-[a-z0-9-]+$/.test(token))) throw new BrandDnaValidationError("design_tokens", "INVALID_TOKEN", "Design tokens must be --grex-* references.");
  return {
    schema: "brand-dna.v1", revision, updated_at: now,
    business_name: p.business_name.trim(), business_type: p.business_type.trim(), niche: p.niche.trim(),
    target_audience: p.target_audience.trim(), pain_points: [...p.pain_points],
    service_area: String(p.service_area || "").trim(), location_terms: [...(p.location_terms || [])],
    voice_weights: voice, forbidden_terms: [...(p.forbidden_terms || [])],
    preferred_ctas: [...(p.preferred_ctas || [])], avoided_ctas: [...(p.avoided_ctas || [])],
    offer_types: [...(p.offer_types || [])], prices, currency: p.currency || "USD", guarantees,
    style_pack: stylePack, design_tokens: [...tokens], editorial_notes: String(p.editorial_notes || "").trim(),
  };
}

export function renderBrandDnaMarkdown(profile) {
  const list = (xs) => (xs?.length ? xs.map((x) => `- ${String(x).replace(/[\r\n]/g, " ")}`).join("\n") : "- None provided");
  const prices = Object.entries(profile.prices || {}).map(([name, amount]) => `- ${name}: ${amount} ${profile.currency}`).join("\n") || "- No prices provided";
  return [
    "# Brand DNA", "", `Revision: ${profile.revision}`, `Updated: ${profile.updated_at}`, "",
    "## Business", `${profile.business_name} — ${profile.business_type}; ${profile.niche}`, "",
    "## Audience", profile.target_audience, "", "### Pain points", list(profile.pain_points), "",
    "## Local SEO", profile.service_area || "No service area provided", "", list(profile.location_terms), "",
    "## Voice weights", ...Object.entries(profile.voice_weights).map(([k, v]) => `- ${k}: ${v}/100`), "",
    "## Forbidden terms", list(profile.forbidden_terms), "", "## Preferred calls to action", list(profile.preferred_ctas), "",
    "## Offers and exact prices", list(profile.offer_types), prices, "",
    "## Guarantees", profile.guarantees.status === "known" ? profile.guarantees.details : `Status: ${profile.guarantees.status}; do not infer guarantees.`, "",
    "## Design", `Style Pack: ${profile.style_pack || "unspecified"}`, `Tokens: ${profile.design_tokens.join(", ") || "none"}`, "",
    "## Editorial notes", profile.editorial_notes || "None provided", "",
  ].join("\n");
}

function appendText(doc, parent, tag, attrs, value) {
  const el = doc.createElement(tag);
  for (const [key, val] of Object.entries(attrs || {})) el.setAttribute(key, String(val));
  el.textContent = value;
  parent.appendChild(el);
  return el;
}

/** Mounts an accessible 10-step semantic wizard. API persistence is handled by save(). */
export function mountBrandDnaWizard({ root, document: doc = globalThis.document, csrfToken = "", fetchFn = globalThis.fetch, profile = null } = {}) {
  if (!root || !doc) throw new TypeError("A root and document are required.");
  const section = doc.createElement("section"); section.id = "brand-dna-wizard"; section.setAttribute("aria-labelledby", "brand-dna-heading");
  appendText(doc, section, "h2", { id: "brand-dna-heading" }, "Brand DNA & Voice Setup");
  const form = doc.createElement("form"); form.noValidate = true;
  const state = { ...(profile || {}), voice_weights: { ...(profile?.voice_weights || {}) }, prices: { ...(profile?.prices || {}) } };
  const fieldNames = ["business_name", "business_type", "niche", "target_audience", "service_area", "editorial_notes"];
  const stepTitles = ["Business identity", "Audience and needs", "Local search", "Brand voice", "Words and claims to avoid", "Preferred calls to action", "Offers and exact prices", "Guarantees and fulfillment", "Design identity", "Examples and final review"];
  const stepFieldsets = stepTitles.map((title, index) => {
    const fieldset = doc.createElement("fieldset"); fieldset.hidden = index !== 0;
    appendText(doc, fieldset, "legend", {}, title); form.appendChild(fieldset); return fieldset;
  });
  const addTextField = (step, name, label, value = "") => {
    const id = `brand-dna-${name}`; appendText(doc, stepFieldsets[step], "label", { for: id }, label);
    const input = doc.createElement("input"); input.id = id; input.name = name; input.value = String(value || ""); stepFieldsets[step].appendChild(input); return input;
  };
  const addListField = (step, name, label) => addTextField(step, name, `${label} (comma separated)`, Array.isArray(state[name]) ? state[name].join(", ") : "");
  for (const name of ["business_name", "business_type", "niche"]) addTextField(0, name, name.replaceAll("_", " "), state[name]);
  addTextField(1, "target_audience", "Primary audience", state.target_audience); addListField(1, "pain_points", "Audience needs and pain points");
  addTextField(2, "service_area", "Service area", state.service_area); addListField(2, "location_terms", "Local search terms");
  for (const name of VOICE_KEYS) { const id = `brand-dna-voice-${name}`; appendText(doc, stepFieldsets[3], "label", { for: id }, `${name.replaceAll("_", " ")} voice (0–100)`); const input = doc.createElement("input"); input.id = id; input.type = "range"; input.min = "0"; input.max = "100"; input.name = `voice_${name}`; input.value = String(state.voice_weights[name] ?? 25); stepFieldsets[3].appendChild(input); }
  addListField(4, "forbidden_terms", "Forbidden buzzwords and claims");
  addListField(5, "preferred_ctas", "Preferred calls to action"); addListField(5, "avoided_ctas", "Calls to action to avoid");
  addListField(6, "offer_types", "Offer types");
  addTextField(6, "currency", "Currency (ISO 4217)", state.currency || "USD");
  const priceId = "brand-dna-price"; appendText(doc, stepFieldsets[6], "label", { for: priceId }, "Default offer price (exact decimal string; leave blank if not applicable)");
  const price = doc.createElement("input"); price.id = priceId; price.name = "price"; price.inputMode = "decimal"; price.value = state.prices.default || ""; stepFieldsets[6].appendChild(price);
  const guaranteeId = "brand-dna-guarantee"; appendText(doc, stepFieldsets[7], "label", { for: guaranteeId }, "Guarantee status");
  const guarantee = doc.createElement("select"); guarantee.id = guaranteeId; guarantee.name = "guarantee_status";
  for (const [value, label] of [["unknown", "Unknown (do not invent)"], ["known", "Known"], ["none", "No guarantee"]]) { const option = doc.createElement("option"); option.value = value; option.textContent = label; guarantee.appendChild(option); }
  guarantee.value = state.guarantees?.status || "unknown"; stepFieldsets[7].appendChild(guarantee);
  addTextField(7, "guarantee_details", "Guarantee, return, delivery, or shipping details", state.guarantees?.details || "");
  addTextField(8, "style_pack", "Linked Design Style Pack id", state.style_pack); addListField(8, "design_tokens", "Design tokens (--grex-*)");
  addTextField(9, "editorial_notes", "Optional examples or editorial notes", state.editorial_notes);
  appendText(doc, stepFieldsets[9], "p", {}, "Review the profile, then save it. Editing an existing profile requires an explicit save and revision check.");
  let currentStep = 0;
  const progress = doc.createElement("p"); progress.id = "brand-dna-progress"; progress.setAttribute("role", "status"); progress.setAttribute("aria-live", "polite"); form.appendChild(progress);
  const nav = doc.createElement("nav"); nav.setAttribute("aria-label", "Brand DNA wizard navigation");
  const previous = appendText(doc, nav, "button", { id: "brand-dna-wizard-previous", type: "button" }, "Previous question");
  const next = appendText(doc, nav, "button", { id: "brand-dna-wizard-next", type: "button" }, "Next question");
  form.appendChild(nav);
  const saveButton = appendText(doc, form, "button", { type: "submit" }, "Save Brand DNA");
  const renderStep = () => { stepFieldsets.forEach((set, index) => { set.hidden = index !== currentStep; }); progress.textContent = `Question ${currentStep + 1} of ${stepFieldsets.length}: ${stepTitles[currentStep]}`; previous.hidden = currentStep === 0; next.hidden = currentStep === stepFieldsets.length - 1; saveButton.hidden = currentStep !== stepFieldsets.length - 1; };
  previous.addEventListener("click", () => { currentStep = Math.max(0, currentStep - 1); renderStep(); });
  next.addEventListener("click", () => { currentStep = Math.min(stepFieldsets.length - 1, currentStep + 1); renderStep(); });
  renderStep();
  appendText(doc, form, "p", { id: "brand-dna-error", role: "alert" }, "");
  saveButton.textContent = "Review and Save Brand DNA";
  const review = doc.createElement("output"); review.id = "brand-dna-review"; review.setAttribute("aria-live", "polite"); form.appendChild(review);
  const loadProfile = async () => {
    if (profile || typeof fetchFn !== "function") return;
    try {
      const response = await fetchFn("/api/groxy/brand-dna", { method: "GET", headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("Saved Brand DNA could not be loaded.");
      const result = await response.json();
      if (!result.configured) return;
      profile = result.profile;
      Object.assign(state, profile);
      for (const name of fieldNames) { const input = form.querySelector(`[name="${name}"]`); if (input) input.value = String(profile[name] || ""); }
      for (const name of ["pain_points", "location_terms", "forbidden_terms", "preferred_ctas", "avoided_ctas", "offer_types", "design_tokens"]) { const input = form.querySelector(`[name="${name}"]`); if (input) input.value = (profile[name] || []).join(", "); }
      for (const name of VOICE_KEYS) { const input = form.querySelector(`[name="voice_${name}"]`); if (input) input.value = String(profile.voice_weights[name]); }
      price.value = profile.prices?.default || "";
      guarantee.value = profile.guarantees?.status || "unknown";
      form.querySelector("legend").textContent = `Edit Brand DNA · revision ${profile.revision}`;
      progress.textContent = `Question ${currentStep + 1} of ${stepFieldsets.length} · saved revision ${profile.revision}`;
    } catch (error) { const errorOut = form.querySelector("#brand-dna-error"); if (errorOut) errorOut.textContent = error.message; }
  };
  void loadProfile();
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const next = { ...state, voice_weights: {}, prices: {}, guarantees: { status: String(data.get("guarantee_status") || "unknown"), details: String(data.get("guarantee_details") || "") } };
    for (const name of fieldNames) next[name] = String(data.get(name) || "");
    for (const name of ["pain_points", "location_terms", "forbidden_terms", "preferred_ctas", "avoided_ctas", "offer_types", "design_tokens"]) next[name] = String(data.get(name) || "").split(",").map((x) => x.trim()).filter(Boolean);
    for (const name of VOICE_KEYS) next.voice_weights[name] = Number(data.get(`voice_${name}`));
    if (price.value) next.prices.default = price.value;
    if (next.currency) next.currency = String(data.get("currency") || "USD").toUpperCase();
    try {
      const normalized = normalizeBrandDna(next, { revision: Number(profile?.revision || 0), now: profile?.updated_at || new Date().toISOString() });
      review.value = profile?.revision ? `Before (revision ${profile.revision})\n${renderBrandDnaMarkdown(profile)}\nAfter\n${renderBrandDnaMarkdown(normalized)}` : renderBrandDnaMarkdown(normalized);
      if (typeof fetchFn === "function") {
        const response = await fetchFn("/api/groxy/brand-dna/wizard", { method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken }, body: JSON.stringify({ ...normalized, expected_revision: profile?.revision ?? null }) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Brand DNA save failed.");
        profile = result.profile || normalized;
        profile.revision = result.revision ?? profile.revision;
        review.value = `Saved Brand DNA revision ${profile.revision}.`;
      }
      Object.assign(state, normalized);
    } catch (error) { const errorOut = form.querySelector("#brand-dna-error"); if (errorOut) errorOut.textContent = error.message; }
  });
  root.appendChild(section); section.appendChild(form);
  return { section, getProfile: () => ({ ...state }), dispose: () => section.parentNode?.removeChild(section) };
}
