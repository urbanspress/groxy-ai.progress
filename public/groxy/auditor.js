/**
 * Groxy AI v1.1.0 — Deterministic 4-Pillar Auditor (0-100 & A+-F).
 * Evaluates GrabLab entries, Grex layout trees, HTML fragments, and GRAB-DESIGN-SYSTEM.md
 * deterministically across all 22 rules in `playbook/seo-playbook.v1.json`.
 */

export const GROXY_VERSION = "1.6.0";

import { auditAccessibility, computeContrastRatio } from "./grex.js";
import {
  DEFAULT_SEO_PLAYBOOK,
  parseDesignSystemMarkdown,
  validatePlaybook,
} from "./playbook.js";

const ELEMENT_TAGS = Object.freeze({
  Fragment: ["fragment"],
  TemplatePart: ["section", "header", "footer", "aside", "nav"],
  Section: ["section", "header", "footer", "main", "aside"],
  Container: ["section", "article", "main", "header", "footer"],
  Grid: ["section", "ul", "ol", "article", "nav"],
  Stack: ["section", "header", "nav", "footer", "ul", "ol", "article"],
  Card: ["article", "section", "aside"],
  Heading: ["h1", "h2", "h3", "h4", "h5", "h6"],
  Text: ["p", "span", "small", "strong", "em", "blockquote", "time", "code"],
  RichText: ["p", "article", "section", "span"],
  Link: ["a"],
  Button: ["button"],
  Image: ["img"],
  Icon: ["svg"],
  Form: ["form"],
  Input: ["input", "textarea"],
  Select: ["select"],
  Tabs: ["section"],
  Accordion: ["section"],
  Modal: ["dialog", "section"],
  Nav: ["nav"],
  ForEach: ["section", "ul", "ol", "tbody"],
});

const ALLOWED_ELEMENT_SET = new Set(Object.keys(ELEMENT_TAGS));
const CORE_20_ELEMENTS = new Set(DEFAULT_SEO_PLAYBOOK.allowed_grex_elements);

/**
 * Map numeric 0-100 score to letter grade A+-F.
 * If publishSafe is false, grade is forced to F.
 * @param {number} score
 * @param {boolean} [publishSafe]
 * @returns {string}
 */
export function scoreToGrade(score, publishSafe = true) {
  if (!publishSafe) {
    return "F";
  }
  const n = Math.round(Number(score) || 0);
  if (n >= 97) return "A+";
  if (n >= 90) return "A";
  if (n >= 80) return "B";
  if (n >= 70) return "C";
  if (n >= 60) return "D";
  return "F";
}

/**
 * Validate exact GrabDecimal base-10 string preservation (ADR-025c).
 * Rejects IEEE-754 float coercion and float drift artifacts.
 * @param {unknown} val
 * @returns {boolean}
 */
export function isExactGrabDecimalString(val) {
  if (typeof val !== "string") {
    return false;
  }
  const s = val.trim();
  if (!/^-?\d+(?:\.\d+)?$/.test(s)) {
    return false;
  }
  if (/\.\d*?(000000|999999)\d$/.test(s)) {
    return false;
  }
  return true;
}

/**
 * Validate exact GrabInteger base-10 string or safe integer.
 * @param {unknown} val
 * @returns {boolean}
 */
export function isExactGrabIntegerString(val) {
  if (typeof val === "number") {
    return Number.isSafeInteger(val);
  }
  if (typeof val !== "string") {
    return false;
  }
  return /^-?\d+$/.test(val.trim());
}

function isUnsafeUrl(raw) {
  if (typeof raw !== "string") {
    return false;
  }
  const normalized = raw.replace(/[\u0000-\u0020]+/g, "").toLowerCase();
  if (!normalized) {
    return false;
  }
  return (
    normalized.startsWith("javascript:") ||
    normalized.startsWith("vbscript:") ||
    normalized.startsWith("file:") ||
    normalized.startsWith("data:")
  );
}

function stripHtmlTags(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeWords(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function inferFocusKeyword(title, stopWords) {
  const stopSet = new Set(stopWords || []);
  const words = tokenizeWords(title).filter((w) => w.length >= 3 && !stopSet.has(w));
  if (words.length >= 2) {
    return `${words[0]} ${words[1]}`;
  }
  return words[0] || "";
}

function countPhraseOccurrences(text, phrase) {
  const haystack = String(text || "").toLowerCase();
  const needle = String(phrase || "").trim().toLowerCase();
  if (!haystack || !needle) {
    return 0;
  }
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`\\b${escaped}\\b`, "gi");
  const matches = haystack.match(re);
  return matches ? matches.length : 0;
}

function extractNodeType(node) {
  if (!node || typeof node !== "object") return "";
  return String(node.element || node.type || "").trim();
}

function extractNodeTag(node, elType) {
  if (node && typeof node.tag === "string" && node.tag.trim()) {
    return node.tag.trim().toLowerCase();
  }
  const allowed = ELEMENT_TAGS[elType];
  return allowed ? allowed[0] : "";
}

function getBaseStyles(node) {
  if (!node || typeof node !== "object" || !node.styles || typeof node.styles !== "object") {
    return {};
  }
  if (node.styles.base && typeof node.styles.base === "object") {
    return node.styles.base;
  }
  return node.styles;
}

function collectStyleMaps(node) {
  if (!node || typeof node !== "object" || !node.styles || typeof node.styles !== "object") {
    return [];
  }
  if (
    "base" in node.styles ||
    "tablet" in node.styles ||
    "mobile" in node.styles
  ) {
    const out = [];
    for (const bp of ["base", "tablet", "mobile"]) {
      if (node.styles[bp] && typeof node.styles[bp] === "object") {
        out.push(node.styles[bp]);
      }
    }
    return out;
  }
  return [node.styles];
}

function inspectHtmlString(rawHtml) {
  const html = String(rawHtml || "");
  const divMatches = html.match(/<\s*div(?:\s|>|\/)/gi) || [];
  const dangerousTags =
    html.match(/<\s*(script|iframe|object|embed|style)(?:\s|>|\/)/gi) || [];
  const inlineHandlers = html.match(/\son[a-z]+\s*=/gi) || [];
  const unsafeProtocols =
    html.match(/(?:href|src|action|formaction)\s*=\s*["']?\s*(?:javascript|vbscript|file|data):/gi) ||
    [];
  const cssExpressions = html.match(/expression\s*\(/gi) || [];
  const headings = [];
  const hRegex = /<\s*h([1-6])(?:\s[^>]*)?>([\s\S]*?)<\s*\/\s*h\1\s*>/gi;
  let m;
  while ((m = hRegex.exec(html)) !== null) {
    headings.push({ level: Number(m[1]), text: stripHtmlTags(m[2]) });
  }
  const imgs = [];
  const imgRegex = /<\s*img\b([^>]*)>/gi;
  while ((m = imgRegex.exec(html)) !== null) {
    const attrsStr = m[1] || "";
    const altMatch = /\balt\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(attrsStr);
    const hiddenMatch = /\baria-hidden\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(attrsStr);
    imgs.push({
      alt: altMatch ? (altMatch[1] ?? altMatch[2] ?? "") : null,
      ariaHidden: hiddenMatch ? (hiddenMatch[1] ?? hiddenMatch[2] ?? "") : "",
    });
  }
  const links = [];
  const aRegex = /<\s*a\b([^>]*)>([\s\S]*?)<\s*\/\s*a\s*>/gi;
  while ((m = aRegex.exec(html)) !== null) {
    const attrsStr = m[1] || "";
    const hrefMatch = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(attrsStr);
    const ariaMatch = /\baria-label\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(attrsStr);
    links.push({
      href: hrefMatch ? (hrefMatch[1] ?? hrefMatch[2] ?? "") : "",
      text: stripHtmlTags(m[2]) || (ariaMatch ? (ariaMatch[1] ?? ariaMatch[2] ?? "") : ""),
    });
  }
  const buttons = [];
  const btnRegex = /<\s*button\b([^>]*)>([\s\S]*?)<\s*\/\s*button\s*>/gi;
  while ((m = btnRegex.exec(html)) !== null) {
    const attrsStr = m[1] || "";
    const ariaMatch = /\baria-label\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(attrsStr);
    buttons.push({
      text: stripHtmlTags(m[2]) || (ariaMatch ? (ariaMatch[1] ?? ariaMatch[2] ?? "") : ""),
    });
  }
  const controls = [];
  const ctrlRegex = /<\s*(input|select|textarea)\b([^>]*)>/gi;
  while ((m = ctrlRegex.exec(html)) !== null) {
    const attrsStr = m[2] || "";
    const typeMatch = /\btype\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(attrsStr);
    const type = (typeMatch ? (typeMatch[1] ?? typeMatch[2] ?? "") : "").toLowerCase();
    if (type === "hidden") continue;
    const ariaMatch = /\baria-label\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(attrsStr);
    const idMatch = /\bid\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(attrsStr);
    const hasForLabel = idMatch
      ? new RegExp(`<\\s*label\\b[^>]*\\bfor\\s*=\\s*["']${idMatch[1] ?? idMatch[2]}["']`, "i").test(
          html
        )
      : false;
    controls.push({
      tag: m[1].toLowerCase(),
      hasLabel: Boolean((ariaMatch && (ariaMatch[1] || ariaMatch[2])) || hasForLabel),
    });
  }

  return {
    divCount: divMatches.length,
    securityViolations: [
      ...dangerousTags.map((t) => `Forbidden HTML tag detected: ${t.trim()}`),
      ...inlineHandlers.map((h) => `Inline event handler detected: ${h.trim()}`),
      ...unsafeProtocols.map((u) => `Unsafe URL protocol detected: ${u.trim()}`),
      ...cssExpressions.map((c) => `Unsafe CSS expression detected: ${c.trim()}`),
    ],
    headings,
    imgs,
    links,
    buttons,
    controls,
  };
}

function toAuditGrexTree(node, defaultBg) {
  if (!node || typeof node !== "object") return null;
  const elType = extractNodeType(node);
  const props = { ...(node.props || {}) };
  if (props.isDecorative === true || props.is_decorative === true) {
    props.decorative = true;
  }
  const attrs = { ...(node.attrs || {}) };
  if (typeof props.label === "string" && !attrs["aria-label"]) {
    attrs["aria-label"] = props.label;
  }
  if (typeof props["aria-label"] === "string" && !attrs["aria-label"]) {
    attrs["aria-label"] = props["aria-label"];
  }
  if (typeof props.ariaLabel === "string" && !attrs["aria-label"]) {
    attrs["aria-label"] = props.ariaLabel;
  }
  const mapped = {
    id: node.id || props.id || undefined,
    type: elType,
    tag: node.tag,
    props,
    attrs,
    styles: node.styles || {},
    children: Array.isArray(node.children)
      ? node.children.map((ch) => toAuditGrexTree(ch, defaultBg)).filter(Boolean)
      : [],
  };
  return mapped;
}

function normalizeRootTrees(grexLayout) {
  if (!grexLayout || typeof grexLayout !== "object") {
    return [];
  }
  if (grexLayout.templates && typeof grexLayout.templates === "object") {
    return Object.values(grexLayout.templates).filter(Boolean);
  }
  return [grexLayout];
}

function inspectLayoutTrees(trees, designSystem) {
  const stats = {
    nodeCount: 0,
    maxDepth: 0,
    divCount: 0,
    invalidElements: [],
    invalidTags: [],
    securityViolations: [],
    headings: [],
    images: [],
    formControls: [],
    interactiveControls: [],
    links: [],
    textSegments: [],
    classesUsed: [],
    inlineStyleOverrides: 0,
    tokensReferenced: 0,
    contrastFailures: [],
    focusOutlineFailures: [],
  };

  const defaultBg =
    designSystem?.modes?.light?.["--grex-color-bg"] ||
    designSystem?.tokens?.["--grex-color-bg"] ||
    "#ffffff";
  const defaultFg =
    designSystem?.modes?.light?.["--grex-color-text"] ||
    designSystem?.tokens?.["--grex-color-text"] ||
    "";

  if (defaultFg && defaultBg) {
    const tokenRatio = computeContrastRatio(defaultFg, defaultBg);
    if (tokenRatio !== null && tokenRatio < 4.5) {
      stats.contrastFailures.push(
        `Design system token contrast ${tokenRatio}:1 (${defaultFg} on ${defaultBg}) is below 4.5:1.`
      );
    }
  }

  const walk = (node, depth, inheritedBg) => {
    if (!node || typeof node !== "object") return;
    stats.nodeCount += 1;
    if (depth > stats.maxDepth) {
      stats.maxDepth = depth;
    }

    const elType = extractNodeType(node);
    const rawTag = typeof node.tag === "string" ? node.tag.trim().toLowerCase() : "";
    if (elType.toLowerCase() === "div" || rawTag === "div") {
      stats.divCount += 1;
    }

    if (!elType || !ALLOWED_ELEMENT_SET.has(elType)) {
      stats.invalidElements.push(elType || "(missing)");
    } else if (rawTag) {
      const allowed = ELEMENT_TAGS[elType] || [];
      if (!allowed.includes(rawTag)) {
        if (["script", "iframe", "object", "embed", "style"].includes(rawTag)) {
          stats.securityViolations.push(`Forbidden HTML tag <${rawTag}> in layout tree.`);
        } else if (rawTag !== "div") {
          stats.invalidTags.push(`${elType}<${rawTag}>`);
        }
      }
    }

    const props = node.props && typeof node.props === "object" ? node.props : {};
    const attrs = node.attrs && typeof node.attrs === "object" ? node.attrs : {};

    // Check classes & tokens
    const clsRaw = [props.class, props.className, attrs.class].filter(Boolean).join(" ");
    for (const token of clsRaw.split(/\s+/).filter(Boolean)) {
      if (!stats.classesUsed.includes(token)) {
        stats.classesUsed.push(token);
      }
    }

    // Security check on props & attrs
    for (const [scopeName, bag] of [
      ["props", props],
      ["attrs", attrs],
    ]) {
      for (const [k, v] of Object.entries(bag)) {
        const kl = k.toLowerCase();
        if (
          kl.startsWith("on") ||
          kl === "innerhtml" ||
          kl === "outerhtml" ||
          kl === "dangerouslysetinnerhtml" ||
          kl === "srcdoc"
        ) {
          if (typeof v === "string" || kl !== "onclick" || typeof v !== "function") {
            stats.securityViolations.push(`Forbidden ${scopeName}.${k} handler/injection attribute.`);
          }
        }
        if (["href", "src", "action", "formaction"].includes(kl) && typeof v === "string") {
          if (isUnsafeUrl(v)) {
            stats.securityViolations.push(`Unsafe URL protocol in ${scopeName}.${k}: ${v}`);
          }
        }
      }
    }

    if (typeof props.html === "string" && props.html.trim() !== "") {
      const htmlAudit = inspectHtmlString(props.html);
      stats.divCount += htmlAudit.divCount;
      stats.securityViolations.push(...htmlAudit.securityViolations);
      stats.textSegments.push(stripHtmlTags(props.html));
      stats.links.push(...htmlAudit.links);
    }

    // Styles security & contrast & tokens
    const styleMaps = collectStyleMaps(node);
    for (const sm of styleMaps) {
      for (const [sk, sv] of Object.entries(sm)) {
        const svStr = String(sv ?? "");
        const svLower = svStr.toLowerCase();
        if (
          svLower.includes("javascript:") ||
          svLower.includes("expression(") ||
          svLower.includes("<script")
        ) {
          stats.securityViolations.push(`Unsafe CSS value in style "${sk}": ${svStr}`);
        }
        if (svStr.includes("var(--grex-")) {
          stats.tokensReferenced += 1;
        } else if (sk === "color" || sk === "background-color" || sk === "backgroundColor") {
          stats.inlineStyleOverrides += 1;
        }
        if (sk === "outline" && (svLower.trim() === "none" || svLower.trim() === "0")) {
          stats.focusOutlineFailures.push(node.id || props.id || elType);
        }
      }
    }

    const baseStyle = getBaseStyles(node);
    const nodeBg =
      baseStyle["background-color"] ||
      baseStyle.backgroundColor ||
      baseStyle.background ||
      inheritedBg;
    const nodeFg = baseStyle.color;
    if (nodeFg && nodeBg) {
      const ratio = computeContrastRatio(String(nodeFg), String(nodeBg));
      if (ratio !== null) {
        const fontSize = parseFloat(baseStyle["font-size"] || baseStyle.fontSize || "16");
        const fontWeight = String(baseStyle["font-weight"] || baseStyle.fontWeight || "400");
        const isBold = fontWeight === "bold" || Number(fontWeight) >= 700;
        const minRatio = fontSize >= 24 || (isBold && fontSize >= 18.66) ? 3.0 : 4.5;
        if (ratio < minRatio) {
          stats.contrastFailures.push(
            `Contrast ratio ${ratio}:1 (${nodeFg} on ${nodeBg}) is below WCAG AA ${minRatio}:1.`
          );
        }
      }
    }

    // Element-specific semantics
    if (elType === "Heading") {
      const level = props.level !== undefined ? Number(props.level) : rawTag ? Number(rawTag.slice(1)) : 2;
      const text = String(props.text || "");
      stats.headings.push({ level, text });
      stats.textSegments.push(text);
    } else if (elType === "Text" || elType === "RichText") {
      if (typeof props.text === "string" && props.text.trim()) {
        stats.textSegments.push(props.text);
      }
    } else if (elType === "Image") {
      const isDeco = props.decorative === true || props.isDecorative === true || props.is_decorative === true;
      stats.images.push({
        alt: props.alt !== undefined && props.alt !== null ? String(props.alt) : null,
        decorative: isDeco,
        ariaHidden: String(attrs["aria-hidden"] || props.ariaHidden || ""),
        src: String(props.src || ""),
      });
    } else if (elType === "Input" || elType === "Select") {
      const inputType = String(props.type || "").toLowerCase();
      if (inputType !== "hidden") {
        const hasLabel =
          (typeof props.label === "string" && props.label.trim() !== "") ||
          (typeof props["aria-label"] === "string" && props["aria-label"].trim() !== "") ||
          (typeof props.ariaLabel === "string" && props.ariaLabel.trim() !== "") ||
          (typeof attrs["aria-label"] === "string" && attrs["aria-label"].trim() !== "") ||
          (typeof attrs["aria-labelledby"] === "string" && attrs["aria-labelledby"].trim() !== "");
        stats.formControls.push({ type: elType, hasLabel });
      }
    } else if (elType === "Link" || elType === "Button") {
      const accessibleText = String(
        props.text ||
          props.label ||
          props["aria-label"] ||
          props.ariaLabel ||
          attrs["aria-label"] ||
          ""
      ).trim();
      stats.interactiveControls.push({ type: elType, text: accessibleText });
      if (elType === "Link") {
        stats.links.push({
          href: String(props.href || ""),
          text: accessibleText,
        });
      }
      if (accessibleText) {
        stats.textSegments.push(accessibleText);
      }
    }

    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        walk(child, depth + 1, nodeBg);
      }
    }
    if (Array.isArray(props.tabs)) {
      for (const tab of props.tabs) {
        if (tab && tab.content) {
          const arr = Array.isArray(tab.content) ? tab.content : [tab.content];
          arr.forEach((c) => walk(c, depth + 1, nodeBg));
        }
      }
    }
    if (Array.isArray(props.items)) {
      for (const item of props.items) {
        if (item && item.content) {
          const arr = Array.isArray(item.content) ? item.content : [item.content];
          arr.forEach((c) => walk(c, depth + 1, nodeBg));
        }
      }
    }
  };

  for (const t of trees) {
    walk(t, 1, defaultBg);
    const grexTree = toAuditGrexTree(t, defaultBg);
    if (grexTree) {
      const grexA11y = auditAccessibility(grexTree, { defaultBg });
      for (const issue of grexA11y.issues) {
        if (issue.code === "GREX-A11Y-001" && !stats.contrastFailures.includes(issue.message)) {
          stats.contrastFailures.push(issue.message);
        }
        if (
          issue.code === "GREX-A11Y-005" &&
          issue.message.toLowerCase().includes("focus outline") &&
          !stats.focusOutlineFailures.includes(issue.nodeId || "node")
        ) {
          stats.focusOutlineFailures.push(issue.nodeId || "node");
        }
      }
    }
  }

  return stats;
}

function makeFinding(rule, earned, status, plainEnglish, suggestedAction) {
  return {
    rule_id: rule.rule_id,
    category: rule.category,
    severity: status,
    points_earned: Math.max(0, Math.min(rule.max_points, Math.round(earned))),
    points_possible: rule.max_points,
    plain_english: plainEnglish,
    suggested_action: suggestedAction,
    source: rule.source,
  };
}

function normalizePath(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";
  const noQuery = s.split("?")[0].split("#")[0];
  if (noQuery.length > 1 && noQuery.endsWith("/")) {
    return noQuery.slice(0, -1).toLowerCase();
  }
  return noQuery.toLowerCase();
}

function isInternalHref(href) {
  const h = String(href || "").trim();
  if (!h || h.startsWith("#") || isUnsafeUrl(h)) return false;
  if (h.startsWith("/")) return true;
  return !/^[a-z][a-z0-9+.-]*:/i.test(h);
}

/**
 * Deterministically audit an entry, Grex layout tree, HTML fragment, and site context
 * across all 22 rules in `playbook/seo-playbook.v1.json`.
 *
 * @param {object} input
 * @param {{ playbook?: object, audited_at?: string }} [options]
 * @returns {object} AuditReport
 */
export function auditEntryAndLayout(input = {}, options = {}) {
  const playbook = validatePlaybook(options.playbook || DEFAULT_SEO_PLAYBOOK);
  const rulesById = Object.fromEntries(playbook.rules.map((r) => [r.rule_id, r]));

  const entry = input.entry && typeof input.entry === "object" ? input.entry : {};
  const layoutInput = input.grex_layout || input.layout || entry.grex_layout || null;
  const htmlFragment = String(input.html_fragment || entry.body_html || "");
  const siteContext = input.site_context && typeof input.site_context === "object" ? input.site_context : null;

  let designSystem = input.design_system || null;
  if (!designSystem && typeof input.design_system_md === "string" && input.design_system_md.trim()) {
    designSystem = parseDesignSystemMarkdown(input.design_system_md);
  }

  const trees = normalizeRootTrees(layoutInput);
  const treeStats = inspectLayoutTrees(trees, designSystem);
  const htmlStats = inspectHtmlString(htmlFragment);

  const allHeadings = [...treeStats.headings, ...htmlStats.headings];
  const h1Headings = allHeadings.filter((h) => h.level === 1);
  const subHeadings = allHeadings.filter((h) => h.level === 2 || h.level === 3);

  const title = String(entry.meta_title || entry.title || (h1Headings[0]?.text || "")).trim();
  const excerpt = String(entry.meta_description || entry.excerpt || "").trim();
  const slug = String(entry.slug || "").trim();
  const contentType = String(entry.content_type || entry.content_type_slug || "post").trim().toLowerCase();
  const entryId = entry.id !== undefined && entry.id !== null ? String(entry.id) : "";

  const bodyPlain = [
    entry.body ? String(entry.body) : "",
    htmlFragment ? stripHtmlTags(htmlFragment) : "",
    treeStats.textSegments.join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  const words = tokenizeWords(bodyPlain);
  const wordCount = words.length;

  const focusKeyword = String(
    input.focus_keyword || entry.focus_keyword || inferFocusKeyword(title, playbook.stop_words)
  ).trim();

  const findings = [];

  // ---------------------------------------------------------------------------
  // Pillar A — On-Page SEO (GROXY-SEO-001 .. GROXY-SEO-008)
  // ---------------------------------------------------------------------------
  {
    const r = rulesById["GROXY-SEO-001"];
    const len = title.length;
    if (len >= 50 && len <= 60) {
      findings.push(
        makeFinding(
          r,
          15,
          "pass",
          `Title length is ${len} characters, right inside the ideal 50-60 character Google Search window.`,
          "No change needed."
        )
      );
    } else if ((len >= 30 && len <= 49) || (len >= 61 && len <= 65)) {
      findings.push(
        makeFinding(
          r,
          12,
          "info",
          `Title length is ${len} characters (acceptable; 50-60 characters is optimal for SERP click-through).`,
          "Refine the title toward 50-60 characters so search snippets never clip."
        )
      );
    } else if (len >= 66 && len <= 70) {
      findings.push(
        makeFinding(
          r,
          10,
          "warning",
          `Title length is ${len} characters, slightly above the 65-character limit.`,
          "Trim filler words so the title sits between 50 and 60 characters."
        )
      );
    } else if (len > 0) {
      findings.push(
        makeFinding(
          r,
          5,
          "warning",
          `Title length is ${len} characters, outside the recommended 30-65 character search window.`,
          "Rewrite the title to 50-60 characters summarizing the page's primary value."
        )
      );
    } else {
      findings.push(
        makeFinding(
          r,
          0,
          "error",
          "The page is missing an SEO title.",
          "Add a descriptive 50-60 character title matching your primary search topic."
        )
      );
    }
  }

  {
    const r = rulesById["GROXY-SEO-002"];
    if (!focusKeyword) {
      findings.push(
        makeFinding(
          r,
          0,
          "error",
          "No focus keyword or meaningful topic phrase could be derived from the title.",
          "Specify a clear focus_keyword and include it in your title and opening paragraph."
        )
      );
    } else {
      const kwWords = tokenizeWords(focusKeyword);
      const titleLower = title.toLowerCase();
      const h1Text = (h1Headings[0]?.text || "").toLowerCase();
      const openingWindow = words.slice(0, 60).join(" ");
      const inTitle =
        titleLower.includes(focusKeyword.toLowerCase()) ||
        (kwWords.length > 0 && kwWords.every((w) => titleLower.includes(w)));
      const inLead =
        h1Text.includes(focusKeyword.toLowerCase()) ||
        openingWindow.includes(focusKeyword.toLowerCase()) ||
        (kwWords.length > 0 &&
          (kwWords.every((w) => h1Text.includes(w)) || kwWords.every((w) => openingWindow.includes(w))));
      const occurrences = countPhraseOccurrences(bodyPlain, focusKeyword);
      const densityPct = wordCount > 0 ? (occurrences * Math.max(1, kwWords.length) * 100) / wordCount : 0;

      if (densityPct > 3.0) {
        findings.push(
          makeFinding(
            r,
            6,
            "warning",
            `Focus keyword "${focusKeyword}" appears at ${densityPct.toFixed(1)}% density, exceeding the 3% anti-stuffing limit.`,
            "Replace repeated exact keyword matches with natural synonyms."
          )
        );
      } else if (inTitle && inLead) {
        findings.push(
          makeFinding(
            r,
            15,
            "pass",
            `Focus keyword "${focusKeyword}" appears naturally in the title and opening section (${densityPct.toFixed(1)}% density).`,
            "No change needed."
          )
        );
      } else if (inTitle || inLead) {
        findings.push(
          makeFinding(
            r,
            8,
            "warning",
            `Focus keyword "${focusKeyword}" is present in only one of title or opening H1/intro.`,
            `Include "${focusKeyword}" naturally in both your page title and opening H1/paragraph.`
          )
        );
      } else {
        findings.push(
          makeFinding(
            r,
            0,
            "error",
            `Focus keyword "${focusKeyword}" does not appear in the title or opening copy.`,
            `Add "${focusKeyword}" to the title, primary H1, and first paragraph.`
          )
        );
      }
    }
  }

  {
    const r = rulesById["GROXY-SEO-003"];
    const len = excerpt.length;
    if (len >= 120 && len <= 158) {
      findings.push(
        makeFinding(
          r,
          15,
          "pass",
          `Meta description / excerpt is ${len} characters, optimal for full Google Search snippet display.`,
          "No change needed."
        )
      );
    } else if ((len >= 90 && len <= 119) || (len >= 159 && len <= 160)) {
      findings.push(
        makeFinding(
          r,
          10,
          "warning",
          `Your summary excerpt is ${len} characters. Expanding or tuning it to 120-158 characters helps search results show a fuller preview.`,
          "Tune the meta description to 120-158 characters matching your focus keyword."
        )
      );
    } else if (len > 0) {
      findings.push(
        makeFinding(
          r,
          5,
          "warning",
          `Meta description is ${len} characters (${len > 160 ? "risks SERP truncation above 160 chars" : "too short for rich snippet context"}).`,
          "Write a clear 120-158 character summary explaining what visitors will gain."
        )
      );
    } else {
      findings.push(
        makeFinding(
          r,
          0,
          "error",
          "Missing meta description / entry excerpt.",
          "Add a compelling 120-158 character excerpt so search engines do not guess random snippet text."
        )
      );
    }
  }

  {
    const r = rulesById["GROXY-SEO-004"];
    const validPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
    const firstSeg = slug.split("-")[0] || "";
    const reservedCollision =
      playbook.reserved_slug_prefixes.includes(slug) || playbook.reserved_slug_prefixes.includes(firstSeg);
    const segs = slug ? slug.split("-") : [];
    const stopSet = new Set(playbook.stop_words);
    const stopRatio = segs.length > 0 ? segs.filter((s) => stopSet.has(s)).length / segs.length : 0;

    if (!slug || !validPattern || reservedCollision) {
      findings.push(
        makeFinding(
          r,
          0,
          "error",
          `URL slug "${slug || "(empty)"}" is invalid or collides with a reserved system route.`,
          "Use a clean lowercase hyphenated slug like \"fast-grab-themes\" (no underscores, uppercase, or reserved prefixes)."
        )
      );
    } else if (slug.length > 75 || (segs.length > 3 && stopRatio > 0.5)) {
      findings.push(
        makeFinding(
          r,
          6,
          "warning",
          `Slug "${slug}" (${slug.length} chars) is longer or more stop-word heavy than ideal.`,
          "Shorten the slug to 3-5 focused keywords under 75 characters."
        )
      );
    } else {
      findings.push(
        makeFinding(
          r,
          10,
          "pass",
          `URL slug "${slug}" is clean, lowercase, hyphenated, and collision-free.`,
          "No change needed."
        )
      );
    }
  }

  {
    const r = rulesById["GROXY-SEO-005"];
    if (h1Headings.length === 1) {
      findings.push(
        makeFinding(
          r,
          15,
          "pass",
          "Exactly one primary <h1> heading is present in the page layout.",
          "No change needed."
        )
      );
    } else if (h1Headings.length > 1) {
      findings.push(
        makeFinding(
          r,
          5,
          "warning",
          `Found ${h1Headings.length} <h1> headings; search engines expect one primary <h1> per page.`,
          "Keep a single <h1> for the main headline and convert secondary ones to <h2>."
        )
      );
    } else {
      findings.push(
        makeFinding(
          r,
          0,
          "error",
          "Missing primary <h1> heading in the page structure.",
          "Add one Grex Heading element with level: 1 matching the page topic."
        )
      );
    }
  }

  {
    const r = rulesById["GROXY-SEO-006"];
    const minWords = contentType === "page" || contentType === "product" ? 120 : 300;
    const expectedSubheadings = Math.max(1, Math.floor(wordCount / 350));
    if (wordCount >= minWords && subHeadings.length >= expectedSubheadings) {
      findings.push(
        makeFinding(
          r,
          15,
          "pass",
          `Content has ${wordCount} words (>= ${minWords} target for ${contentType}) with ${subHeadings.length} scannable subheadings.`,
          "No change needed."
        )
      );
    } else if (wordCount >= Math.round(minWords * 0.5)) {
      findings.push(
        makeFinding(
          r,
          8,
          "warning",
          `Content has ${wordCount} words and ${subHeadings.length} subheadings (recommended >= ${minWords} words with H2/H3 sections).`,
          `Expand copy toward ${minWords}+ words and organize sections under descriptive <h2>/<h3> headings.`
        )
      );
    } else {
      findings.push(
        makeFinding(
          r,
          wordCount > 0 ? 3 : 0,
          "error",
          `Thin content (${wordCount} words) falls short of the ${minWords}-word depth benchmark for ${contentType}.`,
          `Add helpful detail, examples, and structured H2/H3 subheadings totaling at least ${minWords} words.`
        )
      );
    }
  }

  {
    const r = rulesById["GROXY-SEO-007"];
    const otherEntries = Array.isArray(siteContext?.entries)
      ? siteContext.entries.filter((e) => {
          if (!e || typeof e !== "object") return false;
          if (entryId && e.id !== undefined && String(e.id) === entryId) return false;
          return true;
        })
      : null;

    if (otherEntries) {
      const dupSlug = slug && otherEntries.some((e) => String(e.slug || "").trim().toLowerCase() === slug.toLowerCase());
      const dupTitle =
        title && otherEntries.some((e) => String(e.title || "").trim().toLowerCase() === title.toLowerCase());
      if (dupSlug || dupTitle) {
        findings.push(
          makeFinding(
            r,
            0,
            "error",
            `Duplicate ${dupSlug ? "slug" : "title"} detected across existing GrabLab entries.`,
            "Choose a distinct title and slug to avoid keyword cannibalization and route collisions."
          )
        );
      } else {
        findings.push(
          makeFinding(
            r,
            10,
            "pass",
            `Title and slug are unique across all ${otherEntries.length + (entryId ? 1 : 0)} site entries.`,
            "No change needed."
          )
        );
      }
    } else {
      const genericTitles = new Set(["untitled", "home", "test", "sample", "hello world", "new page"]);
      if (title && !genericTitles.has(title.toLowerCase())) {
        findings.push(
          makeFinding(
            r,
            10,
            "pass",
            "Title is specific and non-generic (connect site_context for cross-entry uniqueness checks).",
            "No change needed."
          )
        );
      } else {
        findings.push(
          makeFinding(
            r,
            5,
            "warning",
            `Title "${title || "(empty)"}" is overly generic and risks colliding with other pages.`,
            "Give this entry a unique, topic-specific title."
          )
        );
      }
    }
  }

  {
    const r = rulesById["GROXY-SEO-008"];
    const cf = entry.custom_fields && typeof entry.custom_fields === "object" ? entry.custom_fields : {};
    const decimalKeys = new Set([
      "price",
      "sale_price",
      "regular_price",
      "cost",
      "weight",
      "rating",
      "discount",
    ]);
    const intKeys = new Set(["inventory_count", "stock", "qty", "reading_minutes"]);
    const badFields = [];

    for (const [k, v] of Object.entries(cf)) {
      if (v === null || v === undefined || v === "") continue;
      const kl = k.toLowerCase();
      if (decimalKeys.has(kl)) {
        if (!isExactGrabDecimalString(v)) {
          badFields.push(`${k}=${JSON.stringify(v)}`);
        }
      } else if (intKeys.has(kl)) {
        if (typeof v === "string") {
          if (!isExactGrabIntegerString(v)) badFields.push(`${k}=${JSON.stringify(v)}`);
        } else if (!Number.isSafeInteger(v)) {
          badFields.push(`${k}=${JSON.stringify(v)}`);
        }
      } else if (typeof v === "number" && !Number.isInteger(v)) {
        badFields.push(`${k}=${JSON.stringify(v)} (IEEE-754 float)`);
      } else if (typeof v === "string" && /\.\d*?(000000|999999)\d$/.test(v.trim())) {
        badFields.push(`${k}=${JSON.stringify(v)} (float drift)`);
      }
    }

    if (badFields.length > 0) {
      findings.push(
        makeFinding(
          r,
          0,
          "error",
          `Numeric precision drift or unquoted float detected in custom_fields: ${badFields.join(", ")}.`,
          "Store decimal prices and measurements as exact base-10 GrabDecimal wire strings (e.g., \"19.95\")."
        )
      );
    } else {
      findings.push(
        makeFinding(
          r,
          5,
          "pass",
          "All GrabDecimal and GrabInteger custom fields preserve exact base-10 precision.",
          "No change needed."
        )
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Pillar B — Content & WCAG Accessibility (GROXY-A11Y-001 .. GROXY-A11Y-005)
  // ---------------------------------------------------------------------------
  {
    const r = rulesById["GROXY-A11Y-001"];
    if (treeStats.contrastFailures.length > 0) {
      findings.push(
        makeFinding(
          r,
          0,
          "error",
          treeStats.contrastFailures[0],
          "Adjust foreground or background colors to meet WCAG AA contrast (>= 4.5:1 normal, >= 3.0:1 large text)."
        )
      );
    } else {
      findings.push(
        makeFinding(
          r,
          25,
          "pass",
          "All evaluated text/background colors and --grex-* tokens meet WCAG AA contrast standards.",
          "No change needed."
        )
      );
    }
  }

  {
    const r = rulesById["GROXY-A11Y-002"];
    const combinedImages = [
      ...treeStats.images,
      ...htmlStats.imgs.map((img) => ({
        alt: img.alt,
        decorative: img.ariaHidden === "true" && (img.alt === "" || img.alt === null),
        ariaHidden: img.ariaHidden,
        src: "",
      })),
    ];
    const invalidImgs = combinedImages.filter((img) => {
      if (img.decorative) {
        return false;
      }
      const alt = (img.alt || "").trim();
      if (!alt || alt.length < 3 || alt.length > 125) return true;
      if (/\.(jpe?g|png|gif|webp|svg)$/i.test(alt) || /^(image|photo|picture|img|screenshot)$/i.test(alt)) {
        return true;
      }
      return false;
    });

    if (invalidImgs.length > 0) {
      findings.push(
        makeFinding(
          r,
          0,
          "error",
          `${invalidImgs.length} image(s) lack descriptive alt text (3-125 chars) or explicit decorative: true.`,
          "Add clear, descriptive alt text summarizing each image or mark purely ornamental graphics decorative."
        )
      );
    } else {
      findings.push(
        makeFinding(
          r,
          25,
          "pass",
          combinedImages.length > 0
            ? `All ${combinedImages.length} image(s) include compliant alt text or decorative attributes.`
            : "No unlabelled images present.",
          "No change needed."
        )
      );
    }
  }

  {
    const r = rulesById["GROXY-A11Y-003"];
    const unlabeled = [
      ...treeStats.formControls.filter((c) => !c.hasLabel),
      ...htmlStats.controls.filter((c) => !c.hasLabel),
    ];
    if (unlabeled.length > 0) {
      findings.push(
        makeFinding(
          r,
          0,
          "error",
          `${unlabeled.length} form control(s) are missing an accessible label or aria-label.`,
          "Add a descriptive label prop or <label for=\"...\"> association to every Input and Select."
        )
      );
    } else {
      findings.push(
        makeFinding(
          r,
          15,
          "pass",
          "All form inputs and selects expose accessible labels.",
          "No change needed."
        )
      );
    }
  }

  {
    const r = rulesById["GROXY-A11Y-004"];
    let lastLevel = 0;
    let skippedMsg = "";
    for (const h of allHeadings) {
      if (lastLevel > 0 && h.level > lastLevel + 1) {
        skippedMsg = `Skipped heading level from <h${lastLevel}> to <h${h.level}>.`;
        break;
      }
      if (h.level >= 1 && h.level <= 6) {
        lastLevel = h.level;
      }
    }
    if (skippedMsg) {
      findings.push(
        makeFinding(
          r,
          0,
          "error",
          skippedMsg,
          "Keep heading levels sequential (h1 -> h2 -> h3) without skipping levels."
        )
      );
    } else if (h1Headings.length > 1) {
      findings.push(
        makeFinding(
          r,
          10,
          "warning",
          "Multiple <h1> elements detected; prefer one primary <h1> per document.",
          "Convert secondary <h1> elements to <h2>."
        )
      );
    } else {
      findings.push(
        makeFinding(
          r,
          20,
          "pass",
          "Heading hierarchy is strictly sequential with zero skipped levels.",
          "No change needed."
        )
      );
    }
  }

  {
    const r = rulesById["GROXY-A11Y-005"];
    const missingNames = [
      ...treeStats.interactiveControls.filter((c) => !c.text),
      ...htmlStats.links.filter((l) => !l.text),
      ...htmlStats.buttons.filter((b) => !b.text),
    ];
    if (treeStats.focusOutlineFailures.length > 0 || missingNames.length > 0) {
      const reasons = [];
      if (missingNames.length > 0) {
        reasons.push(`${missingNames.length} button/link control(s) lack accessible text`);
      }
      if (treeStats.focusOutlineFailures.length > 0) {
        reasons.push("focus outline removed via outline: none/0");
      }
      findings.push(
        makeFinding(
          r,
          0,
          "error",
          `Interactive accessibility violation: ${reasons.join("; ")}.`,
          "Ensure every Button and Link has visible text or aria-label and preserves :focus-visible rings."
        )
      );
    } else {
      findings.push(
        makeFinding(
          r,
          15,
          "pass",
          "All interactive buttons and links have accessible names and visible keyboard focus indicators.",
          "No change needed."
        )
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Pillar C — Performance & Clean DOM (GROXY-DOM-001 .. GROXY-DOM-005)
  // ---------------------------------------------------------------------------
  const totalDivs = treeStats.divCount + htmlStats.divCount;
  const hasDivViolation = totalDivs > 0;
  {
    const r = rulesById["GROXY-DOM-001"];
    if (hasDivViolation) {
      findings.push(
        makeFinding(
          r,
          0,
          "critical",
          `Detected ${totalDivs} forbidden wrapper <div> element(s), violating Grex zero-<div> semantic architecture.`,
          "Replace every <div> with semantic Grex elements (Section, Container, Stack, Grid, Card, or Text)."
        )
      );
    } else {
      findings.push(
        makeFinding(
          r,
          25,
          "pass",
          "Zero wrapper <div> elements detected across layout trees and HTML fragments.",
          "No change needed."
        )
      );
    }
  }

  {
    const r = rulesById["GROXY-DOM-002"];
    if (treeStats.invalidElements.length > 0 || treeStats.invalidTags.length > 0) {
      const msg = [
        treeStats.invalidElements.length > 0
          ? `Unsupported Grex element(s): ${treeStats.invalidElements.join(", ")}`
          : "",
        treeStats.invalidTags.length > 0
          ? `Disallowed HTML tag(s): ${treeStats.invalidTags.join(", ")}`
          : "",
      ]
        .filter(Boolean)
        .join("; ");
      findings.push(
        makeFinding(
          r,
          0,
          "error",
          msg,
          `Use strictly the 20 elements in grex.elements.json (${Array.from(CORE_20_ELEMENTS).slice(0, 6).join(", ")}, ...) with semantic HTML5 tags.`
        )
      );
    } else {
      findings.push(
        makeFinding(
          r,
          20,
          "pass",
          "All layout nodes adhere strictly to the 20-element grex.elements.json catalog and semantic HTML5 landmarks.",
          "No change needed."
        )
      );
    }
  }

  const allSecurityViolations = [...treeStats.securityViolations, ...htmlStats.securityViolations];
  const hasSecurityViolation = allSecurityViolations.length > 0;
  {
    const r = rulesById["GROXY-DOM-003"];
    if (hasSecurityViolation) {
      findings.push(
        makeFinding(
          r,
          0,
          "critical",
          `Critical security violation: ${allSecurityViolations[0]}`,
          "Remove <script>, <iframe>, inline event handlers, innerHTML, and javascript:/data: URLs immediately."
        )
      );
    } else {
      findings.push(
        makeFinding(
          r,
          25,
          "pass",
          "Zero scripts, iframes, inline event handlers, or unsafe URL protocols detected.",
          "No change needed."
        )
      );
    }
  }

  {
    const r = rulesById["GROXY-DOM-004"];
    if (treeStats.maxDepth > 24 || treeStats.nodeCount > 250) {
      findings.push(
        makeFinding(
          r,
          0,
          "error",
          `DOM complexity exceeds safety limits (depth: ${treeStats.maxDepth}, nodes: ${treeStats.nodeCount}).`,
          "Flatten nested containers so depth stays <= 24 (ideally <= 10) and node count stays <= 150."
        )
      );
    } else if (treeStats.maxDepth > 10 || treeStats.nodeCount > 150) {
      findings.push(
        makeFinding(
          r,
          10,
          "warning",
          `DOM depth (${treeStats.maxDepth}) or node count (${treeStats.nodeCount}) is within hard limits but above lean targets.`,
          "Simplify layout wrappers to keep nesting <= 10 levels and <= 150 nodes."
        )
      );
    } else {
      findings.push(
        makeFinding(
          r,
          15,
          "pass",
          `Lean semantic DOM tree (depth ${treeStats.maxDepth}, ${treeStats.nodeCount} nodes).`,
          "No change needed."
        )
      );
    }
  }

  const unknownClassesUsed = [];
  {
    const r = rulesById["GROXY-DOM-005"];
    const registeredClassKeys = new Set(Object.keys(designSystem?.reusableClasses || {}));
    for (const cls of treeStats.classesUsed) {
      if (cls.startsWith("grex-c-")) {
        const shortName = cls.slice("grex-c-".length);
        if (designSystem && registeredClassKeys.size > 0 && !registeredClassKeys.has(shortName)) {
          unknownClassesUsed.push(cls);
        }
      }
    }
    if (unknownClassesUsed.length > 0) {
      findings.push(
        makeFinding(
          r,
          7,
          "warning",
          `Layout references unregistered .grex-c-* class(es): ${unknownClassesUsed.join(", ")}.`,
          "Reuse classes defined in GRAB-DESIGN-SYSTEM.md or register them in Grex Theme Builder."
        )
      );
    } else if (designSystem && treeStats.inlineStyleOverrides > 4 && treeStats.tokensReferenced === 0) {
      findings.push(
        makeFinding(
          r,
          9,
          "warning",
          `Detected ${treeStats.inlineStyleOverrides} hardcoded inline color overrides without --grex-* design tokens.`,
          "Bind colors to var(--grex-color-*) tokens and .grex-c-* utility classes from GRAB-DESIGN-SYSTEM.md."
        )
      );
    } else {
      findings.push(
        makeFinding(
          r,
          15,
          "pass",
          "Layout aligns cleanly with GRAB-DESIGN-SYSTEM.md tokens and reusable .grex-c-* classes.",
          "No change needed."
        )
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Pillar D — Off-Page / Internal Linking Readiness (GROXY-LINK-001 .. 004)
  // ---------------------------------------------------------------------------
  const allLinks = [...treeStats.links, ...htmlStats.links];
  const internalLinks = allLinks.filter((l) => isInternalHref(l.href));
  const vagueSet = new Set((playbook.vague_anchors || []).map((v) => v.toLowerCase()));

  {
    const r = rulesById["GROXY-LINK-001"];
    if (internalLinks.length === 0) {
      findings.push(
        makeFinding(
          r,
          8,
          "warning",
          "No internal links found; adding 1-2 contextual internal links improves crawlability and user navigation.",
          "Link to related guides, category archives, or product pages using descriptive anchor phrases."
        )
      );
    } else {
      const vagueLinks = internalLinks.filter((l) => {
        const t = String(l.text || "").trim().toLowerCase();
        return !t || vagueSet.has(t) || t.length < 4;
      });
      if (vagueLinks.length > 0) {
        findings.push(
          makeFinding(
            r,
            15,
            "warning",
            `${vagueLinks.length} internal link(s) use generic anchor text ("${vagueLinks[0].text || "empty"}").`,
            "Replace generic anchors like \"click here\" or \"read more\" with descriptive topic phrases."
          )
        );
      } else {
        findings.push(
          makeFinding(
            r,
            30,
            "pass",
            `Found ${internalLinks.length} internal link(s) using clear, descriptive anchor text.`,
            "No change needed."
          )
        );
      }
    }
  }

  {
    const r = rulesById["GROXY-LINK-002"];
    const selfPaths = new Set(
      [slug ? `/${slug}` : "", slug ? `/blog/${slug}` : "", entry.url ? normalizePath(entry.url) : ""].filter(
        Boolean
      )
    );
    const redirectMap = new Map();
    if (Array.isArray(siteContext?.redirects)) {
      for (const rd of siteContext.redirects) {
        if (rd && rd.old_slug && rd.new_slug) {
          redirectMap.set(normalizePath(`/${rd.old_slug}`), `/${rd.new_slug}`);
        }
        if (rd && rd.from && rd.to) {
          redirectMap.set(normalizePath(rd.from), rd.to);
        }
      }
    }
    const knownPaths = new Set(["/", "/blog", "/about", "/search", "/contact", "/pricing", "/privacy", "/terms"]);
    if (Array.isArray(siteContext?.entries)) {
      for (const se of siteContext.entries) {
        if (!se) continue;
        if (se.slug) {
          knownPaths.add(normalizePath(`/${se.slug}`));
          knownPaths.add(normalizePath(`/blog/${se.slug}`));
          knownPaths.add(normalizePath(`/posts/${se.slug}`));
        }
        if (se.url) knownPaths.add(normalizePath(se.url));
        if (Array.isArray(se.slug_history)) {
          for (const oldSlug of se.slug_history) {
            redirectMap.set(normalizePath(`/${oldSlug}`), `/${se.slug}`);
            redirectMap.set(normalizePath(`/blog/${oldSlug}`), `/blog/${se.slug}`);
          }
        }
      }
    }
    if (Array.isArray(siteContext?.menus)) {
      for (const m of siteContext.menus) {
        if (m?.href) knownPaths.add(normalizePath(m.href));
      }
    } else if (siteContext?.menus && typeof siteContext.menus === "object") {
      for (const locList of Object.values(siteContext.menus)) {
        if (Array.isArray(locList)) {
          for (const m of locList) {
            if (m?.href) knownPaths.add(normalizePath(m.href));
          }
        }
      }
    }

    const redirectHits = [];
    const selfHits = [];
    const brokenHits = [];

    for (const lnk of internalLinks) {
      const norm = normalizePath(lnk.href);
      if (!norm) continue;
      if (selfPaths.has(norm)) {
        selfHits.push(lnk.href);
      } else if (redirectMap.has(norm)) {
        redirectHits.push(`${lnk.href} -> ${redirectMap.get(norm)}`);
      } else if (
        siteContext &&
        Array.isArray(siteContext.entries) &&
        siteContext.entries.length > 0 &&
        !norm.startsWith("/static/") &&
        !norm.startsWith("/category/") &&
        !knownPaths.has(norm)
      ) {
        brokenHits.push(lnk.href);
      }
    }

    if (redirectHits.length > 0) {
      findings.push(
        makeFinding(
          r,
          0,
          "error",
          `Internal link targets superseded 301 redirect slug(s): ${redirectHits.join(", ")}.`,
          "Update links directly to their canonical destination URLs to avoid redirect hops."
        )
      );
    } else if (brokenHits.length > 0 || selfHits.length > 0) {
      findings.push(
        makeFinding(
          r,
          10,
          "warning",
          `Link integrity warning: ${brokenHits.length > 0 ? `unrecognized path(s) ${brokenHits.join(", ")}` : `self-loop to ${selfHits.join(", ")}`}.`,
          "Verify internal targets point to valid canonical pages rather than self-links or missing slugs."
        )
      );
    } else {
      findings.push(
        makeFinding(
          r,
          30,
          "pass",
          "All internal links resolve cleanly with zero self-loops or 301 redirect chains.",
          "No change needed."
        )
      );
    }
  }

  {
    const r = rulesById["GROXY-LINK-003"];
    const hasMenus =
      (Array.isArray(siteContext?.menus) && siteContext.menus.length > 0) ||
      (siteContext?.menus &&
        typeof siteContext.menus === "object" &&
        !Array.isArray(siteContext.menus) &&
        Object.values(siteContext.menus).some((arr) => Array.isArray(arr) && arr.length > 0));
    const hasEntries = Array.isArray(siteContext?.entries) && siteContext.entries.length > 0;
    if (siteContext && (hasMenus || hasEntries)) {
      const targetSlugs = new Set(
        [slug ? normalizePath(`/${slug}`) : "", slug ? normalizePath(`/blog/${slug}`) : "", entry.url ? normalizePath(entry.url) : ""].filter(
          Boolean
        )
      );
      const menuHrefs = [];
      if (Array.isArray(siteContext.menus)) {
        siteContext.menus.forEach((m) => m?.href && menuHrefs.push(normalizePath(m.href)));
      } else if (siteContext.menus && typeof siteContext.menus === "object") {
        Object.values(siteContext.menus).forEach((arr) => {
          if (Array.isArray(arr)) arr.forEach((m) => m?.href && menuHrefs.push(normalizePath(m.href)));
        });
      }
      const inMenus = menuHrefs.some((h) => targetSlugs.has(h));
      const inSiblingLinks =
        Array.isArray(siteContext.entries) &&
        siteContext.entries.some((se) => {
          if (!se || (entryId && String(se.id) === entryId)) return false;
          const raw = String(se.body_html || se.body || "");
          return Array.from(targetSlugs).some((ts) => raw.toLowerCase().includes(ts));
        });

      if (inMenus || inSiblingLinks) {
        findings.push(
          makeFinding(
            r,
            20,
            "pass",
            `Entry is discoverable via ${inMenus ? "site navigation menus" : "sibling internal links"}.`,
            "No change needed."
          )
        );
      } else {
        findings.push(
          makeFinding(
            r,
            5,
            "warning",
            "Orphan page risk: no navigation menu item or sibling entry links to this URL yet.",
            "Add a link from your navigation menu or a related guide so visitors and crawlers can discover this page."
          )
        );
      }
    } else {
      findings.push(
        makeFinding(
          r,
          16,
          "info",
          "Standalone audit completed without site menu graph; verify this page is linked from primary navigation or category archives.",
          "Run with site_context (list_menus + query_entries) to verify full discoverability."
        )
      );
    }
  }

  {
    const r = rulesById["GROXY-LINK-004"];
    const cf = entry.custom_fields && typeof entry.custom_fields === "object" ? entry.custom_fields : {};
    const hasBasicMeta = Boolean(title && excerpt);
    if (contentType === "product") {
      const hasPrice = isExactGrabDecimalString(cf.price);
      const hasSkuOrAvail = Boolean(cf.sku || cf.availability);
      if (hasBasicMeta && hasPrice && hasSkuOrAvail) {
        findings.push(
          makeFinding(
            r,
            20,
            "pass",
            `Product schema.org metadata ready (title, excerpt, exact price "${cf.price}", SKU/availability).`,
            "No change needed."
          )
        );
      } else {
        findings.push(
          makeFinding(
            r,
            hasBasicMeta ? 10 : 0,
            "warning",
            "Product structured data is missing exact GrabDecimal price or SKU/availability metadata.",
            "Include custom_fields.price as an exact decimal string plus sku for Google Product rich results."
          )
        );
      }
    } else if (contentType === "post" || contentType === "article") {
      const hasAuthor = Boolean(entry.author_name || entry.author || cf.author_name);
      const hasDate = Boolean(entry.published_at || entry.updated_at);
      if (hasBasicMeta && hasAuthor && hasDate) {
        findings.push(
          makeFinding(
            r,
            20,
            "pass",
            "Article schema.org metadata ready (headline, description, author, published date).",
            "No change needed."
          )
        );
      } else {
        findings.push(
          makeFinding(
            r,
            hasBasicMeta ? 10 : 0,
            "warning",
            "Article structured data is missing author or published_at metadata.",
            "Ensure author_name and published_at are populated before publishing."
          )
        );
      }
    } else {
      if (hasBasicMeta && allHeadings.length > 0) {
        findings.push(
          makeFinding(
            r,
            20,
            "pass",
            "WebPage structured data signals (title, description, semantic headings) are complete.",
            "No change needed."
          )
        );
      } else {
        findings.push(
          makeFinding(
            r,
            10,
            "warning",
            "WebPage structured data is missing title, excerpt, or semantic heading tags.",
            "Complete title, excerpt, and at least one primary Heading."
          )
        );
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Aggregate 4 Pillar Subscores, Safety Gate & Exact AuditReport Contract
  // ---------------------------------------------------------------------------
  const totals = {
    on_page_seo: 0,
    content_a11y: 0,
    performance_dom: 0,
    linking_readiness: 0,
  };
  for (const f of findings) {
    totals[f.category] += f.points_earned;
  }
  if (hasSecurityViolation) {
    totals.performance_dom = 0;
  }

  let overallScore = Math.round(
    (totals.on_page_seo +
      totals.content_a11y +
      totals.performance_dom +
      totals.linking_readiness) /
      4
  );

  const publishSafe = !hasDivViolation && !hasSecurityViolation;
  if (!publishSafe && overallScore > 59) {
    overallScore = 59;
  }

  const overallGrade = scoreToGrade(overallScore, publishSafe);
  const auditedAt =
    options.audited_at ||
    input.audited_at ||
    entry.updated_at ||
    entry.published_at ||
    "2026-11-14T00:00:00Z";

  return {
    schema_version: "0.1.0",
    playbook_version: playbook.playbook_version,
    audited_at: String(auditedAt),
    target: {
      entry_id: entryId,
      content_type: contentType,
      title,
      slug,
    },
    overall_score: overallScore,
    overall_grade: overallGrade,
    publish_safe: publishSafe,
    categories: {
      on_page_seo: {
        score: totals.on_page_seo,
        grade: scoreToGrade(totals.on_page_seo, true),
        label: playbook.pillars.on_page_seo.label,
      },
      content_a11y: {
        score: totals.content_a11y,
        grade: scoreToGrade(totals.content_a11y, true),
        label: playbook.pillars.content_a11y.label,
      },
      performance_dom: {
        score: totals.performance_dom,
        grade: scoreToGrade(totals.performance_dom, publishSafe),
        label: playbook.pillars.performance_dom.label,
      },
      linking_readiness: {
        score: totals.linking_readiness,
        grade: scoreToGrade(totals.linking_readiness, true),
        label: playbook.pillars.linking_readiness.label,
      },
    },
    findings,
    design_system_summary: {
      tokens_loaded: designSystem ? designSystem.tokens_loaded : 0,
      reusable_classes_loaded: designSystem ? designSystem.reusable_classes_loaded : 0,
      unknown_classes_used: unknownClassesUsed,
    },
  };
}
