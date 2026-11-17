/** Groxy AI v1.3.0 — deterministic, review-first campaign helpers. */
export const GROXY_VERSION = "1.7.0";
export const BATCH_CAMPAIGN_VERSION = "1.3.0";
const DECIMAL = /^(?:0|[1-9]\d*)(?:\.\d+)?$/;

export function assertBatchBounds(count) {
  if (!Number.isInteger(count) || count < 1 || count > 40) throw new RangeError("item_count must be an integer from 1 through 40.");
  return count;
}

export function normalizeCampaignText(value) {
  return String(value || "").normalize("NFKC").toLocaleLowerCase().replace(/\s+/g, " ").trim();
}

export function makeCampaignSlug(value) {
  return normalizeCampaignText(value).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 75).replace(/-+$/g, "");
}

export function escapeJsonLd(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}

function chooseUnique(base, seen) {
  let candidate = base || "campaign-item";
  let suffix = 2;
  while (seen.has(candidate)) candidate = `${base || "campaign-item"}-${suffix++}`;
  seen.add(candidate);
  return candidate;
}

/** Reproducibly plans candidates. No provider calls and no invented product price. */
export function generateDeterministicCampaign({ brief, item_count, content_type = "post", brand_dna, site_context = {}, prices = {} } = {}) {
  assertBatchBounds(item_count);
  if (!/^\s*[^.!?]+[.!?]?\s*$/.test(String(brief || "")) || String(brief).trim().length < 8 || /[.!?].+\S/.test(String(brief).trim())) throw new TypeError("brief must be a concise one-sentence description.");
  if (!new Set(["post", "product"]).has(content_type)) throw new TypeError("content_type must be post or product.");
  if (!brand_dna || brand_dna.schema !== "brand-dna.v1") throw new TypeError("Complete the Brand DNA wizard before creating a campaign.");
  const briefText = String(brief).trim().replace(/[<>]/g, "");
  const titleSeen = new Set((site_context.entries || []).map((e) => normalizeCampaignText(e.title)));
  const slugSeen = new Set((site_context.entries || []).map((e) => makeCampaignSlug(e.slug || e.title)));
  const titles = [];
  const items = [];
  const variations = ["A practical guide to", "What to know about", "How to choose", "A clear plan for", "Expert tips for", "A local guide to", "A better way to", "The essentials of", "A simple approach to", "What matters in"];
  for (let i = 0; i < item_count; i += 1) {
    const baseTitle = content_type === "product" ? `${brand_dna.business_name} ${briefText}` : `${variations[i % variations.length]} ${briefText}`;
    const title = chooseUnique(baseTitle, titleSeen);
    titles.push(title);
    const slug = chooseUnique(makeCampaignSlug(title), slugSeen);
    const common = {
      title, slug, status: "draft", content_type,
      excerpt: `${title} for ${brand_dna.target_audience}. ${briefText}`.slice(0, 300),
      meta_title: title.slice(0, 60), meta_description: `${briefText} from ${brand_dna.business_name}.`.slice(0, 155),
      headings: [title, "What to consider", "A useful next step"],
      body: `${briefText}\n\n${brand_dna.business_name} helps ${brand_dna.target_audience} address ${brand_dna.pain_points?.[0] || "their needs"}. ${brand_dna.service_area ? `Serving ${brand_dna.service_area}.` : ""}\n\n${brand_dna.preferred_ctas?.[0] || "Learn more"}.`,
      custom_fields: {},
    };
    let schema = null;
    if (content_type === "product") {
      const price = prices.default ?? brand_dna.prices?.default;
      if (typeof price !== "string" || !DECIMAL.test(price)) throw new TypeError("Product campaign requires an exact ADR-025c price string in Brand DNA or the request.");
      const product = { "@context": "https://schema.org", "@type": "Product", name: title, description: common.excerpt, sku: `${slug.toUpperCase().slice(0, 48)}-${String(i + 1).padStart(2, "0")}`, offers: { "@type": "Offer", price, priceCurrency: brand_dna.currency || "USD", availability: "https://schema.org/InStock" } };
      schema = escapeJsonLd(product);
      common.custom_fields = { price, currency: brand_dna.currency || "USD", sku: product.sku };
    } else {
      schema = escapeJsonLd({ "@context": "https://schema.org", "@type": "Article", headline: title, description: common.meta_description });
    }
    items.push({ ...common, schema_json_ld: schema });
  }
  return { schema_version: "1.2.0", content_type, item_count, provider_used: "deterministic", fallback_used: false, items, uniqueness: { titles, slugs: items.map((x) => x.slug) } };
}

export async function requestCampaignPreview({ fetchFn = globalThis.fetch, csrfToken, ...payload } = {}) {
  const response = await fetchFn("/api/groxy/batch-create", { method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken }, body: JSON.stringify(payload) });
  const result = await response.json();
  if (!response.ok) throw Object.assign(new Error(result.error || "Campaign staging failed."), { status: response.status, code: result.code });
  return result;
}

export async function applyCampaignPreview({ fetchFn = globalThis.fetch, csrfToken, batch_id, approval_token } = {}) {
  const response = await fetchFn("/api/groxy/batch-create/apply", { method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken }, body: JSON.stringify({ batch_id, approval_token }) });
  const result = await response.json();
  if (!response.ok) throw Object.assign(new Error(result.error || "Draft creation failed."), { status: response.status, code: result.code });
  return result;
}

function element(doc, tag, attrs = {}, value = "") {
  const node = doc.createElement(tag);
  for (const [key, val] of Object.entries(attrs)) node.setAttribute(key, String(val));
  if (value) node.textContent = value;
  return node;
}

/** Accessible composer; content is rendered with textContent and explicit approval. */
export function mountBatchCampaignStudio({ root, document: doc = globalThis.document, csrfToken = "", fetchFn = globalThis.fetch } = {}) {
  const section = element(doc, "section", { id: "batch-campaign-studio", "aria-labelledby": "batch-campaign-heading" });
  section.appendChild(element(doc, "h2", { id: "batch-campaign-heading" }, "Batch Content & Product Campaigns"));
  const form = element(doc, "form");
  const addInput = (id, labelText, tag = "input", type = "text") => {
    const label = element(doc, "label", { for: id }, labelText); form.appendChild(label);
    const field = element(doc, tag, { id, name: id }); if (tag === "input") field.type = type; form.appendChild(field); return field;
  };
  const contentType = addInput("batch-content-type", "Campaign type", "select");
  for (const v of ["post", "product"]) { const o = element(doc, "option", { value: v }, v); contentType.appendChild(o); }
  const count = addInput("batch-item-count", "Number of items (1–40)", "input", "number"); count.min = "1"; count.max = "40"; count.value = "5";
  addInput("batch-brief", "One-sentence campaign brief", "textarea");
  const price = addInput("batch-price", "Optional exact product price string", "input", "text"); price.inputMode = "decimal";
  const mode = addInput("batch-provider", "Generation mode", "select");
  for (const v of ["deterministic", "ollama", "byok"]) mode.appendChild(element(doc, "option", { value: v }, v));
  const endpoint = addInput("batch-provider-endpoint", "BYOK HTTPS endpoint (must match server allowlist)");
  const submit = element(doc, "button", { type: "submit" }, "Generate and Review Preview"); form.appendChild(submit);
  const status = element(doc, "p", { role: "status", "aria-live": "polite" });
  const preview = element(doc, "section", { "aria-label": "Campaign preview" });
  let staged = null;
  form.addEventListener("submit", async (event) => {
    event.preventDefault(); staged = null; while (preview.firstChild) preview.removeChild(preview.firstChild);
    try {
      staged = await requestCampaignPreview({ fetchFn, csrfToken, brief: form.elements["batch-brief"].value, item_count: Number(count.value), content_type: contentType.value, provider: mode.value, provider_endpoint: endpoint.value || undefined, price: price.value || undefined });
      status.textContent = `Preview ready: ${staged.item_count} items, profile revision ${staged.brand_dna_revision}. Review each item before approval.`;
      for (const item of staged.items || []) {
        const article = element(doc, "article"); article.appendChild(element(doc, "h3", {}, item.title));
        article.appendChild(element(doc, "p", {}, `${item.slug} · ${item.audit?.overall_score}/100 · Grade ${item.audit?.overall_grade}`));
        article.appendChild(element(doc, "p", {}, item.excerpt || ""));
        if (item.schema_json_ld) article.appendChild(element(doc, "pre", {}, item.schema_json_ld));
        preview.appendChild(article);
      }
      const approve = element(doc, "button", { type: "button" }, "Approve & Create Drafts");
      approve.addEventListener("click", async () => {
        approve.disabled = true;
        try { const applied = await applyCampaignPreview({ fetchFn, csrfToken, batch_id: staged.batch_id, approval_token: staged.approval_token }); status.textContent = `Draft creation complete: ${applied.created_count} created, ${applied.failed_count} failed. Status is draft.`; staged = null; }
        catch (error) { status.textContent = error.message; }
      });
      preview.appendChild(approve);
    } catch (error) { status.textContent = error.message; }
  });
  section.appendChild(form); section.appendChild(status); section.appendChild(preview); root.appendChild(section);
  return { section, getStaged: () => staged, dispose: () => section.parentNode?.removeChild(section) };
}
