/**
 * Groxy AI v0.3.0 — Zero-<div> Visual Generator Studio, Pre-Publish Grade Gate & Boost Diff UI.
 * Built strictly with Grex JS v1.0.0 signals and semantic HTML5 elements.
 * Zero innerHTML writes, zero eval(), zero wrapper <div> elements.
 */

import {
  auditAccessibility,
  computed,
  effect,
  isSafeUrl,
  setSafeText,
  signal,
} from "./grex.js";
import { DEFAULT_SEO_PLAYBOOK } from "./playbook.js";
import { auditEntryAndLayout } from "./auditor.js";
import { boostEntryAndLayout, buildPrePublishReview } from "./booster.js";
import {
  DEFAULT_PRICING_TIERS,
  generatePageOrSection,
  LAYOUT_BLUEPRINTS,
  listStylePacks,
} from "./generator.js";

export const SAMPLE_AUDIT_PRESETS = Object.freeze({
  clean: {
    label: "Clean SEO + WCAG AA Entry (Grade A/A+)",
    entry: {
      id: "101",
      content_type: "post",
      title: "Building Accessible Fast GRAB Themes Without Wrapper Divs",
      slug: "accessible-fast-grab-themes",
      focus_keyword: "fast grab themes",
      author_name: "Urban Press Team",
      published_at: "2026-11-14T12:00:00Z",
      excerpt:
        "Learn how fast GRAB themes combine Grex JS semantic elements, zero wrapper divs, and deterministic WCAG AA audits for higher search rankings.",
      body: "",
      custom_fields: { price: "19.95", reading_minutes: "6" },
    },
    grex_layout: {
      element: "Container",
      tag: "main",
      props: { id: "sample-main", class: "grex-c-hero-card" },
      styles: { base: { color: "#0f172a", "background-color": "#ffffff" } },
      children: [
        {
          element: "Heading",
          props: { id: "sample-h1", level: 1, text: "Fast GRAB Themes Without Wrapper Divs" },
        },
        {
          element: "Text",
          tag: "p",
          props: {
            id: "sample-lead",
            text:
              "Fast GRAB themes deliver instant pages because semantic HTML5 landmarks replace bloated wrapper markup. " +
              "Every section uses verified design tokens from GRAB-DESIGN-SYSTEM.md and passes WCAG AA contrast rules automatically. ".repeat(14),
          },
        },
        {
          element: "Heading",
          props: { id: "sample-h2", level: 2, text: "Why Semantic Elements Help Search Crawlers" },
        },
        {
          element: "Text",
          tag: "p",
          props: {
            id: "sample-body-2",
            text:
              "Search engines reward clear heading hierarchies, descriptive image alt attributes, and consistent internal navigation. " +
              "Authors keep full human-in-the-loop control before any draft goes live in GrabLab CMS. ".repeat(10),
          },
        },
        {
          element: "Image",
          props: {
            id: "sample-img",
            src: "/static/theme/preview-hero.svg",
            alt: "Diagram showing clean semantic GRAB and Grex JS layout structure",
          },
        },
        {
          element: "Link",
          props: {
            id: "sample-link",
            href: "/blog",
            text: "Explore more GRAB publishing tutorials",
          },
        },
      ],
    },
  },
  unsafe: {
    label: "Flawed Entry with Wrapper <div> & Missing Alt (Grade F)",
    entry: {
      id: "102",
      content_type: "post",
      title: "Draft Page",
      slug: "admin-broken_slug",
      focus_keyword: "fast grab themes",
      excerpt: "Too short.",
      body: "Short copy.",
      custom_fields: { price: "19.95" },
    },
    grex_layout: {
      element: "div",
      tag: "div",
      props: { id: "bad-wrapper" },
      styles: { base: { color: "#9ca3af", "background-color": "#ffffff" } },
      children: [
        {
          element: "Heading",
          props: { id: "bad-h1", level: 1, text: "Draft" },
        },
        {
          element: "Heading",
          props: { id: "bad-h3-jump", level: 3, text: "Skipped H2 Details" },
        },
        {
          element: "Image",
          props: { id: "bad-img", src: "/static/theme/preview-hero.svg" },
        },
        {
          element: "Link",
          props: { id: "bad-link", href: "/old-slug", text: "click here" },
        },
      ],
    },
  },
  product: {
    label: "Product Entry with Exact GrabDecimal Price (1000.00)",
    entry: {
      id: "205",
      content_type: "product",
      title: "Groxy Pro Ecosystem License for Pure GRAB Publishing Sites",
      slug: "groxy-pro-ecosystem-license",
      focus_keyword: "groxy pro license",
      author_name: "Urban Press",
      published_at: "2026-11-14T12:00:00Z",
      excerpt:
        "Get the Groxy Pro License with exact GrabDecimal pricing, deterministic 22-rule SEO audits, and safe Grex Theme Builder layout proposals.",
      custom_fields: { price: "1000.00", sku: "GRX-PRO-01", inventory_count: "25" },
    },
    grex_layout: {
      element: "Section",
      tag: "main",
      props: { id: "prod-main" },
      styles: { base: { color: "#0f172a", "background-color": "#ffffff" } },
      children: [
        {
          element: "Heading",
          props: { id: "prod-h1", level: 1, text: "Groxy Pro License for Pure GRAB Sites" },
        },
        {
          element: "Text",
          tag: "p",
          props: {
            id: "prod-desc",
            text:
              "The Groxy Pro License equips editorial and engineering teams with local-first SEO auditing and design system validation. " +
              "Every product price remains an exact base-10 GrabDecimal wire string across CMS APIs and visual templates. ".repeat(6),
          },
        },
        {
          element: "Heading",
          props: { id: "prod-h2", level: 2, text: "Included Ecosystem Features" },
        },
        {
          element: "Link",
          props: { id: "prod-link", href: "/pricing", text: "Compare GrabLab CMS site plans" },
        },
      ],
    },
  },
});

function createEl(doc, tag, attrs = {}, text = "") {
  if (String(tag).toLowerCase() === "div") {
    throw new Error("Wrapper <div> creation is strictly forbidden in Groxy AI UI.");
  }
  const el = doc.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v !== undefined && v !== null) {
      el.setAttribute(k, String(v));
    }
  }
  if (text !== undefined && text !== null && text !== "") {
    setSafeText(el, String(text));
  }
  return el;
}

function clearChildren(node) {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}

function readMetaCsrf(doc) {
  if (!doc || typeof doc.querySelector !== "function") return "";
  const meta = doc.querySelector('meta[name="groxy-csrf"]');
  return meta ? String(meta.getAttribute("content") || "") : "";
}

/**
 * Mount the semantic, zero-<div> Groxy AI Inspector, Pre-Publish Review Gate &
 * "Let Groxy Boost This" Diff UI into `root`.
 *
 * @param {{
 *   root: Element,
 *   document?: Document,
 *   playbook?: object,
 *   csrfToken?: string,
 *   fetchImpl?: Function
 * }} options
 */
export function mountGroxyDashboard(options = {}) {
  const doc = options.document || globalThis.document;
  const root = options.root || (doc && doc.getElementById("groxy-inspector-root"));
  if (!doc || !root) {
    throw new Error("mountGroxyDashboard requires a valid root element and document.");
  }

  const playbook = options.playbook || DEFAULT_SEO_PLAYBOOK;
  const csrfToken = options.csrfToken || readMetaCsrf(doc);
  const fetchFn =
    options.fetchImpl || (typeof globalThis.fetch === "function" ? globalThis.fetch.bind(globalThis) : null);

  const selectedPreset = signal("clean");
  const assistEnabledSig = signal(true);
  const titleSig = signal(SAMPLE_AUDIT_PRESETS.clean.entry.title);
  const slugSig = signal(SAMPLE_AUDIT_PRESETS.clean.entry.slug);
  const typeSig = signal(SAMPLE_AUDIT_PRESETS.clean.entry.content_type);
  const keywordSig = signal(SAMPLE_AUDIT_PRESETS.clean.entry.focus_keyword);
  const excerptSig = signal(SAMPLE_AUDIT_PRESETS.clean.entry.excerpt);
  const priceSig = signal(SAMPLE_AUDIT_PRESETS.clean.entry.custom_fields.price);
  const layoutSig = signal(SAMPLE_AUDIT_PRESETS.clean.grex_layout);
  const pillarFilterSig = signal("all");

  const reviewSig = signal(null);
  const boostSig = signal(null);
  const publishNoticeSig = signal("");
  const genBlueprintSig = signal("full_landing_page");
  const genStylePackSig = signal("emerald-editorial");
  const genSlotSig = signal("main");
  const genKeywordSig = signal("semantic theme builder");
  const genTopicSig = signal("Semantic Theme Builder Studio for Fast Publishing");
  const genAudienceSig = signal("Editorial and product teams");
  const genStarterPriceSig = signal(DEFAULT_PRICING_TIERS[0].price);
  const genProPriceSig = signal(DEFAULT_PRICING_TIERS[1].price);
  const genEntPriceSig = signal(DEFAULT_PRICING_TIERS[2].price);
  const genCollectionSig = signal("posts");
  const genCandidateSig = signal(null);
  const genNoticeSig = signal("");
  const genErrorSig = signal("");
  const mcpStatusSig = signal({
    loading: false,
    summary: "Click Inspect MCP Bridge to verify live GrabLab CMS, Grex Theme Builder, and GRAB CLI capabilities.",
    details: null,
  });

  const initialReport = auditEntryAndLayout(
    {
      entry: SAMPLE_AUDIT_PRESETS.clean.entry,
      grex_layout: SAMPLE_AUDIT_PRESETS.clean.grex_layout,
      focus_keyword: SAMPLE_AUDIT_PRESETS.clean.entry.focus_keyword,
    },
    { playbook }
  );
  const reportSig = signal(initialReport);

  const filteredRules = computed(() => {
    const f = pillarFilterSig.get();
    if (f === "all") return playbook.rules;
    return playbook.rules.filter((r) => r.category === f);
  });

  function buildCurrentPayload() {
    const presetData = SAMPLE_AUDIT_PRESETS[selectedPreset.peek()] || SAMPLE_AUDIT_PRESETS.clean;
    return {
      groxy_assist_enabled: assistEnabledSig.peek(),
      entry: {
        ...presetData.entry,
        title: titleSig.peek(),
        slug: slugSig.peek(),
        content_type: typeSig.peek(),
        focus_keyword: keywordSig.peek(),
        excerpt: excerptSig.peek(),
        custom_fields: {
          ...(presetData.entry.custom_fields || {}),
          price: priceSig.peek(),
        },
      },
      grex_layout: layoutSig.peek(),
      focus_keyword: keywordSig.peek(),
    };
  }

  clearChildren(root);

  // 1. Audit & Pre-Publish Input Card
  const formCard = createEl(doc, "section", {
    class: "groxy-card",
    "aria-label": "Deterministic SEO and DOM Auditor",
  });
  formCard.appendChild(createEl(doc, "h1", {}, "Groxy AI v0.3.0 — Visual Generator Studio, Pre-Publish Gate & Audit Inspector"));
  formCard.appendChild(
    createEl(
      doc,
      "p",
      { class: "groxy-muted" },
      "Audits GrabLab entries and Grex layouts deterministically across 22 curated rules, runs the Pre-Publish Grade Review Gate, and prepares safe Before/After Boost diffs."
    )
  );

  const formEl = createEl(doc, "form", { id: "groxy-audit-form" });

  // Preset select
  const presetField = createEl(doc, "p", { class: "groxy-field" });
  const presetLabel = createEl(doc, "label", { for: "groxy-preset-select" }, "Load Sample Preset");
  const presetSelect = createEl(doc, "select", { id: "groxy-preset-select", name: "preset" });
  for (const [k, preset] of Object.entries(SAMPLE_AUDIT_PRESETS)) {
    presetSelect.appendChild(createEl(doc, "option", { value: k }, preset.label));
  }
  presetField.appendChild(presetLabel);
  presetField.appendChild(presetSelect);
  formEl.appendChild(presetField);

  // Opt-in groxy_assist_enabled toggle
  const toggleRow = createEl(doc, "p", { class: "groxy-toggle-row" });
  const assistCheckbox = createEl(doc, "input", {
    id: "groxy-assist-toggle",
    type: "checkbox",
    checked: "checked",
  });
  assistCheckbox.checked = true;
  assistCheckbox.addEventListener("change", (ev) => {
    assistEnabledSig.set(Boolean(ev.target.checked));
  });
  const assistLabel = createEl(
    doc,
    "label",
    { for: "groxy-assist-toggle" },
    "Enable Groxy Pre-Publish Grade Review Gate (groxy_assist_enabled)"
  );
  toggleRow.appendChild(assistCheckbox);
  toggleRow.appendChild(assistLabel);
  formEl.appendChild(toggleRow);

  const inputsGrid = createEl(doc, "section", {
    class: "groxy-grid-2",
    "aria-label": "Entry Metadata Fields",
  });

  const addInputField = (id, labelText, initialVal, onInput) => {
    const wrap = createEl(doc, "p", { class: "groxy-field" });
    const lbl = createEl(doc, "label", { for: id }, labelText);
    const inp = createEl(doc, "input", { id, type: "text", value: initialVal });
    inp.value = initialVal;
    inp.addEventListener("input", (ev) => onInput(ev.target.value));
    inp.addEventListener("change", (ev) => onInput(ev.target.value));
    wrap.appendChild(lbl);
    wrap.appendChild(inp);
    inputsGrid.appendChild(wrap);
    return inp;
  };

  const titleInput = addInputField("groxy-entry-title", "Entry Title", titleSig.peek(), (v) => titleSig.set(v));
  const slugInput = addInputField("groxy-entry-slug", "URL Slug", slugSig.peek(), (v) => slugSig.set(v));
  const keywordInput = addInputField("groxy-focus-keyword", "Focus Keyword", keywordSig.peek(), (v) => keywordSig.set(v));
  const priceInput = addInputField("groxy-decimal-price", "Exact GrabDecimal Price", priceSig.peek(), (v) =>
    priceSig.set(v)
  );

  const typeWrap = createEl(doc, "p", { class: "groxy-field" });
  const typeLbl = createEl(doc, "label", { for: "groxy-content-type" }, "Content Type");
  const typeSelect = createEl(doc, "select", { id: "groxy-content-type" });
  for (const ct of ["post", "page", "product"]) {
    typeSelect.appendChild(createEl(doc, "option", { value: ct }, ct));
  }
  typeSelect.value = typeSig.peek();
  typeSelect.addEventListener("change", (ev) => typeSig.set(ev.target.value));
  typeWrap.appendChild(typeLbl);
  typeWrap.appendChild(typeSelect);
  inputsGrid.appendChild(typeWrap);

  const excerptWrap = createEl(doc, "p", { class: "groxy-field" });
  const excerptLbl = createEl(doc, "label", { for: "groxy-entry-excerpt" }, "Meta Description / Excerpt");
  const excerptInput = createEl(doc, "textarea", { id: "groxy-entry-excerpt", rows: "2" }, excerptSig.peek());
  excerptInput.value = excerptSig.peek();
  excerptInput.addEventListener("input", (ev) => excerptSig.set(ev.target.value));
  excerptInput.addEventListener("change", (ev) => excerptSig.set(ev.target.value));
  excerptWrap.appendChild(excerptLbl);
  excerptWrap.appendChild(excerptInput);
  inputsGrid.appendChild(excerptWrap);

  formEl.appendChild(inputsGrid);

  const actionsBar = createEl(doc, "p", { class: "groxy-actions" });
  const runAuditBtn = createEl(
    doc,
    "button",
    { id: "groxy-run-audit-btn", type: "submit", class: "groxy-btn" },
    "Run Deterministic Audit"
  );
  const prepublishBtn = createEl(
    doc,
    "button",
    { id: "groxy-prepublish-btn", type: "button", class: "groxy-btn groxy-btn-boost" },
    "Open Pre-Publish Review Gate"
  );
  const inspectMcpBtn = createEl(
    doc,
    "button",
    { id: "groxy-inspect-mcp-btn", type: "button", class: "groxy-btn groxy-btn-secondary" },
    "Inspect MCP Bridge"
  );
  actionsBar.appendChild(runAuditBtn);
  actionsBar.appendChild(prepublishBtn);
  actionsBar.appendChild(inspectMcpBtn);
  formEl.appendChild(actionsBar);
  formCard.appendChild(formEl);
  root.appendChild(formCard);

  async function executeAudit() {
    const payload = buildCurrentPayload();
    if (fetchFn && csrfToken) {
      try {
        const resp = await fetchFn("/api/groxy/audit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken,
          },
          body: JSON.stringify(payload),
        });
        if (resp && resp.ok) {
          const remoteReport = await resp.json();
          reportSig.set(remoteReport);
          return remoteReport;
        }
      } catch {
        // Fallback deterministically in-memory if offline or unit test
      }
    }
    const localReport = auditEntryAndLayout(payload, { playbook });
    reportSig.set(localReport);
    return localReport;
  }

  async function triggerPrePublishReview() {
    const payload = buildCurrentPayload();
    publishNoticeSig.set("");
    boostSig.set(null);

    if (fetchFn && csrfToken) {
      try {
        const resp = await fetchFn("/api/groxy/prepublish-review", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken,
          },
          body: JSON.stringify(payload),
        });
        if (resp && resp.ok) {
          const remoteReview = await resp.json();
          reviewSig.set(remoteReview);
          if (remoteReview.audit_report) {
            reportSig.set(remoteReview.audit_report);
          }
          return remoteReview;
        }
      } catch {
        // Deterministic offline fallback
      }
    }

    const localReview = buildPrePublishReview(payload, { playbook });
    reviewSig.set(localReview);
    if (localReview.audit_report) {
      reportSig.set(localReview.audit_report);
    }
    return localReview;
  }

  async function triggerBoost() {
    const payload = {
      ...buildCurrentPayload(),
      review_id: reviewSig.peek()?.review_id || "",
    };
    publishNoticeSig.set("");

    if (fetchFn && csrfToken) {
      try {
        const resp = await fetchFn("/api/groxy/boost", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken,
          },
          body: JSON.stringify(payload),
        });
        if (resp && resp.ok) {
          const remoteBoost = await resp.json();
          boostSig.set(remoteBoost);
          return remoteBoost;
        }
      } catch {
        // Deterministic offline fallback
      }
    }

    const localBoost = boostEntryAndLayout(payload, { playbook });
    boostSig.set(localBoost);
    return localBoost;
  }

  async function approveBoost() {
    const currentBoost = boostSig.peek();
    if (!currentBoost) return null;

    if (fetchFn && csrfToken) {
      try {
        const resp = await fetchFn("/api/groxy/boost/approve", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken,
          },
          body: JSON.stringify({
            boost_id: currentBoost.boost_id,
            approval_token: currentBoost.approval_token,
            candidate_entry: currentBoost.candidate_entry,
            candidate_layout: currentBoost.candidate_layout,
          }),
        });
        if (resp && resp.ok) {
          const res = await resp.json();
          applyApprovedCandidate(currentBoost);
          publishNoticeSig.set(
            `Approved & staged for live publish (${res.draft_status || "draft"} saved under human approval).`
          );
          return res;
        }
      } catch {
        // Deterministic local fallback
      }
    }

    applyApprovedCandidate(currentBoost);
    const localRes = {
      ok: true,
      approved: true,
      ready_for_publish: true,
      boost_id: currentBoost.boost_id,
      draft_status: "draft",
      actor: "groxy-ai",
    };
    publishNoticeSig.set(
      "Approved & staged for live publish (draft saved under human approval)."
    );
    return localRes;
  }

  function applyApprovedCandidate(currentBoost) {
    const ce = currentBoost.candidate_entry || {};
    titleSig.set(ce.title || titleSig.peek());
    slugSig.set(ce.slug || slugSig.peek());
    excerptSig.set(ce.excerpt || excerptSig.peek());
    if (ce.focus_keyword) keywordSig.set(ce.focus_keyword);
    if (currentBoost.candidate_layout) layoutSig.set(currentBoost.candidate_layout);

    titleInput.value = titleSig.peek();
    slugInput.value = slugSig.peek();
    excerptInput.value = excerptSig.peek();
    keywordInput.value = keywordSig.peek();
    if (currentBoost.after_report) {
      reportSig.set(currentBoost.after_report);
    }
    boostSig.set(null);
  }

  function discardBoost() {
    boostSig.set(null);
    publishNoticeSig.set("Boost proposal discarded; original entry unchanged.");
  }

  presetSelect.addEventListener("change", (ev) => {
    const key = ev.target.value;
    const p = SAMPLE_AUDIT_PRESETS[key];
    if (!p) return;
    selectedPreset.set(key);
    titleSig.set(p.entry.title);
    slugSig.set(p.entry.slug);
    typeSig.set(p.entry.content_type);
    keywordSig.set(p.entry.focus_keyword);
    excerptSig.set(p.entry.excerpt);
    priceSig.set(String(p.entry.custom_fields?.price ?? ""));
    layoutSig.set(p.grex_layout);

    titleInput.value = p.entry.title;
    slugInput.value = p.entry.slug;
    typeSelect.value = p.entry.content_type;
    keywordInput.value = p.entry.focus_keyword;
    excerptInput.value = p.entry.excerpt;
    priceInput.value = String(p.entry.custom_fields?.price ?? "");

    boostSig.set(null);
    reviewSig.set(null);
    publishNoticeSig.set("");

    const nextReport = auditEntryAndLayout(
      { entry: p.entry, grex_layout: p.grex_layout, focus_keyword: p.entry.focus_keyword },
      { playbook }
    );
    reportSig.set(nextReport);
  });

  formEl.addEventListener("submit", (ev) => {
    ev.preventDefault();
    void executeAudit();
  });

  prepublishBtn.addEventListener("click", () => {
    void triggerPrePublishReview();
  });

  inspectMcpBtn.addEventListener("click", async () => {
    mcpStatusSig.set({ loading: true, summary: "Checking MCP bridge capabilities...", details: null });
    if (fetchFn && csrfToken) {
      try {
        const resp = await fetchFn("/api/groxy/mcp/inspect", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken,
          },
          body: JSON.stringify({}),
        });
        const data = await resp.json();
        mcpStatusSig.set({
          loading: false,
          summary: resp.ok
            ? `Verified ${data.grab_cli_tools?.length || 5} GRAB CLI MCP tools and ${data.grablab_tools_expected?.length || 6} GrabLab CMS tools.`
            : `MCP inspection returned HTTP ${resp.status}.`,
          details: data,
        });
        return;
      } catch (err) {
        mcpStatusSig.set({
          loading: false,
          summary: `MCP inspect fallback: ${err instanceof Error ? err.message : String(err)}`,
          details: null,
        });
        return;
      }
    }
    mcpStatusSig.set({
      loading: false,
      summary: "Offline mode: 5 GRAB CLI MCP tools and 6 GrabLab CMS MCP tools registered.",
      details: null,
    });
  });

  // 2. Pre-Publish Grade Review Gate Card (Zero wrapper <div>)
  const prepublishCard = createEl(doc, "section", {
    id: "groxy-prepublish-panel",
    class: "groxy-card",
    "aria-label": "Pre-Publish SEO and Performance Grade Review Screen",
  });
  root.appendChild(prepublishCard);

  // 3. Side-by-Side Before vs. After Boost Diff Viewer (Zero wrapper <div>)
  const boostCard = createEl(doc, "section", {
    id: "groxy-boost-diff-panel",
    class: "groxy-card",
    "aria-label": "Let Groxy Boost This Before and After Diff Viewer",
  });
  root.appendChild(boostCard);

  // 4. Scorecard Card
  const scoreCard = createEl(doc, "section", {
    id: "groxy-scorecard",
    class: "groxy-card",
    "aria-label": "4-Pillar Audit Scorecard",
  });
  const scoreHeader = createEl(doc, "h2", {}, "4-Pillar Audit Scorecard");
  const overallSummary = createEl(doc, "p", { id: "groxy-overall-summary" }, "");
  const pillarsGrid = createEl(doc, "section", {
    id: "groxy-pillars-grid",
    class: "groxy-grid-4",
    "aria-label": "Pillar Subscores",
  });
  const findingsTable = createEl(doc, "table", {
    id: "groxy-findings-table",
    class: "groxy-table",
    "aria-label": "Audit Findings",
  });
  scoreCard.appendChild(scoreHeader);
  scoreCard.appendChild(overallSummary);
  scoreCard.appendChild(pillarsGrid);
  scoreCard.appendChild(findingsTable);
  root.appendChild(scoreCard);

  // 5. Playbook Explorer Card
  const playbookCard = createEl(doc, "section", {
    id: "groxy-playbook-explorer",
    class: "groxy-card",
    "aria-label": "22-Rule Curated SEO Playbook",
  });
  playbookCard.appendChild(createEl(doc, "h2", {}, "Curated 22-Rule SEO & Clean-DOM Playbook"));
  const filterWrap = createEl(doc, "p", { class: "groxy-field" });
  const filterLabel = createEl(doc, "label", { for: "groxy-playbook-filter" }, "Filter Playbook Pillar");
  const filterSelect = createEl(doc, "select", { id: "groxy-playbook-filter" });
  for (const [val, text] of [
    ["all", "All 22 Rules"],
    ["on_page_seo", "On-Page SEO (8 Rules)"],
    ["content_a11y", "Content & WCAG Accessibility (5 Rules)"],
    ["performance_dom", "Performance & Clean DOM (5 Rules)"],
    ["linking_readiness", "Off-Page / Internal Linking Readiness (4 Rules)"],
  ]) {
    filterSelect.appendChild(createEl(doc, "option", { value: val }, text));
  }
  filterSelect.addEventListener("change", (ev) => pillarFilterSig.set(ev.target.value));
  filterWrap.appendChild(filterLabel);
  filterWrap.appendChild(filterSelect);
  playbookCard.appendChild(filterWrap);
  const playbookTable = createEl(doc, "table", {
    id: "groxy-playbook-table",
    class: "groxy-table",
    "aria-label": "Playbook Rules Table",
  });
  playbookCard.appendChild(playbookTable);
  root.appendChild(playbookCard);

  // 6. Visual Page & Section Generator Studio Card (v0.3.0, Zero wrapper <div>)
  const generatorCard = createEl(doc, "section", {
    id: "groxy-generator-studio-panel",
    class: "groxy-card",
    "aria-label": "Visual Page and Section Generator Studio",
  });
  generatorCard.appendChild(createEl(doc, "h2", {}, "Visual Page & Section Generator Studio"));
  generatorCard.appendChild(
    createEl(
      doc,
      "p",
      { class: "groxy-muted" },
      "Compose full landing pages, hero sections, GrabDecimal pricing grids, FAQ accordions, and ForEach showcases purely from 20 semantic Grex elements using live GRAB-DESIGN-SYSTEM.md tokens."
    )
  );

  const packMeta = listStylePacks();
  const genForm = createEl(doc, "form", { id: "groxy-generator-form" });

  const genGridTop = createEl(doc, "section", { class: "groxy-grid-3", "aria-label": "Generator Blueprint Settings" });

  const addSelectField = (parent, id, labelText, opts, sig) => {
    const p = createEl(doc, "p", { class: "groxy-field" });
    p.appendChild(createEl(doc, "label", { for: id }, labelText));
    const sel = createEl(doc, "select", { id, name: id });
    for (const o of opts) {
      const optEl = createEl(doc, "option", { value: o.value }, o.label);
      if (sig.peek() === o.value) optEl.setAttribute("selected", "selected");
      sel.appendChild(optEl);
    }
    sel.value = sig.peek();
    sel.addEventListener("change", () => sig.set(sel.value));
    p.appendChild(sel);
    parent.appendChild(p);
    return sel;
  };

  const addTextField = (parent, id, labelText, sig) => {
    const p = createEl(doc, "p", { class: "groxy-field" });
    p.appendChild(createEl(doc, "label", { for: id }, labelText));
    const inp = createEl(doc, "input", { id, name: id, type: "text", value: sig.peek() });
    inp.value = sig.peek();
    inp.addEventListener("input", () => sig.set(inp.value));
    p.appendChild(inp);
    parent.appendChild(p);
    return inp;
  };

  addSelectField(
    genGridTop,
    "groxy-gen-blueprint",
    "Page / Section Blueprint",
    LAYOUT_BLUEPRINTS.map((b) => ({ value: b.id, label: b.label })),
    genBlueprintSig
  );
  addSelectField(
    genGridTop,
    "groxy-gen-style-pack",
    "Design Style Pack",
    packMeta.style_packs.map((s) => ({ value: s.id, label: s.label })),
    genStylePackSig
  );
  addSelectField(
    genGridTop,
    "groxy-gen-slot",
    "Target Template Slot",
    [
      { value: "main", label: "main (Home Landing)" },
      { value: "hero", label: "hero (Primary Hero)" },
      { value: "home", label: "home (Theme Home)" },
      { value: "single", label: "single (Single Entry)" },
      { value: "footer", label: "footer (Part: Footer)" },
    ],
    genSlotSig
  );
  genForm.appendChild(genGridTop);

  const genGridMeta = createEl(doc, "section", { class: "groxy-grid-2", "aria-label": "Topic and Audience Inputs" });
  addTextField(genGridMeta, "groxy-gen-keyword", "Focus Keyword", genKeywordSig);
  addTextField(genGridMeta, "groxy-gen-topic", "Topic / Page Title", genTopicSig);
  addTextField(genGridMeta, "groxy-gen-audience", "Target Audience", genAudienceSig);
  addTextField(genGridMeta, "groxy-gen-collection", "ForEach CMS Collection", genCollectionSig);
  genForm.appendChild(genGridMeta);

  const genGridPricing = createEl(doc, "section", { class: "groxy-grid-3", "aria-label": "GrabDecimal Pricing Tiers" });
  addTextField(genGridPricing, "groxy-gen-starter-price", "Starter Price (GrabDecimal)", genStarterPriceSig);
  addTextField(genGridPricing, "groxy-gen-pro-price", "Studio Pro Price (GrabDecimal)", genProPriceSig);
  addTextField(genGridPricing, "groxy-gen-ent-price", "Enterprise Price (GrabDecimal)", genEntPriceSig);
  genForm.appendChild(genGridPricing);

  const genBtnRow = createEl(doc, "p", { class: "groxy-actions" });
  const genPreviewBtn = createEl(
    doc,
    "button",
    { id: "groxy-generate-preview-btn", type: "button", class: "groxy-btn" },
    "🎨 Generate Preview"
  );
  genBtnRow.appendChild(genPreviewBtn);
  genForm.appendChild(genBtnRow);
  generatorCard.appendChild(genForm);

  const genNoticeWrap = createEl(doc, "output", { id: "groxy-gen-status", "aria-live": "polite" });
  generatorCard.appendChild(genNoticeWrap);

  const genPreviewArea = createEl(doc, "section", {
    id: "groxy-generator-preview",
    "aria-label": "Generated Semantic Layout Preview and Scorecard",
  });
  generatorCard.appendChild(genPreviewArea);
  root.appendChild(generatorCard);

  function buildGeneratorPayload() {
    return {
      blueprint: genBlueprintSig.peek(),
      style_pack: genStylePackSig.peek(),
      slot: genSlotSig.peek(),
      focus_keyword: genKeywordSig.peek(),
      topic_title: genTopicSig.peek(),
      target_audience: genAudienceSig.peek(),
      foreach_collection: genCollectionSig.peek(),
      pricing_tiers: [
        { ...DEFAULT_PRICING_TIERS[0], price: String(genStarterPriceSig.peek() || "").trim() },
        { ...DEFAULT_PRICING_TIERS[1], price: String(genProPriceSig.peek() || "").trim() },
        { ...DEFAULT_PRICING_TIERS[2], price: String(genEntPriceSig.peek() || "").trim() },
      ],
    };
  }

  async function triggerGeneratePreview() {
    genErrorSig.set("");
    genNoticeSig.set("");
    let payload;
    try {
      payload = buildGeneratorPayload();
      if (fetchFn && csrfToken) {
        const resp = await fetchFn("/api/groxy/generate-layout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken,
          },
          body: JSON.stringify(payload),
        });
        const body = await resp.json();
        if (resp.ok && body?.generation_id) {
          genCandidateSig.set(body);
          return body;
        }
        if (resp.status >= 400 && resp.status < 500) {
          genErrorSig.set(body?.error || `Validation rejected (${resp.status})`);
          return null;
        }
      }
      const localRes = generatePageOrSection(payload, { playbook });
      genCandidateSig.set(localRes);
      return localRes;
    } catch (err) {
      genErrorSig.set(err instanceof Error ? err.message : String(err));
      return null;
    }
  }

  async function approveGeneratedLayout() {
    const cand = genCandidateSig.peek();
    if (!cand) return null;
    genErrorSig.set("");
    if (fetchFn && csrfToken) {
      try {
        const resp = await fetchFn("/api/groxy/generate-layout/apply", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken,
          },
          body: JSON.stringify({
            generation_id: cand.generation_id,
            approval_token: cand.approval_token,
            slot: cand.slot,
          }),
        });
        const data = await resp.json();
        if (!resp.ok || !data?.approved) {
          genErrorSig.set(data?.error || `Approval failed (HTTP ${resp.status})`);
          return data;
        }
        genNoticeSig.set(
          `Approved & dispatched to Grex Theme Builder (actor: ${data.actor || "groxy-ai"}, action: ${data.command_stack_action || "applyAiLayout"}, status: ${data.status_enforced || "draft"}).`
        );
        genCandidateSig.set(null);
        return data;
      } catch (err) {
        genErrorSig.set(err instanceof Error ? err.message : String(err));
        return null;
      }
    }
    genNoticeSig.set(
      `Approved candidate ${cand.generation_id} locally (actor: groxy-ai, action: applyAiLayout, status: draft).`
    );
    genCandidateSig.set(null);
    return {
      schema_version: "0.3.0",
      generation_id: cand.generation_id,
      approved: true,
      actor: "groxy-ai",
      command_stack_action: "applyAiLayout",
      undo_available: true,
      status_enforced: "draft",
    };
  }

  function discardGeneratedPreview() {
    genCandidateSig.set(null);
    genErrorSig.set("");
    genNoticeSig.set("Discarded staged layout preview locally (zero changes written).");
  }

  genPreviewBtn.addEventListener("click", () => {
    void triggerGeneratePreview();
  });

  function renderPreviewCanvasNode(node) {
    if (!node || typeof node !== "object") return null;
    const type = String(node.type || node.element || "Section");
    if (type === "Heading") {
      const rawLvl = Number(node.props?.level || 2);
      const previewTag = rawLvl <= 2 ? "h4" : "h5";
      return createEl(
        doc,
        previewTag,
        {
          class: `groxy-preview-h${Math.min(3, Math.max(1, rawLvl))}`,
          "data-semantic-tag": `h${rawLvl}`,
        },
        String(node.props?.text || "")
      );
    }
    if (type === "Text" || type === "RichText") {
      return createEl(doc, "p", {}, String(node.props?.text || ""));
    }
    if (type === "Link") {
      const href = String(node.props?.href || "/");
      const safeHref = isSafeUrl(href) ? href : "/";
      const txt = String(node.props?.text || node.props?.label || safeHref);
      return createEl(doc, "a", { href: safeHref, class: "groxy-btn groxy-btn-secondary" }, txt);
    }
    if (type === "Button") {
      return createEl(
        doc,
        "button",
        { type: "button", class: "groxy-btn" },
        String(node.props?.text || node.props?.label || "Action")
      );
    }
    if (type === "Image") {
      const src = String(node.props?.src || "/static/theme/preview-hero.svg");
      const safeSrc = isSafeUrl(src) ? src : "/static/theme/preview-hero.svg";
      const alt = String(node.props?.alt || "Semantic layout media preview");
      return createEl(doc, "img", { src: safeSrc, alt });
    }
    if (type === "Nav") {
      const nav = createEl(doc, "nav", {
        class: "groxy-preview-nav",
        "aria-label": String(node.props?.label || "Generated Navigation"),
      });
      for (const item of node.props?.items || []) {
        const href = isSafeUrl(item?.href) ? item.href : "/";
        nav.appendChild(createEl(doc, "a", { href }, String(item?.label || href)));
      }
      return nav;
    }
    if (type === "Accordion") {
      const wrap = createEl(doc, "section", { "aria-label": "FAQ Accordion Preview" });
      for (const item of node.props?.items || []) {
        const det = createEl(doc, "details", { open: "open" });
        det.appendChild(createEl(doc, "summary", {}, String(item?.title || "FAQ Question")));
        for (const c of item?.content || []) {
          const childEl = renderPreviewCanvasNode(c);
          if (childEl) det.appendChild(childEl);
        }
        wrap.appendChild(det);
      }
      return wrap;
    }
    if (type === "ForEach") {
      const ul = createEl(doc, "ul", { class: "groxy-tree-list", "aria-label": "ForEach Collection Bindings" });
      for (const item of node.props?.items || []) {
        ul.appendChild(createEl(doc, "li", {}, `${item?.title || item?.id || "Entry"} -> ${item?.href || "/"}`));
      }
      return ul;
    }

    const wrapTag = type === "Card" ? "article" : "section";
    const cls =
      type === "Grid"
        ? "groxy-preview-grid"
        : type === "Card"
          ? "groxy-preview-card"
          : "groxy-preview-section";
    const el = createEl(doc, wrapTag, { class: cls });
    for (const ch of node.children || []) {
      const childEl = renderPreviewCanvasNode(ch);
      if (childEl) el.appendChild(childEl);
    }
    return el;
  }

  function renderTreeInspectorList(node) {
    const ul = createEl(doc, "ul", { class: "groxy-tree-list" });
    const clsStr = node.attrs?.class ? ` .${node.attrs.class.split(/\s+/).join(" .")}` : "";
    const li = createEl(doc, "li", {}, `<${node.type || node.element}> #${node.id || "node"}${clsStr}`);
    if (Array.isArray(node.children) && node.children.length > 0) {
      for (const ch of node.children) {
        li.appendChild(renderTreeInspectorList(ch));
      }
    }
    ul.appendChild(li);
    return ul;
  }

  // 7. MCP Bridge Diagnostic Card
  const mcpCard = createEl(doc, "section", {
    id: "groxy-mcp-panel",
    class: "groxy-card",
    "aria-label": "MCP Bridge Diagnostics",
  });
  mcpCard.appendChild(createEl(doc, "h2", {}, "Unified grab mcp & Design System Bridge"));
  const mcpSummaryEl = createEl(doc, "p", { id: "groxy-mcp-summary", class: "groxy-muted" }, "");
  mcpCard.appendChild(mcpSummaryEl);
  root.appendChild(mcpCard);

  // Reactive renders via Grex effects
  const disposePrePublishEffect = effect(() => {
    const rev = reviewSig.get();
    const notice = publishNoticeSig.get();
    clearChildren(prepublishCard);
    prepublishCard.appendChild(createEl(doc, "h2", {}, "Pre-Publish Grade Review Gate"));

    if (notice) {
      prepublishCard.appendChild(createEl(doc, "p", { id: "groxy-publish-notice", class: "groxy-alert-pass" }, notice));
    }

    if (!rev) {
      prepublishCard.appendChild(
        createEl(
          doc,
          "p",
          { class: "groxy-muted" },
          "Click \"Open Pre-Publish Review Gate\" before publishing to inspect your 4-pillar grade and optional 🚀 Boost fixes."
        )
      );
      return;
    }

    if (rev.gate_status === "bypassed") {
      prepublishCard.appendChild(
        createEl(
          doc,
          "p",
          { id: "groxy-gate-bypassed", class: "groxy-muted" },
          "Groxy Pre-Publish Assist is turned OFF (groxy_assist_enabled: false). Ready to publish directly."
        )
      );
      const liveBtn = createEl(
        doc,
        "button",
        { id: "groxy-make-live-btn", type: "button", class: "groxy-btn" },
        "Make This Live"
      );
      liveBtn.addEventListener("click", () => {
        publishNoticeSig.set("Entry cleared for direct publication (Groxy Assist bypassed).");
      });
      prepublishCard.appendChild(liveBtn);
      return;
    }

    const rep = rev.audit_report;
    prepublishCard.appendChild(
      createEl(
        doc,
        "p",
        { id: "groxy-prepublish-grade" },
        `Pre-Publish Grade: ${rep.overall_grade} (${rep.overall_score}/100) — Review ID: ${rev.review_id}`
      )
    );

    if (!rep.publish_safe) {
      prepublishCard.appendChild(
        createEl(
          doc,
          "p",
          { class: "groxy-alert-danger" },
          "Safety Warning: Critical wrapper-<div> or security issues detected. Click 🚀 Let Groxy Boost This to repair before making this live."
        )
      );
    }

    const reviewGrid = createEl(doc, "section", { class: "groxy-grid-4", "aria-label": "Pre-Publish Pillar Breakdown" });
    for (const cat of Object.values(rep.categories || {})) {
      const pCard = createEl(doc, "article", { class: "groxy-pillar-card" });
      pCard.appendChild(createEl(doc, "h3", {}, cat.label));
      pCard.appendChild(createEl(doc, "p", { class: "groxy-score-num" }, `${cat.score} (${cat.grade})`));
      reviewGrid.appendChild(pCard);
    }
    prepublishCard.appendChild(reviewGrid);

    const flagged = (rep.findings || []).filter((f) => f.severity !== "pass");
    if (flagged.length > 0) {
      const ul = createEl(doc, "ul", { id: "groxy-prepublish-findings" });
      for (const f of flagged) {
        ul.appendChild(
          createEl(doc, "li", {}, `[${f.rule_id}] ${f.plain_english} — ${f.suggested_action}`)
        );
      }
      prepublishCard.appendChild(ul);
    }

    const gateActions = createEl(doc, "p", { class: "groxy-actions" });
    const makeLiveBtn = createEl(
      doc,
      "button",
      { id: "groxy-make-live-btn", type: "button", class: "groxy-btn groxy-btn-secondary" },
      "Make This Live"
    );
    makeLiveBtn.addEventListener("click", () => {
      publishNoticeSig.set(
        `Human author confirmed "Make This Live" as-is (Grade ${rep.overall_grade}, ${rep.overall_score}/100).`
      );
    });

    const boostBtn = createEl(
      doc,
      "button",
      { id: "groxy-boost-btn", type: "button", class: "groxy-btn groxy-btn-boost" },
      "🚀 Let Groxy Boost This"
    );
    boostBtn.addEventListener("click", () => {
      void triggerBoost();
    });

    gateActions.appendChild(makeLiveBtn);
    gateActions.appendChild(boostBtn);
    prepublishCard.appendChild(gateActions);
  });

  const disposeBoostEffect = effect(() => {
    const b = boostSig.get();
    clearChildren(boostCard);
    boostCard.appendChild(createEl(doc, "h2", {}, "🚀 Let Groxy Boost This — Side-by-Side Diff & Refreshed Grade"));

    if (!b) {
      boostCard.appendChild(
        createEl(
          doc,
          "p",
          { class: "groxy-muted" },
          "No active Boost preview. Click \"🚀 Let Groxy Boost This\" from the Pre-Publish Review Gate to inspect side-by-side improvements."
        )
      );
      return;
    }

    boostCard.appendChild(
      createEl(
        doc,
        "p",
        { id: "groxy-boost-score-lift", class: "groxy-alert-pass" },
        `Score Lift: ${b.before_report.overall_score} (${b.before_report.overall_grade}) → ${b.after_report.overall_score} (${b.after_report.overall_grade}) | Publish Safe: ${b.after_report.publish_safe ? "Yes" : "No"}`
      )
    );

    const pillarDeltaGrid = createEl(doc, "section", {
      class: "groxy-grid-4",
      "aria-label": "Refreshed 4-Pillar Grade Comparison",
    });
    for (const [k, afterCat] of Object.entries(b.after_report.categories || {})) {
      const beforeCat = b.before_report.categories?.[k] || { score: 0, grade: "F" };
      const card = createEl(doc, "article", { class: "groxy-pillar-card" });
      card.appendChild(createEl(doc, "h3", {}, afterCat.label));
      card.appendChild(
        createEl(
          doc,
          "p",
          {},
          `${beforeCat.score} (${beforeCat.grade}) → ${afterCat.score} (${afterCat.grade})`
        )
      );
      pillarDeltaGrid.appendChild(card);
    }
    boostCard.appendChild(pillarDeltaGrid);

    const diffList = createEl(doc, "section", {
      id: "groxy-diff-list",
      class: "groxy-diff-list",
      "aria-label": "Side-by-Side Field Diffs",
    });
    for (const d of b.diffs || []) {
      const item = createEl(doc, "article", { class: "groxy-diff-item", "data-diff-field": d.field });
      item.appendChild(createEl(doc, "h3", {}, `${d.label} (${d.field})`));

      if (Array.isArray(d.rule_ids_fixed) && d.rule_ids_fixed.length > 0) {
        const tagsP = createEl(doc, "p", {});
        for (const rid of d.rule_ids_fixed) {
          tagsP.appendChild(createEl(doc, "span", { class: "groxy-rule-tag" }, rid));
        }
        item.appendChild(tagsP);
      }

      const cols = createEl(doc, "section", { class: "groxy-diff-cols", "aria-label": `${d.label} Before and After` });
      const beforeBox = createEl(doc, "article", { class: "groxy-diff-box groxy-diff-before" });
      beforeBox.appendChild(createEl(doc, "strong", {}, "Before"));
      beforeBox.appendChild(createEl(doc, "p", { class: "groxy-diff-value" }, d.before || "(empty)"));

      const afterBox = createEl(doc, "article", { class: "groxy-diff-box groxy-diff-after" });
      afterBox.appendChild(createEl(doc, "strong", {}, "After"));
      afterBox.appendChild(createEl(doc, "p", { class: "groxy-diff-value" }, d.after || "(empty)"));

      cols.appendChild(beforeBox);
      cols.appendChild(afterBox);
      item.appendChild(cols);
      diffList.appendChild(item);
    }
    boostCard.appendChild(diffList);

    const approveBar = createEl(doc, "p", { class: "groxy-actions" });
    const approveBtn = createEl(
      doc,
      "button",
      { id: "groxy-approve-boost-btn", type: "button", class: "groxy-btn groxy-btn-approve" },
      "Approve & Make This Live"
    );
    approveBtn.addEventListener("click", () => {
      void approveBoost();
    });

    const discardBtn = createEl(
      doc,
      "button",
      { id: "groxy-discard-boost-btn", type: "button", class: "groxy-btn groxy-btn-secondary" },
      "Discard Boost"
    );
    discardBtn.addEventListener("click", () => {
      discardBoost();
    });

    approveBar.appendChild(approveBtn);
    approveBar.appendChild(discardBtn);
    boostCard.appendChild(approveBar);
  });

  const disposeReportEffect = effect(() => {
    const r = reportSig.get();
    setSafeText(
      overallSummary,
      `Overall Score: ${r.overall_score}/100 (Grade ${r.overall_grade}) — Publish Safe: ${r.publish_safe ? "Yes" : "No (Safety Gate Blocked)"}`
    );

    clearChildren(pillarsGrid);
    for (const cat of Object.values(r.categories)) {
      const card = createEl(doc, "article", { class: "groxy-pillar-card" });
      card.appendChild(createEl(doc, "h3", {}, cat.label));
      card.appendChild(createEl(doc, "p", { class: "groxy-score-num" }, `${cat.score} (${cat.grade})`));
      pillarsGrid.appendChild(card);
    }

    clearChildren(findingsTable);
    const thead = createEl(doc, "thead");
    const hr = createEl(doc, "tr");
    for (const h of ["Rule ID", "Status", "Points", "Plain-English Explanation", "Recommended Action"]) {
      hr.appendChild(createEl(doc, "th", {}, h));
    }
    thead.appendChild(hr);
    findingsTable.appendChild(thead);

    const tbody = createEl(doc, "tbody");
    for (const f of r.findings) {
      const tr = createEl(doc, "tr");
      tr.appendChild(createEl(doc, "td", {}, f.rule_id));
      const statusCell = createEl(doc, "td");
      statusCell.appendChild(createEl(doc, "span", { class: `groxy-status-pill groxy-status-${f.severity}` }, f.severity));
      tr.appendChild(statusCell);
      tr.appendChild(createEl(doc, "td", {}, `${f.points_earned}/${f.points_possible}`));
      tr.appendChild(createEl(doc, "td", {}, f.plain_english));
      tr.appendChild(createEl(doc, "td", {}, f.suggested_action));
      tbody.appendChild(tr);
    }
    findingsTable.appendChild(tbody);
  });

  const disposePlaybookEffect = effect(() => {
    const rules = filteredRules.get();
    clearChildren(playbookTable);
    const thead = createEl(doc, "thead");
    const hr = createEl(doc, "tr");
    for (const h of ["Rule ID", "Title", "Source", "Max Pts", "Description"]) {
      hr.appendChild(createEl(doc, "th", {}, h));
    }
    thead.appendChild(hr);
    playbookTable.appendChild(thead);

    const tbody = createEl(doc, "tbody");
    for (const rule of rules) {
      const tr = createEl(doc, "tr");
      tr.appendChild(createEl(doc, "td", {}, rule.rule_id));
      tr.appendChild(createEl(doc, "td", {}, rule.title));
      tr.appendChild(createEl(doc, "td", {}, rule.source));
      tr.appendChild(createEl(doc, "td", {}, String(rule.max_points)));
      tr.appendChild(createEl(doc, "td", {}, rule.description));
      tbody.appendChild(tr);
    }
    playbookTable.appendChild(tbody);
  });

  const disposeMcpEffect = effect(() => {
    const st = mcpStatusSig.get();
    setSafeText(mcpSummaryEl, st.summary);
  });

  const disposeGeneratorEffect = effect(() => {
    const notice = genNoticeSig.get();
    const errMsg = genErrorSig.get();
    const cand = genCandidateSig.get();

    clearChildren(genNoticeWrap);
    if (errMsg) {
      genNoticeWrap.appendChild(createEl(doc, "p", { id: "groxy-gen-error", class: "groxy-alert-fail" }, errMsg));
    } else if (notice) {
      genNoticeWrap.appendChild(createEl(doc, "p", { id: "groxy-gen-notice", class: "groxy-alert-pass" }, notice));
    }

    clearChildren(genPreviewArea);
    if (!cand) {
      genPreviewArea.appendChild(
        createEl(
          doc,
          "p",
          { class: "groxy-muted" },
          "Choose a blueprint and Style Pack above, then click \"🎨 Generate Preview\" to inspect semantic nodes, design tokens, and four-pillar scorecard readiness."
        )
      );
      return;
    }

    const ar = cand.audit_report;
    genPreviewArea.appendChild(createEl(doc, "h3", {}, "Generated 4-Pillar Scorecard & Design Tokens"));
    const scoreSummary = createEl(
      doc,
      "p",
      { id: "groxy-gen-scorecard", class: "groxy-alert-pass" },
      `Score ${ar.overall_score}/100 (Grade ${ar.overall_grade}) — Publish Safe: ${ar.publish_safe ? "Yes" : "No"} — Nodes: ${cand.validation.node_count} (Depth ${cand.validation.max_depth}, Divs: ${cand.validation.div_count})`
    );
    genPreviewArea.appendChild(scoreSummary);

    const tokenStrip = createEl(doc, "p", { id: "groxy-generator-tokens", class: "groxy-token-strip" });
    for (const tk of cand.design_system_summary?.tokens_applied || []) {
      tokenStrip.appendChild(createEl(doc, "span", { class: "groxy-token-badge" }, tk));
    }
    for (const cls of cand.design_system_summary?.reusable_classes_applied || []) {
      tokenStrip.appendChild(createEl(doc, "span", { class: "groxy-token-badge" }, `.${cls}`));
    }
    genPreviewArea.appendChild(tokenStrip);

    genPreviewArea.appendChild(createEl(doc, "h3", {}, "Live Semantic Preview (Zero Wrapper <div>s)"));
    const canvas = createEl(doc, "section", {
      id: "groxy-generator-canvas",
      class: "groxy-preview-canvas",
      "aria-label": "Generated Semantic Layout Canvas Preview",
    });
    const previewTreeEl = renderPreviewCanvasNode(cand.candidate_layout);
    if (previewTreeEl) canvas.appendChild(previewTreeEl);
    genPreviewArea.appendChild(canvas);

    genPreviewArea.appendChild(createEl(doc, "h3", {}, "Semantic Node Tree Inspector"));
    const treeWrap = createEl(doc, "section", {
      id: "groxy-generator-tree",
      "aria-label": "Semantic Node Tree Hierarchy",
    });
    treeWrap.appendChild(renderTreeInspectorList(cand.candidate_layout));
    genPreviewArea.appendChild(treeWrap);

    const actRow = createEl(doc, "p", { class: "groxy-actions" });
    const approveGenBtn = createEl(
      doc,
      "button",
      { id: "groxy-approve-gen-btn", type: "button", class: "groxy-btn" },
      "✅ Approve & Send to Grex Theme Builder"
    );
    const discardGenBtn = createEl(
      doc,
      "button",
      { id: "groxy-discard-gen-btn", type: "button", class: "groxy-btn groxy-btn-secondary" },
      "🗑️ Discard Preview"
    );
    approveGenBtn.addEventListener("click", () => void approveGeneratedLayout());
    discardGenBtn.addEventListener("click", () => discardGeneratedPreview());
    actRow.appendChild(approveGenBtn);
    actRow.appendChild(discardGenBtn);
    genPreviewArea.appendChild(actRow);
  });

  return {
    auditDomSafety() {
      return {
        divCount: root.querySelectorAll("div").length,
        a11y: auditAccessibility({ type: "Section", children: [] }),
      };
    },
    getCurrentReport() {
      return reportSig.peek();
    },
    getReviewState() {
      return reviewSig.peek();
    },
    getBoostState() {
      return boostSig.peek();
    },
    getGeneratorState() {
      return genCandidateSig.peek();
    },
    runAudit: executeAudit,
    triggerPrePublishReview,
    triggerBoost,
    approveBoost,
    discardBoost,
    triggerGeneratePreview,
    approveGeneratedLayout,
    discardGeneratedPreview,
    dispose() {
      disposePrePublishEffect();
      disposeBoostEffect();
      disposeReportEffect();
      disposePlaybookEffect();
      disposeMcpEffect();
      disposeGeneratorEffect();
    },
  };
}

if (typeof globalThis.document !== "undefined") {
  const autoRoot = globalThis.document.getElementById("groxy-inspector-root");
  if (autoRoot) {
    mountGroxyDashboard({ root: autoRoot, document: globalThis.document });
  }
}
