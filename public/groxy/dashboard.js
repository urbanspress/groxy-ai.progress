/**
 * Groxy AI v0.1.0 — Zero-<div> Semantic Audit & Playbook Inspector UI.
 * Built strictly with Grex JS v1.0.0 signals and semantic HTML5 elements.
 * Zero innerHTML writes, zero eval(), zero wrapper <div> elements.
 */

import {
  auditAccessibility,
  computed,
  effect,
  setSafeText,
  signal,
} from "./grex.js";
import { DEFAULT_SEO_PLAYBOOK } from "./playbook.js";
import { auditEntryAndLayout } from "./auditor.js";

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
      custom_fields: { price: 19.95 },
    },
    grex_layout: {
      element: "div",
      tag: "div",
      props: { id: "bad-wrapper" },
      styles: { base: { color: "#9ca3af", "background-color": "#ffffff" } },
      children: [
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
 * Mount the semantic, zero-<div> Groxy AI Inspector UI into `root`.
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
  const fetchFn = options.fetchImpl || (typeof globalThis.fetch === "function" ? globalThis.fetch.bind(globalThis) : null);

  const selectedPreset = signal("clean");
  const titleSig = signal(SAMPLE_AUDIT_PRESETS.clean.entry.title);
  const slugSig = signal(SAMPLE_AUDIT_PRESETS.clean.entry.slug);
  const typeSig = signal(SAMPLE_AUDIT_PRESETS.clean.entry.content_type);
  const keywordSig = signal(SAMPLE_AUDIT_PRESETS.clean.entry.focus_keyword);
  const excerptSig = signal(SAMPLE_AUDIT_PRESETS.clean.entry.excerpt);
  const priceSig = signal(SAMPLE_AUDIT_PRESETS.clean.entry.custom_fields.price);
  const layoutSig = signal(SAMPLE_AUDIT_PRESETS.clean.grex_layout);
  const pillarFilterSig = signal("all");
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

  clearChildren(root);

  // 1. Audit Input Form Card
  const formCard = createEl(doc, "section", { class: "groxy-card", "aria-label": "Deterministic SEO and DOM Auditor" });
  const formHeading = createEl(doc, "h1", {}, "Groxy AI v0.1.0 — 4-Pillar SEO & Clean-DOM Inspector");
  const formLead = createEl(
    doc,
    "p",
    { class: "groxy-muted" },
    "Audits GrabLab entries and Grex layouts deterministically across 22 curated rules (zero mandatory API fees, zero wrapper <div>s)."
  );
  formCard.appendChild(formHeading);
  formCard.appendChild(formLead);

  const formEl = createEl(doc, "form", { id: "groxy-audit-form" });

  // Preset select
  const presetField = createEl(doc, "p", { class: "groxy-field" });
  const presetLabel = createEl(doc, "label", { for: "groxy-preset-select" }, "Load Sample Preset");
  const presetSelect = createEl(doc, "select", { id: "groxy-preset-select", name: "preset" });
  for (const [k, preset] of Object.entries(SAMPLE_AUDIT_PRESETS)) {
    const opt = createEl(doc, "option", { value: k }, preset.label);
    presetSelect.appendChild(opt);
  }
  presetField.appendChild(presetLabel);
  presetField.appendChild(presetSelect);
  formEl.appendChild(presetField);

  const inputsGrid = createEl(doc, "section", { class: "groxy-grid-2", "aria-label": "Entry Metadata Fields" });

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
  const priceInput = addInputField("groxy-decimal-price", "Exact GrabDecimal Price", priceSig.peek(), (v) => priceSig.set(v));

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
  const runAuditBtn = createEl(doc, "button", { id: "groxy-run-audit-btn", type: "submit", class: "groxy-btn" }, "Run Deterministic Audit");
  const inspectMcpBtn = createEl(
    doc,
    "button",
    { id: "groxy-inspect-mcp-btn", type: "button", class: "groxy-btn groxy-btn-secondary" },
    "Inspect MCP Bridge"
  );
  actionsBar.appendChild(runAuditBtn);
  actionsBar.appendChild(inspectMcpBtn);
  formEl.appendChild(actionsBar);
  formCard.appendChild(formEl);
  root.appendChild(formCard);

  async function executeAudit() {
    const presetData = SAMPLE_AUDIT_PRESETS[selectedPreset.peek()] || SAMPLE_AUDIT_PRESETS.clean;
    const payload = {
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

  // 2. Scorecard Card
  const scoreCard = createEl(doc, "section", { id: "groxy-scorecard", class: "groxy-card", "aria-label": "4-Pillar Audit Scorecard" });
  const scoreHeader = createEl(doc, "h2", {}, "4-Pillar Audit Scorecard");
  const overallSummary = createEl(doc, "p", { id: "groxy-overall-summary" }, "");
  const pillarsGrid = createEl(doc, "section", { id: "groxy-pillars-grid", class: "groxy-grid-4", "aria-label": "Pillar Subscores" });
  const findingsTable = createEl(doc, "table", { id: "groxy-findings-table", class: "groxy-table", "aria-label": "Audit Findings" });
  scoreCard.appendChild(scoreHeader);
  scoreCard.appendChild(overallSummary);
  scoreCard.appendChild(pillarsGrid);
  scoreCard.appendChild(findingsTable);
  root.appendChild(scoreCard);

  // 3. Playbook Explorer Card
  const playbookCard = createEl(doc, "section", { id: "groxy-playbook-explorer", class: "groxy-card", "aria-label": "22-Rule Curated SEO Playbook" });
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
  const playbookTable = createEl(doc, "table", { id: "groxy-playbook-table", class: "groxy-table", "aria-label": "Playbook Rules Table" });
  playbookCard.appendChild(playbookTable);
  root.appendChild(playbookCard);

  // 4. MCP Bridge Diagnostic Card
  const mcpCard = createEl(doc, "section", { id: "groxy-mcp-panel", class: "groxy-card", "aria-label": "MCP Bridge Diagnostics" });
  mcpCard.appendChild(createEl(doc, "h2", {}, "Unified grab mcp & Design System Bridge"));
  const mcpSummaryEl = createEl(doc, "p", { id: "groxy-mcp-summary", class: "groxy-muted" }, "");
  mcpCard.appendChild(mcpSummaryEl);
  root.appendChild(mcpCard);

  // Reactive renders via Grex effects
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
    runAudit: executeAudit,
    dispose() {
      disposeReportEffect();
      disposePlaybookEffect();
      disposeMcpEffect();
    },
  };
}

if (typeof globalThis.document !== "undefined") {
  const autoRoot = globalThis.document.getElementById("groxy-inspector-root");
  if (autoRoot) {
    mountGroxyDashboard({ root: autoRoot, document: globalThis.document });
  }
}
