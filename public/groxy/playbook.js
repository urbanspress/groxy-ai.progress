/**
 * Groxy AI v1.1.0 — Curated SEO Playbook & GRAB-DESIGN-SYSTEM.md Parser.
 * Zero external dependencies; encodes deterministic rules distilled from
 * Google Search Central, Semrush, Ahrefs, Grex WCAG AA, and GRAB ADR-025c.
 */

export const GROXY_VERSION = "1.3.0";

export const EXPECTED_RULE_IDS = Object.freeze([
  "GROXY-SEO-001",
  "GROXY-SEO-002",
  "GROXY-SEO-003",
  "GROXY-SEO-004",
  "GROXY-SEO-005",
  "GROXY-SEO-006",
  "GROXY-SEO-007",
  "GROXY-SEO-008",
  "GROXY-A11Y-001",
  "GROXY-A11Y-002",
  "GROXY-A11Y-003",
  "GROXY-A11Y-004",
  "GROXY-A11Y-005",
  "GROXY-DOM-001",
  "GROXY-DOM-002",
  "GROXY-DOM-003",
  "GROXY-DOM-004",
  "GROXY-DOM-005",
  "GROXY-LINK-001",
  "GROXY-LINK-002",
  "GROXY-LINK-003",
  "GROXY-LINK-004",
]);

export const DEFAULT_SEO_PLAYBOOK = Object.freeze({
  schema_version: "0.1.0",
  playbook_version: "1.0.0",
  name: "Groxy AI Curated SEO, Accessibility & Clean-DOM Playbook",
  updated_at: "2026-11-14",
  pillars: {
    on_page_seo: {
      key: "on_page_seo",
      label: "On-Page SEO",
      weight: 25,
      max_points: 100,
    },
    content_a11y: {
      key: "content_a11y",
      label: "Content & WCAG Accessibility",
      weight: 25,
      max_points: 100,
    },
    performance_dom: {
      key: "performance_dom",
      label: "Performance & Clean DOM",
      weight: 25,
      max_points: 100,
    },
    linking_readiness: {
      key: "linking_readiness",
      label: "Off-Page / Internal Linking Readiness",
      weight: 25,
      max_points: 100,
    },
  },
  grade_scale: [
    {
      grade: "A+",
      min: 97,
      max: 100,
      summary: "Exceptional — ready to publish with top search, accessibility, and clean-DOM signals",
    },
    {
      grade: "A",
      min: 90,
      max: 96,
      summary: "Strong — passes all critical standards with only minor polish ideas",
    },
    {
      grade: "B",
      min: 80,
      max: 89,
      summary: "Good — solid foundation; quick Groxy improvements will raise search & UX quality",
    },
    {
      grade: "C",
      min: 70,
      max: 79,
      summary: "Fair — noticeable SEO, heading, alt-text, or contrast gaps to address",
    },
    {
      grade: "D",
      min: 60,
      max: 69,
      summary: "Needs Work — significant structural, SEO, or accessibility defects",
    },
    {
      grade: "F",
      min: 0,
      max: 59,
      summary: "Failing / Unsafe — critical SEO, WCAG AA, wrapper-<div>, or security issues present",
    },
  ],
  reserved_slug_prefixes: [
    "admin",
    "api",
    "static",
    "_health",
    "_ready",
    "groxy",
    "studio",
    "preview",
  ],
  stop_words: [
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "by",
    "for",
    "from",
    "in",
    "is",
    "it",
    "of",
    "on",
    "or",
    "that",
    "the",
    "this",
    "to",
    "was",
    "with",
  ],
  vague_anchors: [
    "click here",
    "read more",
    "learn more",
    "here",
    "link",
    "this",
    "more",
    "website",
    "page",
    "view more",
  ],
  allowed_grex_elements: [
    "Section",
    "Container",
    "Grid",
    "Stack",
    "Card",
    "Heading",
    "Text",
    "RichText",
    "Link",
    "Button",
    "Image",
    "Icon",
    "Form",
    "Input",
    "Select",
    "Tabs",
    "Accordion",
    "Modal",
    "Nav",
    "ForEach",
  ],
  rules: [
    {
      rule_id: "GROXY-SEO-001",
      category: "on_page_seo",
      title: "Optimal SEO Title Length",
      source: "Google Search Central / Semrush",
      max_points: 15,
      critical_safety: false,
      description:
        "Title tag or entry.title exists and spans 30-65 characters (50-60 characters optimal to avoid SERP truncation).",
    },
    {
      rule_id: "GROXY-SEO-002",
      category: "on_page_seo",
      title: "Focus Keyword Alignment & Natural Density",
      source: "Semrush / Ahrefs",
      max_points: 15,
      critical_safety: false,
      description:
        "Target focus keyword (or inferred topic term) appears naturally in title and primary H1/opening copy with <= 3% density.",
    },
    {
      rule_id: "GROXY-SEO-003",
      category: "on_page_seo",
      title: "Meta Description / Excerpt Length",
      source: "Google Search Central / Semrush",
      max_points: 15,
      critical_safety: false,
      description:
        "Meta description or entry.excerpt is present and 120-158 characters (<= 160 max to avoid search snippet clipping).",
    },
    {
      rule_id: "GROXY-SEO-004",
      category: "on_page_seo",
      title: "Clean Lowercase Hyphenated URL Slug",
      source: "Google Search Central / GrabLab",
      max_points: 10,
      critical_safety: false,
      description:
        "Slug matches ^[a-z0-9]+(?:-[a-z0-9]+)*$, stays <= 75 chars, avoids stop-word bloat, and never collides with reserved route prefixes.",
    },
    {
      rule_id: "GROXY-SEO-005",
      category: "on_page_seo",
      title: "Single Primary H1 Heading",
      source: "Ahrefs / Google Search Central",
      max_points: 15,
      critical_safety: false,
      description:
        "Exactly one <h1> (Heading level 1) exists in the primary content flow matching page search intent.",
    },
    {
      rule_id: "GROXY-SEO-006",
      category: "on_page_seo",
      title: "Content Depth & Subheading Scannability",
      source: "Semrush / Ahrefs",
      max_points: 15,
      critical_safety: false,
      description:
        "Substantive editorial copy (>= 300 words for post/article or >= 120 words for page/product) structured with H2/H3 subheadings.",
    },
    {
      rule_id: "GROXY-SEO-007",
      category: "on_page_seo",
      title: "Site-Wide Title & Slug Uniqueness",
      source: "Ahrefs Site Audit",
      max_points: 10,
      critical_safety: false,
      description:
        "Zero duplicate title or colliding slug across site entries returned by query_entries.",
    },
    {
      rule_id: "GROXY-SEO-008",
      category: "on_page_seo",
      title: "Exact GrabDecimal / GrabInteger Numeric Integrity",
      source: "GRAB ADR-025c / Google Merchant",
      max_points: 5,
      critical_safety: false,
      description:
        "Structured numeric custom fields preserve exact base-10 wire strings with zero IEEE-754 float coercion or NaN drift.",
    },
    {
      rule_id: "GROXY-A11Y-001",
      category: "content_a11y",
      title: "WCAG AA Color Contrast Ratio",
      source: "GREX-A11Y-001 / WCAG 2.1 AA",
      max_points: 25,
      critical_safety: false,
      description:
        "Text/background color pairs across nodes and --grex-* tokens meet >= 4.5:1 (>= 3.0:1 for large text).",
    },
    {
      rule_id: "GROXY-A11Y-002",
      category: "content_a11y",
      title: "Descriptive Image Alt Text",
      source: "GREX-A11Y-002 / WCAG 2.1 AA",
      max_points: 25,
      critical_safety: false,
      description:
        "Every Image supplies descriptive alt text (3-125 chars, not a raw filename) or explicit decorative: true / isDecorative: true.",
    },
    {
      rule_id: "GROXY-A11Y-003",
      category: "content_a11y",
      title: "Accessible Form Input & Select Labels",
      source: "GREX-A11Y-003 / WCAG 2.1 AA",
      max_points: 15,
      critical_safety: false,
      description:
        "Every Input and Select exposes a non-empty label, aria-label, or aria-labelledby.",
    },
    {
      rule_id: "GROXY-A11Y-004",
      category: "content_a11y",
      title: "Sequential Semantic Heading Hierarchy",
      source: "GREX-A11Y-004 / WCAG 2.1 AA",
      max_points: 20,
      critical_safety: false,
      description:
        "Heading levels (h1 -> h2 -> h3...) advance sequentially with zero skipped heading levels.",
    },
    {
      rule_id: "GROXY-A11Y-005",
      category: "content_a11y",
      title: "Accessible Interactive Controls & Focus Rings",
      source: "GREX-A11Y-005 / WCAG 2.1 AA",
      max_points: 15,
      critical_safety: false,
      description:
        "Every Button and Link provides a non-empty accessible label and preserves visible :focus-visible outlines.",
    },
    {
      rule_id: "GROXY-DOM-001",
      category: "performance_dom",
      title: "Zero Wrapper-<div> Guarantee",
      source: "GREX-SCHEMA-001 / Grex JS v1.0.0",
      max_points: 25,
      critical_safety: true,
      description:
        "Layout tree and rendered HTML contain zero <div> wrapper tags (any <div> forces overall grade F and publish_safe: false).",
    },
    {
      rule_id: "GROXY-DOM-002",
      category: "performance_dom",
      title: "Strict 20-Element Grex Semantic Allowlist",
      source: "grex.elements.json / Grex JS v1.0.0",
      max_points: 20,
      critical_safety: false,
      description:
        "All nodes belong strictly to the 20 Grex elements with allowed semantic HTML5 tags (section, main, header, nav, article, aside, footer).",
    },
    {
      rule_id: "GROXY-DOM-003",
      category: "performance_dom",
      title: "Zero XSS, Inline Script & Unsafe URL Guard",
      source: "GREX-SEC-003 / GREX-SEC-004",
      max_points: 25,
      critical_safety: true,
      description:
        "Zero <script>, <iframe>, <object>, <style>, on* handlers, innerHTML/srcdoc, unsafe protocols, or CSS expression() (violation caps Clean DOM at 0 and grade at F).",
    },
    {
      rule_id: "GROXY-DOM-004",
      category: "performance_dom",
      title: "DOM Depth & Lean Node Budget",
      source: "GREX-BUILDER-SPEC-100",
      max_points: 15,
      critical_safety: false,
      description:
        "Layout nesting stays <= 24 levels (<= 10 optimal) and total node count stays <= 150 nodes.",
    },
    {
      rule_id: "GROXY-DOM-005",
      category: "performance_dom",
      title: "GRAB-DESIGN-SYSTEM.md Token & Class Fidelity",
      source: "GRAB-DESIGN-SYSTEM.md / Grex Theme Builder",
      max_points: 15,
      critical_safety: false,
      description:
        "Reuses registered --grex-* tokens and .grex-c-* utility classes instead of unknown classes or excessive inline style overrides.",
    },
    {
      rule_id: "GROXY-LINK-001",
      category: "linking_readiness",
      title: "Internal Link Presence & Descriptive Anchors",
      source: "Ahrefs / Google Search Central",
      max_points: 30,
      critical_safety: false,
      description:
        "Includes descriptive internal links (1-2 per 500 words) without vague anchors such as click here or read more.",
    },
    {
      rule_id: "GROXY-LINK-002",
      category: "linking_readiness",
      title: "Broken Link, Loop & 301 Slug History Guard",
      source: "GrabLab 301 Redirect Guard / Ahrefs",
      max_points: 30,
      critical_safety: false,
      description:
        "Detects self-loops, broken internal targets, and links pointing to superseded 301 redirect slugs instead of canonical URLs.",
    },
    {
      rule_id: "GROXY-LINK-003",
      category: "linking_readiness",
      title: "Navigation & Orphan Page Discoverability",
      source: "Ahrefs Site Audit / GrabLab Menus",
      max_points: 20,
      critical_safety: false,
      description:
        "Checks whether the entry is reachable from site navigation menus or sibling internal links.",
    },
    {
      rule_id: "GROXY-LINK-004",
      category: "linking_readiness",
      title: "Schema.org Rich Result Metadata Readiness",
      source: "Google Search Central Structured Data",
      max_points: 20,
      critical_safety: false,
      description:
        "Verifies required metadata for structured data output (author/date/excerpt for posts, exact GrabDecimal price/SKU for products, headings for pages).",
    },
  ],
});

/**
 * Validate a curated SEO playbook structure and return normalized rule lookup maps.
 * @param {object} playbook
 * @returns {object}
 */
export function validatePlaybook(playbook) {
  if (!playbook || typeof playbook !== "object") {
    throw new Error("SEO playbook must be a JSON object.");
  }
  if (!playbook.playbook_version || !playbook.schema_version) {
    throw new Error("SEO playbook missing schema_version or playbook_version.");
  }
  const pillars = playbook.pillars || {};
  const requiredPillars = ["on_page_seo", "content_a11y", "performance_dom", "linking_readiness"];
  let weightSum = 0;
  for (const key of requiredPillars) {
    if (!pillars[key] || typeof pillars[key] !== "object") {
      throw new Error(`SEO playbook missing required pillar "${key}".`);
    }
    weightSum += Number(pillars[key].weight || 0);
  }
  if (weightSum !== 100) {
    throw new Error(`SEO playbook pillar weights must sum to 100; got ${weightSum}.`);
  }
  if (!Array.isArray(playbook.rules) || playbook.rules.length !== 22) {
    throw new Error(`SEO playbook must define exactly 22 rules; got ${playbook.rules?.length || 0}.`);
  }

  const ruleMap = Object.create(null);
  const categoryTotals = {
    on_page_seo: 0,
    content_a11y: 0,
    performance_dom: 0,
    linking_readiness: 0,
  };

  for (const rule of playbook.rules) {
    if (!rule || typeof rule !== "object" || !rule.rule_id || !rule.category) {
      throw new Error("Invalid playbook rule entry.");
    }
    if (ruleMap[rule.rule_id]) {
      throw new Error(`Duplicate playbook rule_id "${rule.rule_id}".`);
    }
    if (!(rule.category in categoryTotals)) {
      throw new Error(`Unknown pillar category "${rule.category}" on rule "${rule.rule_id}".`);
    }
    const maxPts = Number(rule.max_points);
    if (!Number.isInteger(maxPts) || maxPts <= 0) {
      throw new Error(`Invalid max_points on rule "${rule.rule_id}".`);
    }
    categoryTotals[rule.category] += maxPts;
    ruleMap[rule.rule_id] = rule;
  }

  for (const reqId of EXPECTED_RULE_IDS) {
    if (!ruleMap[reqId]) {
      throw new Error(`SEO playbook missing expected rule "${reqId}".`);
    }
  }
  for (const [cat, total] of Object.entries(categoryTotals)) {
    if (total !== 100) {
      throw new Error(`Pillar "${cat}" rule max_points must sum to 100; got ${total}.`);
    }
  }

  return playbook;
}

/**
 * Load and validate a playbook synchronously or asynchronously.
 * @param {object | string} [source]
 * @param {{ fetchImpl?: Function }} [options]
 * @returns {Promise<object>}
 */
export async function loadPlaybook(source = DEFAULT_SEO_PLAYBOOK, options = {}) {
  if (source && typeof source === "object") {
    return validatePlaybook(source);
  }
  if (typeof source === "string" && source.trim() !== "") {
    const trimmed = source.trim();
    if (trimmed.startsWith("{")) {
      return validatePlaybook(JSON.parse(trimmed));
    }
    const fetchFn = options.fetchImpl || globalThis.fetch;
    if (
      typeof process !== "undefined" &&
      process.versions?.node &&
      !/^(https?:|data:|file:)/i.test(trimmed) &&
      !trimmed.startsWith("/")
    ) {
      const fsMod = await import("node:fs/promises");
      const raw = await fsMod.readFile(trimmed, "utf8");
      return validatePlaybook(JSON.parse(raw));
    }
    if (typeof fetchFn === "function") {
      const resp = await fetchFn(trimmed, { headers: { Accept: "application/json" } });
      if (!resp || !resp.ok) {
        throw new Error(`Failed to load SEO playbook from ${trimmed}`);
      }
      const data = await resp.json();
      return validatePlaybook(data);
    }
  }
  return validatePlaybook(DEFAULT_SEO_PLAYBOOK);
}

/**
 * Deterministically parse Grex Theme Builder's `GRAB-DESIGN-SYSTEM.md` markdown contract
 * into an immutable DesignSystemContract object.
 * Supports output from both `theme/assets/design-system.js` and `src/studio.grab`.
 *
 * @param {string} markdownText
 * @returns {object}
 */
export function parseDesignSystemMarkdown(markdownText) {
  const text = typeof markdownText === "string" ? markdownText : "";
  const lines = text.split(/\r?\n/);

  const tokens = {};
  const modes = { light: {}, dark: {} };
  const reusableClasses = {};
  const elements = [];
  const activeSlots = [];
  const templateRegistry = [];

  let section = "";
  let subSection = "";
  let currentClassName = "";

  const stripBackticks = (raw) => {
    const trimmed = String(raw || "").trim();
    if (trimmed.startsWith("`") && trimmed.endsWith("`") && trimmed.length >= 2) {
      return trimmed.slice(1, -1).trim();
    }
    return trimmed;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    if (line.startsWith("## 1.")) {
      section = "tokens";
      subSection = "";
      continue;
    }
    if (line.startsWith("## 2.")) {
      section = "classes";
      subSection = "";
      currentClassName = "";
      continue;
    }
    if (line.startsWith("## 3.")) {
      section = "elements";
      subSection = "";
      continue;
    }
    if (line.startsWith("## 4.")) {
      section = "slots";
      subSection = "";
      continue;
    }

    if (section === "tokens") {
      if (line.startsWith("### Base")) {
        subSection = "base";
        continue;
      }
      if (/^###\s+Light Mode/i.test(line) || /^###\s+Mode:\s*`?light`?/i.test(line)) {
        subSection = "light";
        continue;
      }
      if (/^###\s+Dark Mode/i.test(line) || /^###\s+Mode:\s*`?dark`?/i.test(line)) {
        subSection = "dark";
        continue;
      }
      if (line.startsWith("|")) {
        const cols = line
          .split("|")
          .slice(1, -1)
          .map((c) => stripBackticks(c));
        if (cols.length >= 2 && cols[0].startsWith("--grex-")) {
          const tokenName = cols[0];
          const tokenVal = cols[1];
          if (subSection === "light") {
            modes.light[tokenName] = tokenVal;
          } else if (subSection === "dark") {
            modes.dark[tokenName] = tokenVal;
          } else {
            tokens[tokenName] = tokenVal;
          }
        }
      } else {
        const bulletTok = /^-\s+`?(--grex-[a-zA-Z0-9_-]+)`?\s*:\s*`?([^`]+)`?$/.exec(line);
        if (bulletTok) {
          const tokenName = bulletTok[1].trim();
          const tokenVal = bulletTok[2].trim();
          if (subSection === "light") {
            modes.light[tokenName] = tokenVal;
          } else if (subSection === "dark") {
            modes.dark[tokenName] = tokenVal;
          } else {
            tokens[tokenName] = tokenVal;
          }
        }
      }
    } else if (section === "classes") {
      const clsMatch = /^(?:-\s+(?:\*\*)?`?\.grex-c-([a-zA-Z0-9_-]+)`?(?:\*\*)?|###\s+`?\.grex-c-([a-zA-Z0-9_-]+)`?)/.exec(line);
      if (clsMatch) {
        currentClassName = clsMatch[1] || clsMatch[2];
        if (!reusableClasses[currentClassName]) {
          reusableClasses[currentClassName] = {};
        }
        continue;
      }
      if (currentClassName) {
        const bpMatch = /^-\s+`?(base|tablet|mobile)`?:\s+`?([^`]+)`?$/i.exec(line);
        if (bpMatch) {
          const bp = bpMatch[1].toLowerCase();
          const stylePairs = {};
          for (const decl of bpMatch[2].split(";")) {
            const idx = decl.indexOf(":");
            if (idx > 0) {
              const prop = decl.slice(0, idx).trim();
              const val = decl.slice(idx + 1).trim();
              if (prop && val) {
                stylePairs[prop] = val;
              }
            }
          }
          reusableClasses[currentClassName][bp] = stylePairs;
        }
      }
    } else if (section === "elements") {
      if (line.startsWith("|")) {
        const cols = line
          .split("|")
          .slice(1, -1)
          .map((c) => stripBackticks(c));
        if (cols.length >= 3 && cols[0] !== "Element" && !cols[0].startsWith("---")) {
          elements.push({
            name: cols[0],
            category: cols[1],
            defaultTag: cols[2].replace(/^<|>$/g, ""),
          });
        }
      } else if (/^-\s+\*\*Approved 20 Elements:\*\*/i.test(line)) {
        const matches = line.match(/`([A-Za-z]+)`/g) || [];
        for (const m of matches) {
          const elName = stripBackticks(m);
          if (elName && !elements.some((e) => e.name === elName)) {
            elements.push({ name: elName, category: "grex", defaultTag: "" });
          }
        }
      }
    } else if (section === "slots") {
      if (line.startsWith("- **Active Slots")) {
        const matches = line.match(/`([^`]+)`/g) || [];
        for (const m of matches) {
          const slot = stripBackticks(m);
          if (slot && !activeSlots.includes(slot)) {
            activeSlots.push(slot);
          }
        }
      } else if (line.startsWith("|")) {
        const cols = line
          .split("|")
          .slice(1, -1)
          .map((c) => stripBackticks(c));
        if (cols.length >= 5 && cols[0] !== "Template ID" && !cols[0].startsWith("---")) {
          templateRegistry.push({
            id: cols[0],
            slot: cols[1],
            priority: Number(cols[2]) || 10,
            treeSlot: cols[3],
            conditions: cols[4],
          });
          if (cols[1] && !activeSlots.includes(cols[1])) {
            activeSlots.push(cols[1]);
          }
        } else if (cols.length === 3 && cols[0] !== "Slot / Rule ID" && !cols[0].startsWith("---")) {
          const slotName = cols[0];
          const kind = cols[1];
          const priority = Number(cols[2]) || 10;
          if (kind.includes("slot") || kind.includes("part")) {
            if (!activeSlots.includes(slotName)) {
              activeSlots.push(slotName);
            }
          } else {
            templateRegistry.push({
              id: slotName,
              slot: slotName,
              priority,
              kind,
            });
          }
        }
      }
    }
  }

  const allTokens = { ...tokens, ...modes.light, ...modes.dark };
  const contract = {
    raw: text,
    tokens,
    modes,
    allTokens,
    reusableClasses,
    elements,
    activeSlots,
    templateRegistry,
    tokens_loaded: Object.keys(allTokens).length,
    reusable_classes_loaded: Object.keys(reusableClasses).length,
  };

  return Object.freeze(contract);
}
