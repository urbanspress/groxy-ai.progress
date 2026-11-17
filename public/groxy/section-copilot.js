/**
 * Groxy AI v1.6.0 — Iterative Section Co-Pilot & Golden-Ratio Design-Craft Engine.
 * Zero-build browser ES module built strictly on Grex JS v1.0.0 semantic primitives.
 * Zero wrapper <div> elements, zero innerHTML writes, zero eval()/new Function().
 */

export const GROXY_VERSION = "1.8.0";
export const SECTION_COPILOT_VERSION = "1.6.0";

import {
  auditAccessibility,
  computeContrastRatio,
  isSafeUrl,
  setSafeText,
  validateElementNode,
} from "./grex.js";
import { parseDesignSystemMarkdown } from "./playbook.js";
import {
  isExactGrabDecimalString,
  isExactGrabIntegerString,
} from "./auditor.js";

const STRICT_TWENTY_ELEMENTS = new Set([
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
]);

const FORBIDDEN_TAGS = new Set(["div", "script", "iframe", "object", "embed", "style"]);
const REQUIRED_CRAFT_IDS = [
  "GROXY-CRAFT-001",
  "GROXY-CRAFT-002",
  "GROXY-CRAFT-003",
  "GROXY-CRAFT-004",
  "GROXY-CRAFT-005",
];
const EXACT_NUMERIC_KEYS = new Set([
  "price",
  "sale_price",
  "unit_price",
  "amount",
  "total",
  "subtotal",
  "discount",
  "quantity",
  "count",
  "item_count",
  "per_page",
  "sku",
]);

export class SectionCopilotError extends Error {
  constructor(code, message, status = 422, details = null) {
    super(message);
    this.name = "SectionCopilotError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function canonicalJson(value) {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new SectionCopilotError("CANONICAL_TYPE", "Non-finite JSON numbers are not supported.", 400);
    }
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return "[" + value.map(canonicalJson).join(",") + "]";
  }
  if (value && typeof value === "object") {
    const keys = Object.keys(value).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    return "{" + keys.map((k) => JSON.stringify(k) + ":" + canonicalJson(value[k])).join(",") + "}";
  }
  throw new SectionCopilotError("CANONICAL_TYPE", "Unsupported canonical JSON value.", 400);
}

export async function sha256(value, cryptoImpl = globalThis.crypto) {
  if (!cryptoImpl?.subtle) {
    throw new SectionCopilotError("CRYPTO_UNAVAILABLE", "SHA-256 is unavailable.", 503);
  }
  const bytes = new TextEncoder().encode(typeof value === "string" ? value : canonicalJson(value));
  const digest = await cryptoImpl.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function validateDesignCraftPlaybook(playbook) {
  if (!playbook || typeof playbook !== "object" || Array.isArray(playbook)) {
    throw new SectionCopilotError("DESIGN_CRAFT_PLAYBOOK_INVALID", "Design-craft playbook must be a JSON object.", 503);
  }
  if (typeof playbook.schema_version !== "string" || !playbook.schema_version.trim()) {
    throw new SectionCopilotError("DESIGN_CRAFT_PLAYBOOK_INVALID", "Playbook missing schema_version.", 503);
  }
  if (typeof playbook.playbook_version !== "string" || !playbook.playbook_version.trim()) {
    throw new SectionCopilotError("DESIGN_CRAFT_PLAYBOOK_INVALID", "Playbook missing playbook_version.", 503);
  }
  if (!playbook.token_roles || typeof playbook.token_roles !== "object" || Array.isArray(playbook.token_roles)) {
    throw new SectionCopilotError("DESIGN_CRAFT_PLAYBOOK_INVALID", "Playbook missing token_roles.", 503);
  }
  if (!Array.isArray(playbook.rules) || playbook.rules.length < REQUIRED_CRAFT_IDS.length) {
    throw new SectionCopilotError("DESIGN_CRAFT_PLAYBOOK_INVALID", "Playbook rules array is malformed.", 503);
  }
  const seenIds = new Set();
  for (const rule of playbook.rules) {
    if (!rule || typeof rule !== "object" || Array.isArray(rule)) {
      throw new SectionCopilotError("DESIGN_CRAFT_PLAYBOOK_INVALID", "Playbook rule entry is malformed.", 503);
    }
    for (const reqField of ["id", "family", "title", "severity", "checker", "repair_policy"]) {
      if (typeof rule[reqField] !== "string" || !rule[reqField].trim()) {
        throw new SectionCopilotError("DESIGN_CRAFT_PLAYBOOK_INVALID", `Playbook rule missing ${reqField}.`, 503);
      }
    }
    if (seenIds.has(rule.id)) {
      throw new SectionCopilotError("DESIGN_CRAFT_PLAYBOOK_INVALID", `Duplicate playbook rule id: ${rule.id}`, 503);
    }
    seenIds.add(rule.id);
  }
  for (const reqId of REQUIRED_CRAFT_IDS) {
    if (!seenIds.has(reqId)) {
      throw new SectionCopilotError("DESIGN_CRAFT_PLAYBOOK_INVALID", `Missing required playbook rule: ${reqId}`, 503);
    }
  }
  return playbook;
}

export const DEFAULT_DESIGN_CRAFT_PLAYBOOK = Object.freeze(
  validateDesignCraftPlaybook({
    schema_version: "1.6.0",
    playbook_version: "1.0.0",
    name: "Groxy AI Golden-Ratio Design-Craft & Visual Rhythm Playbook",
    updated_at: "2026-11-16",
    token_roles: {
      spacing: {
        candidates: ["--grex-space-sm", "--grex-space-md", "--grex-space-lg", "--grex-space-xl"],
        scale_unit_px: 8,
        tight_inline_px: 4,
        inline_pair_tokens: ["--grex-space-sm"],
        missing_behavior: "token_unavailable",
      },
      line_measure: {
        candidates: ["--grex-measure", "--grex-text-measure", "--grex-prose-width"],
        min_ch: 60,
        max_ch: 65,
        missing_behavior: "token_unavailable",
        guidance: "Add a line-measure token (for example --grex-measure: 62ch) via Grex Theme Builder's Global Token Editor.",
      },
      surface_1: {
        candidates: ["--grex-surface-1"],
        fallback_candidates: ["--grex-surface", "--grex-bg"],
        missing_behavior: "token_unavailable",
        guidance: "Add --grex-surface-1 in Light and Dark modes via Grex Theme Builder's Global Token Editor.",
      },
      surface_2: {
        candidates: ["--grex-surface-2"],
        fallback_candidates: ["--grex-surface-elevated", "--grex-surface"],
        missing_behavior: "token_unavailable",
        guidance: "Add --grex-surface-2 in Light and Dark modes via Grex Theme Builder's Global Token Editor.",
      },
    },
    cms_wiring: {
      allow_fabricated_action: false,
      require_exact_decimal_strings: true,
      foreach_allowed_bindings: ["text", "label", "title", "alt", "href", "src"],
      standard_entry_fields: [
        "id",
        "title",
        "slug",
        "excerpt",
        "full_path",
        "published_at",
        "updated_at",
        "content_type",
        "content_type_label",
        "author_name",
        "featured_image",
      ],
    },
    rules: [
      {
        id: "GROXY-CRAFT-001",
        family: "spacing_rhythm",
        title: "8pt Spacing Rhythm via Live --grex-* Tokens",
        severity: "error",
        checker: "check_8pt_spacing_rhythm",
        repair_policy: "snap_to_nearest_live_8pt_token",
        scale_unit_px: 8,
        tight_inline_px: 4,
      },
      {
        id: "GROXY-CRAFT-002",
        family: "line_measure",
        title: "60-65ch Readable Body Copy Measure",
        severity: "error",
        checker: "check_readable_line_measure",
        repair_policy: "attach_live_measure_token_or_report_unavailable",
        min_ch: 60,
        max_ch: 65,
      },
      {
        id: "GROXY-CRAFT-003",
        family: "cta_hierarchy",
        title: "One Primary CTA Per Fold",
        severity: "error",
        checker: "check_single_primary_cta_per_fold",
        repair_policy: "demote_extra_primaries_to_secondary",
        max_primary_ctas: 1,
      },
      {
        id: "GROXY-CRAFT-004",
        family: "surface_elevation",
        title: "Light/Dark Surface Elevation & Dual-Theme Contrast",
        severity: "error",
        checker: "check_surface_elevation_and_dual_contrast",
        repair_policy: "normalize_elevation_order_and_repair_contrast",
        required_tokens: ["--grex-surface-1", "--grex-surface-2"],
        min_contrast_ratio: 4.5,
      },
      {
        id: "GROXY-CRAFT-005",
        family: "cms_wiring",
        title: "Full-Stack GrabLab CMS & ForEach Wiring",
        severity: "error",
        checker: "check_live_cms_and_foreach_wiring",
        repair_policy: "strip_fabricated_actions_and_report_unknown_schema",
        allow_fabricated_action: false,
        require_exact_decimal_strings: true,
      },
    ],
  })
);

function getNodeId(node) {
  if (!node || typeof node !== "object") return "";
  if (typeof node.id === "string" && node.id.trim()) return node.id.trim();
  if (node.props && typeof node.props.id === "string" && node.props.id.trim()) return node.props.id.trim();
  return "";
}

function getElementName(node) {
  if (!node || typeof node !== "object") return "";
  return String(node.element || node.type || "").trim();
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

/** Condition C1: Builder-semantics ID resolution; 0 -> 404; >1 -> 422; forbids root/Fragment/TemplatePart. */
export function resolveSectionTarget(slotTree, sectionId) {
  const wanted = String(sectionId || "").trim();
  if (!wanted) {
    throw new SectionCopilotError("INVALID_SECTION_ID", "section_id is required.", 400);
  }
  if (!slotTree || typeof slotTree !== "object") {
    throw new SectionCopilotError("SLOT_NOT_FOUND", "Target slot layout tree is missing.", 404);
  }

  const matches = [];
  function walk(node, path, depth) {
    if (!node || typeof node !== "object") return;
    if (getNodeId(node) === wanted) {
      matches.push({ node, path, depth });
    }
    if (Array.isArray(node.children)) {
      for (let i = 0; i < node.children.length; i += 1) {
        walk(node.children[i], [...path, i], depth + 1);
      }
    }
  }
  walk(slotTree, [], 0);

  if (matches.length === 0) {
    throw new SectionCopilotError("SECTION_NOT_FOUND", `Section "${wanted}" was not found in target slot.`, 404);
  }
  if (matches.length > 1) {
    throw new SectionCopilotError("DUPLICATE_SECTION_ID", `Ambiguous duplicate section_id "${wanted}" (${matches.length} matches).`, 422);
  }

  const match = matches[0];
  const el = getElementName(match.node);
  if (match.depth === 0 || el === "Fragment" || el === "TemplatePart") {
    throw new SectionCopilotError(
      "INVALID_TARGET_NODE",
      `Section "${wanted}" targets a structural ${el || "root"} node and cannot be refined directly.`,
      422
    );
  }

  return { targetNode: match.node, path: match.path, depth: match.depth, matchCount: 1 };
}

function collectSiblingAndAncestorSignatures(tree, targetPath) {
  const entries = [];
  function walk(node, path) {
    const key = path.join(".");
    const targetKey = targetPath.join(".");
    if (key === targetKey) {
      return;
    }
    const isAncestor = targetKey.startsWith(key === "" ? "" : `${key}.`) && path.length < targetPath.length;
    if (isAncestor) {
      const shell = { ...node };
      if (Array.isArray(shell.children)) {
        shell.children = shell.children.map((_, idx) => `__CHILD_${idx}__`);
      }
      entries.push([`ancestor:${key}`, canonicalJson(shell)]);
      for (let i = 0; i < (node.children || []).length; i += 1) {
        walk(node.children[i], [...path, i]);
      }
    } else {
      entries.push([`sibling:${key}`, canonicalJson(node)]);
    }
  }
  walk(tree, []);
  return entries;
}

/** Patches only the resolved subtree and asserts all siblings and ancestors stay canonically identical. */
export function spliceSectionSubtree(slotTree, sectionId, replacementSubtree) {
  const { path } = resolveSectionTarget(slotTree, sectionId);
  const nextTree = deepClone(slotTree);
  let cursor = nextTree;
  for (let i = 0; i < path.length - 1; i += 1) {
    cursor = cursor.children[path[i]];
  }
  cursor.children[path[path.length - 1]] = deepClone(replacementSubtree);

  const beforeSigs = collectSiblingAndAncestorSignatures(slotTree, path);
  const afterSigs = collectSiblingAndAncestorSignatures(nextTree, path);
  if (canonicalJson(beforeSigs) !== canonicalJson(afterSigs)) {
    throw new SectionCopilotError("SIBLING_DRIFT", "Subtree splice altered a sibling or ancestor node.", 422);
  }
  return nextTree;
}

function parsePxValue(raw) {
  const s = String(raw || "").trim().toLowerCase();
  const pxMatch = /^(-?\d+(?:\.\d+)?)px$/.exec(s);
  if (pxMatch) return Number(pxMatch[1]);
  const remMatch = /^(-?\d+(?:\.\d+)?)rem$/.exec(s);
  if (remMatch) return Number(remMatch[1]) * 16;
  return null;
}

function parseChValue(raw) {
  const m = /^(-?\d+(?:\.\d+)?)ch$/i.exec(String(raw || "").trim());
  return m ? Number(m[1]) : null;
}

function extractCssVarNames(val) {
  const names = [];
  const re = /var\(\s*(--grex-[a-z0-9_-]+)\s*(?:,[^)]+)?\)/gi;
  let m;
  while ((m = re.exec(String(val || ""))) !== null) {
    names.push(m[1]);
  }
  return names;
}

function buildTokenLookup(designSystemMd) {
  const parsed = typeof designSystemMd === "string"
    ? parseDesignSystemMarkdown(designSystemMd)
    : (designSystemMd || { tokens: {}, modes: { light: {}, dark: {} }, allTokens: {}, reusableClasses: {} });
  const baseTokens = parsed.tokens || {};
  const lightTokens = { ...baseTokens, ...(parsed.modes?.light || {}) };
  const darkTokens = { ...baseTokens, ...(parsed.modes?.dark || {}) };
  const allTokens = { ...baseTokens, ...lightTokens, ...darkTokens };
  const registeredClasses = new Set(Object.keys(parsed.reusableClasses || {}));
  return { parsed, baseTokens, lightTokens, darkTokens, allTokens, registeredClasses };
}

function isPrimaryCtaNode(node) {
  const el = getElementName(node);
  if (el !== "Button" && el !== "Link") return false;
  const props = node.props || {};
  const cls = String(props.class || props.className || "").toLowerCase();
  if (props.variant === "secondary" || props.variant === "ghost" || props.variant === "link") {
    return false;
  }
  if (props.variant === "primary" || props.primary === true) return true;
  if (cls.includes("btn-primary") || cls.includes("cta-button")) return true;
  return false;
}

function demotePrimaryCta(node) {
  const props = { ...(node.props || {}) };
  delete props.primary;
  if (props.variant === "primary") {
    props.variant = "secondary";
  } else if (!props.variant) {
    props.variant = "secondary";
  }
  if (typeof props.class === "string" && props.class.trim()) {
    props.class = props.class
      .split(/\s+/)
      .filter((c) => c && !c.toLowerCase().includes("btn-primary") && !c.toLowerCase().includes("cta-button"))
      .join(" ");
    if (!props.class) delete props.class;
  }
  return { ...node, props };
}

function isTightInlinePair(node) {
  const el = getElementName(node);
  const props = node.props || {};
  const base = node.styles?.base || node.styles || {};
  const cls = String(props.class || "").toLowerCase();
  return (
    props.inline_pair === true ||
    el === "Nav" ||
    (el === "Stack" && (props.direction === "row" || base["flex-direction"] === "row")) ||
    cls.includes("inline") ||
    cls.includes("badge")
  );
}

function resolveLiveSpacingTokens(allTokens) {
  const out = [];
  for (const [name, rawVal] of Object.entries(allTokens)) {
    if (!name.startsWith("--grex-space")) continue;
    const px = parsePxValue(rawVal);
    if (px !== null && px >= 0) {
      out.push({ name, px });
    }
  }
  return out;
}

function pickNearest8ptToken(targetPx, spacingTokens) {
  const aligned8 = spacingTokens.filter((t) => t.px > 0 && t.px % 8 === 0);
  if (!aligned8.length) return null;
  let best = aligned8[0];
  let bestDist = Math.abs(best.px - targetPx);
  for (const cand of aligned8.slice(1)) {
    const d = Math.abs(cand.px - targetPx);
    if (d < bestDist) {
      best = cand;
      bestDist = d;
    }
  }
  return best;
}

function validateNodeNumerics(node, pathLabel = "subtree") {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    node.forEach((item, i) => validateNodeNumerics(item, `${pathLabel}[${i}]`));
    return;
  }
  for (const [k, v] of Object.entries(node)) {
    const kl = k.toLowerCase();
    if (EXACT_NUMERIC_KEYS.has(kl)) {
      if (typeof v === "number") {
        throw new SectionCopilotError(
          "ADR025C_WIRE_REQUIRED",
          `${pathLabel}.${k} must be an exact base-10 string; JavaScript numbers/floats are rejected.`,
          422
        );
      }
      if (typeof v === "string") {
        const isInt = kl === "quantity" || kl === "count" || kl === "item_count" || kl === "per_page" || kl === "sku";
        if (kl === "sku") {
          if (!v.trim()) {
            throw new SectionCopilotError("ADR025C_WIRE_REQUIRED", `${pathLabel}.sku cannot be empty.`, 422);
          }
        } else if (isInt ? !isExactGrabIntegerString(v) : !isExactGrabDecimalString(v)) {
          throw new SectionCopilotError(
            "ADR025C_WIRE_REQUIRED",
            `${pathLabel}.${k} "${v}" is not a canonical base-10 wire string.`,
            422
          );
        }
      }
    }
    if (v && typeof v === "object") {
      validateNodeNumerics(v, `${pathLabel}.${k}`);
    }
  }
}

/** Validates 20-element taxonomy, security guards, live --grex-* tokens, registered .grex-c-* classes, and ADR-025c numerics. */
export function validateSubtreeStrict(subtree, designSystem, depth = 1) {
  if (!subtree || typeof subtree !== "object" || Array.isArray(subtree)) {
    throw new SectionCopilotError("INVALID_SUBTREE", "Proposed subtree must be a Grex node object.", 422);
  }
  if (depth > 24) {
    throw new SectionCopilotError("GREX-SCHEMA-001", "Subtree nesting exceeds maximum depth (24).", 422);
  }
  const el = getElementName(subtree);
  if (!el || el.toLowerCase() === "div" || !STRICT_TWENTY_ELEMENTS.has(el)) {
    throw new SectionCopilotError(
      "GREX-SCHEMA-001",
      `Subtree uses disallowed element "${el || "unknown"}"; only the 20 semantic Grex elements are allowed.`,
      422
    );
  }
  if (typeof subtree.tag === "string" && subtree.tag.trim()) {
    const tag = subtree.tag.trim().toLowerCase();
    if (FORBIDDEN_TAGS.has(tag)) {
      throw new SectionCopilotError("GREX-SEC-003", `Forbidden HTML tag <${tag}> in proposed subtree.`, 422);
    }
  }
  const { allTokens, registeredClasses } = buildTokenLookup(designSystem);

  for (const bagName of ["props", "attrs"]) {
    const bag = subtree[bagName];
    if (bag && typeof bag === "object") {
      for (const [pk, pv] of Object.entries(bag)) {
        const pkl = pk.toLowerCase();
        if (pkl.startsWith("on") || pkl === "innerhtml" || pkl === "outerhtml" || pkl === "dangerouslysetinnerhtml" || pkl === "srcdoc") {
          throw new SectionCopilotError("GREX-SEC-004", `Forbidden attribute "${pk}" in proposed subtree.`, 422);
        }
        if (pkl === "href" || pkl === "src" || pkl === "action" || pkl === "formaction") {
          if (!isSafeUrl(String(pv ?? ""))) {
            throw new SectionCopilotError("GREX-SEC-003", `Unsafe URL protocol in ${pk}: ${String(pv)}`, 422);
          }
        }
        if (pkl === "class" || pkl === "classname") {
          for (const cls of String(pv ?? "").split(/\s+/).filter(Boolean)) {
            if (cls.startsWith("grex-c-")) {
              const shortName = cls.slice("grex-c-".length);
              if (!registeredClasses.has(shortName)) {
                throw new SectionCopilotError(
                  "UNREGISTERED_CLASS",
                  `Unregistered class ".${cls}" is absent from live GRAB-DESIGN-SYSTEM.md.`,
                  422
                );
              }
            }
          }
        }
        if (pkl === "html" && typeof pv === "string" && /<(?:div|script|iframe|object|embed|style)\b|javascript:/i.test(pv)) {
          throw new SectionCopilotError("GREX-SEC-003", "Unsafe HTML fragment in RichText props.html.", 422);
        }
      }
    }
  }

  if (subtree.styles && typeof subtree.styles === "object") {
    const styleMaps = (subtree.styles.base || subtree.styles.tablet || subtree.styles.mobile)
      ? [subtree.styles.base, subtree.styles.tablet, subtree.styles.mobile].filter(Boolean)
      : [subtree.styles];
    for (const sm of styleMaps) {
      if (sm && typeof sm === "object") {
        for (const [sk, sv] of Object.entries(sm)) {
          const svStr = String(sv ?? "");
          const svLower = svStr.toLowerCase();
          if (svLower.includes("javascript:") || svLower.includes("expression(") || svLower.includes("<script")) {
            throw new SectionCopilotError("GREX-SEC-004", `Unsafe CSS value in styles.${sk}.`, 422);
          }
          for (const tok of extractCssVarNames(svStr)) {
            if (!Object.prototype.hasOwnProperty.call(allTokens, tok)) {
              throw new SectionCopilotError(
                "UNKNOWN_DESIGN_TOKEN",
                `Unknown design token "${tok}" is absent from live GRAB-DESIGN-SYSTEM.md.`,
                422
              );
            }
          }
        }
      }
    }
  }

  validateNodeNumerics(subtree, el);

  if (Array.isArray(subtree.children)) {
    for (const child of subtree.children) {
      validateSubtreeStrict(child, designSystem, depth + 1);
    }
  }
  return true;
}

function resolveColorOrToken(raw, themeTokens, fallbackHex) {
  const s = String(raw || "").trim();
  if (!s) return fallbackHex;
  const vars = extractCssVarNames(s);
  if (vars.length > 0) {
    const resolved = themeTokens[vars[0]];
    if (resolved && /^#[0-9a-f]{3,6}$/i.test(resolved.trim())) {
      return resolved.trim();
    }
    return fallbackHex;
  }
  if (/^#[0-9a-f]{3,6}$/i.test(s)) return s;
  return null;
}

/** Condition C6: Dual-theme Light & Dark WCAG AA >= 4.5:1 audit and deterministic auto-repair. */
export function auditAndRepairDualThemeContrast(subtree, designSystem) {
  const { lightTokens, darkTokens } = buildTokenLookup(designSystem);
  const repairs = [];

  const themeDefaults = {
    light: {
      bg: resolveColorOrToken(lightTokens["--grex-bg"] || lightTokens["--grex-color-bg"], lightTokens, "#ffffff") || "#ffffff",
      fg: resolveColorOrToken(lightTokens["--grex-ink"] || lightTokens["--grex-color-text"] || lightTokens["--grex-text"], lightTokens, "#0f172a") || "#0f172a",
    },
    dark: {
      bg: resolveColorOrToken(darkTokens["--grex-bg"] || darkTokens["--grex-color-bg"], darkTokens, "#0f172a") || "#0f172a",
      fg: resolveColorOrToken(darkTokens["--grex-ink"] || darkTokens["--grex-color-text"] || darkTokens["--grex-text"], darkTokens, "#f8fafc") || "#f8fafc",
    },
  };

  function repairNode(node, inheritedLightBg, inheritedDarkBg) {
    const out = { ...node };
    const st = out.styles ? deepClone(out.styles) : null;
    const base = st ? (st.base || st) : null;
    let nextLightBg = inheritedLightBg;
    let nextDarkBg = inheritedDarkBg;

    if (base && typeof base === "object") {
      const rawBg = base["background-color"] ?? base.backgroundColor ?? base.background;
      const rawFg = base.color;

      if (rawBg) {
        const lb = resolveColorOrToken(rawBg, lightTokens, inheritedLightBg);
        const db = resolveColorOrToken(rawBg, darkTokens, inheritedDarkBg);
        if (lb) nextLightBg = lb;
        if (db) nextDarkBg = db;
      }

      if (rawFg) {
        const lFg = resolveColorOrToken(rawFg, lightTokens, null);
        const dFg = resolveColorOrToken(rawFg, darkTokens, null);
        const lRatio = lFg ? computeContrastRatio(lFg, nextLightBg) : null;
        const dRatio = dFg ? computeContrastRatio(dFg, nextDarkBg) : null;
        const lightBad = lRatio !== null && lRatio < 4.5;
        const darkBad = dRatio !== null && dRatio < 4.5;

        if (lightBad || darkBad) {
          const hasExplicitBg = Boolean(rawBg);
          const repairedFg = hasExplicitBg
            ? (computeContrastRatio("#0f172a", nextLightBg) >= 4.5 ? "#0f172a" : "#ffffff")
            : (Object.prototype.hasOwnProperty.call(lightTokens, "--grex-ink")
                ? "var(--grex-ink)"
                : Object.prototype.hasOwnProperty.call(lightTokens, "--grex-color-text")
                  ? "var(--grex-color-text)"
                  : "#0f172a");
          if (repairedFg.startsWith("#") && !hasExplicitBg) {
            base["background-color"] = "#ffffff";
            nextLightBg = "#ffffff";
            nextDarkBg = "#ffffff";
          }
          base.color = repairedFg;
          const verifyLightFg = resolveColorOrToken(repairedFg, lightTokens, "#0f172a");
          const verifyDarkFg = resolveColorOrToken(repairedFg, darkTokens, "#f8fafc");
          const afterLight = computeContrastRatio(verifyLightFg, nextLightBg);
          const afterDark = computeContrastRatio(verifyDarkFg, hasExplicitBg || repairedFg.startsWith("#") ? nextLightBg : nextDarkBg);
          if ((afterLight !== null && afterLight < 4.5) || (afterDark !== null && afterDark < 4.5)) {
            throw new SectionCopilotError(
              "WCAG_CONTRAST_UNREPAIRABLE",
              `Contrast failure on node "${getNodeId(node) || getElementName(node)}" could not be auto-repaired to WCAG AA >= 4.5:1 in Light and Dark modes.`,
              422
            );
          }
          repairs.push({
            rule_id: "GROXY-CRAFT-004",
            node_id: getNodeId(node) || getElementName(node),
            light_ratio_before: lRatio,
            dark_ratio_before: dRatio,
            repaired_color: repairedFg,
            light_ratio_after: afterLight,
            dark_ratio_after: afterDark,
          });
        }
      }
      if (st.base) st.base = base;
      out.styles = st;
    }

    if (Array.isArray(out.children)) {
      out.children = out.children.map((ch) => repairNode(ch, nextLightBg, nextDarkBg));
    }
    return out;
  }

  const repairedSubtree = repairNode(subtree, themeDefaults.light.bg, themeDefaults.dark.bg);
  return { repaired_subtree: repairedSubtree, contrast_repairs: repairs, light_passed: true, dark_passed: true };
}

/** Evaluates and safely repairs all 5 Design-Craft rules (C4 & C7 compliant). */
export function auditDesignCraft(subtree, context = {}) {
  const playbook = validateDesignCraftPlaybook(context.playbook || DEFAULT_DESIGN_CRAFT_PLAYBOOK);
  const { allTokens, lightTokens, darkTokens } = buildTokenLookup(context.designSystem);
  const cmsContentTypes = Array.isArray(context.cmsContentTypes) ? context.cmsContentTypes : null;

  const spacingTokens = resolveLiveSpacingTokens(allTokens);
  const hasMeasureToken = playbook.token_roles.line_measure.candidates.some((t) =>
    Object.prototype.hasOwnProperty.call(allTokens, t)
  );
  const liveMeasureToken = playbook.token_roles.line_measure.candidates.find((t) =>
    Object.prototype.hasOwnProperty.call(allTokens, t)
  ) || null;
  const hasSurface1 = Object.prototype.hasOwnProperty.call(allTokens, "--grex-surface-1");
  const hasSurface2 = Object.prototype.hasOwnProperty.call(allTokens, "--grex-surface-2");

  const warnings = [];
  const blockingErrors = [];
  const tokenUnavailable = [];
  const repairs = [];

  if (!hasMeasureToken) {
    const gap = {
      rule_id: "GROXY-CRAFT-002",
      code: "token_unavailable",
      severity: "warning",
      token_role: "line_measure",
      missing_tokens: playbook.token_roles.line_measure.candidates,
      guidance: playbook.token_roles.line_measure.guidance,
    };
    warnings.push(gap);
    tokenUnavailable.push(gap);
  }
  if (!hasSurface1 || !hasSurface2) {
    const missing = [];
    if (!hasSurface1) missing.push("--grex-surface-1");
    if (!hasSurface2) missing.push("--grex-surface-2");
    const gap = {
      rule_id: "GROXY-CRAFT-004",
      code: "token_unavailable",
      severity: "warning",
      token_role: "surface_elevation",
      missing_tokens: missing,
      guidance: "Add --grex-surface-1 and --grex-surface-2 in Light and Dark modes via Grex Theme Builder's Global Token Editor.",
    };
    warnings.push(gap);
    tokenUnavailable.push(gap);
  }

  let primaryCtaSeen = false;
  let repaired = deepClone(subtree);

  function walkAndRepair(node, parentElevation) {
    const el = getElementName(node);
    const nid = getNodeId(node) || el;
    const out = { ...node };
    const st = out.styles ? deepClone(out.styles) : null;
    const base = st ? (st.base || st) : null;

    // 1. Spacing rhythm (GROXY-CRAFT-001)
    if (base && typeof base === "object") {
      for (const prop of ["gap", "padding", "padding-top", "padding-bottom", "padding-left", "padding-right"]) {
        if (base[prop] === undefined) continue;
        const val = String(base[prop]).trim();
        const vars = extractCssVarNames(val);
        let px = null;
        if (vars.length > 0 && Object.prototype.hasOwnProperty.call(allTokens, vars[0])) {
          px = parsePxValue(allTokens[vars[0]]);
        } else if (vars.length === 0) {
          px = parsePxValue(val);
        }
        if (px !== null && px > 0 && px % 8 !== 0) {
          const is4ptInline = px % 8 === 4 && isTightInlinePair(out);
          if (!is4ptInline) {
            const snapped = pickNearest8ptToken(px, spacingTokens);
            if (snapped) {
              repairs.push({
                rule_id: "GROXY-CRAFT-001",
                node_id: nid,
                property: prop,
                before: val,
                after: `var(${snapped.name})`,
              });
              base[prop] = `var(${snapped.name})`;
            } else if (vars.length === 0) {
              blockingErrors.push({
                rule_id: "GROXY-CRAFT-001",
                node_id: nid,
                message: `Spacing "${val}" on ${prop} is not 8pt-aligned and no live 8pt spacing token is available.`,
              });
            } else {
              const gap = {
                rule_id: "GROXY-CRAFT-001",
                code: "token_unavailable",
                severity: "warning",
                token_role: "spacing",
                missing_tokens: ["--grex-space-md", "--grex-space-lg"],
                guidance: "Add 8pt-aligned spacing tokens (e.g. --grex-space-md: 24px) via Grex Theme Builder's Global Token Editor.",
              };
              warnings.push(gap);
              tokenUnavailable.push(gap);
            }
          }
        }
      }

      // 2. Line measure (GROXY-CRAFT-002)
      const mwKey = base["max-width"] !== undefined ? "max-width" : base.maxWidth !== undefined ? "maxWidth" : null;
      if (mwKey) {
        const mwVal = String(base[mwKey]).trim();
        const ch = parseChValue(mwVal);
        if (ch !== null && (ch < 60 || ch > 65)) {
          if (liveMeasureToken) {
            repairs.push({
              rule_id: "GROXY-CRAFT-002",
              node_id: nid,
              property: mwKey,
              before: mwVal,
              after: `var(${liveMeasureToken})`,
            });
            base[mwKey] = `var(${liveMeasureToken})`;
          } else {
            // Condition C4: never emit a missing token or hardcode 65ch; remove offending out-of-range literal.
            delete base[mwKey];
            repairs.push({
              rule_id: "GROXY-CRAFT-002",
              node_id: nid,
              property: mwKey,
              before: mwVal,
              after: "(removed out-of-range literal; measure token_unavailable)",
            });
          }
        }
      }

      // 4. Surface elevation ordering when --grex-surface-1 / --grex-surface-2 exist (GROXY-CRAFT-004)
      let currentElevation = parentElevation;
      const bgVal = String(base["background-color"] || base.backgroundColor || "");
      if (hasSurface1 && hasSurface2) {
        if (bgVal.includes("--grex-surface-2")) currentElevation = 2;
        else if (bgVal.includes("--grex-surface-1")) currentElevation = 1;
        if (parentElevation === 2 && currentElevation === 1) {
          base["background-color"] = "var(--grex-surface-2)";
          repairs.push({
            rule_id: "GROXY-CRAFT-004",
            node_id: nid,
            property: "background-color",
            before: bgVal,
            after: "var(--grex-surface-2)",
          });
          currentElevation = 2;
        }
      }
      if (st.base) st.base = base;
      out.styles = st;
      parentElevation = currentElevation;
    }

    // 3. Single Primary CTA per fold (GROXY-CRAFT-003)
    if (isPrimaryCtaNode(out)) {
      if (primaryCtaSeen) {
        const demoted = demotePrimaryCta(out);
        out.props = demoted.props;
        repairs.push({
          rule_id: "GROXY-CRAFT-003",
          node_id: nid,
          property: "cta_hierarchy",
          before: "primary",
          after: "secondary",
        });
      } else {
        primaryCtaSeen = true;
      }
    }

    // 5. Full-stack GrabLab CMS & ForEach wiring (GROXY-CRAFT-005, Condition C7)
    if (el === "ForEach") {
      const q = out.props?.query;
      if (!q || typeof q !== "object" || Array.isArray(q)) {
        blockingErrors.push({
          rule_id: "GROXY-CRAFT-005",
          node_id: nid,
          message: "ForEach node must supply a structured props.query object.",
        });
      } else {
        if (q.per_page !== undefined && (typeof q.per_page !== "string" || !isExactGrabIntegerString(q.per_page))) {
          blockingErrors.push({
            rule_id: "GROXY-CRAFT-005",
            node_id: nid,
            message: "ForEach query.per_page must be an exact integer string (ADR-025c).",
          });
        }
        const ctSlug = String(q.content_type || "").trim();
        if (cmsContentTypes && ctSlug) {
          const matchedCt = cmsContentTypes.find((ct) => String(ct.slug || "") === ctSlug);
          if (!matchedCt) {
            blockingErrors.push({
              rule_id: "GROXY-CRAFT-005",
              node_id: nid,
              code: "unknown_content_type",
              message: `ForEach content_type "${ctSlug}" does not exist in live GrabLab CMS list_content_types.`,
            });
          } else {
            const allowedKeys = new Set([
              ...playbook.cms_wiring.standard_entry_fields,
              ...((matchedCt.fields || matchedCt.field_definitions || []).map((f) => String(f.field_key || ""))),
            ]);
            const checkBindings = (n) => {
              if (!n || typeof n !== "object") return;
              const p = n.props || {};
              for (const bKey of playbook.cms_wiring.foreach_allowed_bindings) {
                if (typeof p[bKey] === "string") {
                  const matches = p[bKey].match(/\{([a-zA-Z0-9_]+)\}/g) || [];
                  for (const tok of matches) {
                    const fName = tok.slice(1, -1);
                    if (!allowedKeys.has(fName)) {
                      blockingErrors.push({
                        rule_id: "GROXY-CRAFT-005",
                        node_id: getNodeId(n) || nid,
                        code: "unknown_field_key",
                        message: `Dynamic binding "{${fName}}" does not exist on GrabLab content type "${ctSlug}".`,
                      });
                    }
                  }
                }
              }
              if (Array.isArray(n.children)) n.children.forEach(checkBindings);
            };
            checkBindings(out);
          }
        }
      }
    }

    if (el === "Form") {
      const formProps = out.props ? { ...out.props } : {};
      if (typeof formProps.action === "string" && formProps.action.trim()) {
        const act = formProps.action.trim();
        if (!act.startsWith("/") || act.startsWith("//") || act.startsWith("/api/cms/submit") || act.startsWith("/api/forms/")) {
          // Condition C7: CMS v1.0.1 exposes no public form-submission route; never fabricate action.
          delete formProps.action;
          repairs.push({
            rule_id: "GROXY-CRAFT-005",
            node_id: nid,
            property: "action",
            before: act,
            after: "(omitted per C7: CMS v1.0.1 has no public form submit route)",
          });
        }
      }
      out.props = formProps;
      const formCt = String(formProps.content_type || "").trim();
      if (cmsContentTypes && formCt) {
        const matchedCt = cmsContentTypes.find((ct) => String(ct.slug || "") === formCt);
        if (!matchedCt) {
          blockingErrors.push({
            rule_id: "GROXY-CRAFT-005",
            node_id: nid,
            code: "unknown_content_type",
            message: `Form content_type "${formCt}" does not exist in live GrabLab CMS.`,
          });
        } else {
          const allowedKeys = new Set([
            ...playbook.cms_wiring.standard_entry_fields,
            ...((matchedCt.fields || matchedCt.field_definitions || []).map((f) => String(f.field_key || ""))),
          ]);
          const checkInputs = (n) => {
            if (!n || typeof n !== "object") return;
            const nel = getElementName(n);
            if (nel === "Input" || nel === "Select") {
              const fk = String(n.props?.field_key || n.props?.name || "").trim();
              if (fk && !allowedKeys.has(fk)) {
                blockingErrors.push({
                  rule_id: "GROXY-CRAFT-005",
                  node_id: getNodeId(n) || nid,
                  code: "unknown_field_key",
                  message: `Form field "${fk}" does not exist on GrabLab content type "${formCt}".`,
                });
              }
            }
            if (Array.isArray(n.children)) n.children.forEach(checkInputs);
          };
          checkInputs(out);
        }
      }
    }

    if (Array.isArray(out.children)) {
      out.children = out.children.map((ch) => walkAndRepair(ch, parentElevation));
    }
    return out;
  }

  repaired = walkAndRepair(repaired, 0);
  const contrastResult = auditAndRepairDualThemeContrast(repaired, context.designSystem);
  repaired = contrastResult.repaired_subtree;

  const allRepairs = [...repairs, ...contrastResult.contrast_repairs];
  const ruleResults = playbook.rules.map((r) => {
    const ruleErrs = blockingErrors.filter((e) => e.rule_id === r.id);
    const ruleWarns = warnings.filter((w) => w.rule_id === r.id);
    const ruleRepairs = allRepairs.filter((rep) => rep.rule_id === r.id);
    return {
      rule_id: r.id,
      family: r.family,
      status: ruleErrs.length > 0 ? "fail" : ruleWarns.length > 0 ? "warning" : "pass",
      repaired_count: ruleRepairs.length,
      warnings: ruleWarns,
      errors: ruleErrs,
    };
  });

  return {
    valid: blockingErrors.length === 0,
    blocking_errors: blockingErrors,
    warnings,
    token_unavailable: tokenUnavailable,
    repairs: allRepairs,
    contrast_repairs: contrastResult.contrast_repairs,
    light_contrast_passed: contrastResult.light_passed,
    dark_contrast_passed: contrastResult.dark_passed,
    rule_results: ruleResults,
    repaired_subtree: repaired,
    tokens_available: {
      light_count: Object.keys(lightTokens).length,
      dark_count: Object.keys(darkTokens).length,
    },
  };
}

function collectTextNodes(node, out = []) {
  if (!node || typeof node !== "object") return out;
  const id = getNodeId(node) || getElementName(node);
  const props = node.props || {};
  if (typeof props.text === "string" && props.text.trim()) {
    out.push({ node_id: id, element: getElementName(node), text: props.text });
  }
  if (Array.isArray(node.children)) {
    for (const ch of node.children) collectTextNodes(ch, out);
  }
  return out;
}

export function computeSubtreeDiff(beforeSubtree, afterSubtree) {
  const beforeTexts = collectTextNodes(beforeSubtree, []);
  const afterTexts = collectTextNodes(afterSubtree, []);
  const beforeMap = new Map(beforeTexts.map((t) => [t.node_id, t.text]));
  const afterMap = new Map(afterTexts.map((t) => [t.node_id, t.text]));
  const allIds = [...new Set([...beforeMap.keys(), ...afterMap.keys()])];

  const textDiff = allIds.map((id) => {
    const b = beforeMap.get(id) ?? "";
    const a = afterMap.get(id) ?? "";
    return { node_id: id, before: b, after: a, changed: b !== a };
  });

  return {
    before_subtree: beforeSubtree,
    after_subtree: afterSubtree,
    text_diff: textDiff,
    copy_preserved: beforeTexts.every((item) => afterMap.get(item.node_id) === item.text),
    before_json: JSON.stringify(beforeSubtree, null, 2),
    after_json: JSON.stringify(afterSubtree, null, 2),
  };
}

/** Deterministic offline section refinement engine respecting C4, C7, and human copy preservation. */
export function refineSectionDeterministically(subtree, instruction, context = {}) {
  const cleanInst = String(instruction || "").trim();
  const lower = cleanInst.toLowerCase();
  const next = deepClone(subtree);
  const { allTokens } = buildTokenLookup(context.designSystem);
  const spacingTokens = resolveLiveSpacingTokens(allTokens);
  const changes = [];

  if (!next.props || typeof next.props !== "object") next.props = {};
  if (getElementName(next) === "Section" && !next.props["aria-label"] && !next.props.label) {
    next.props["aria-label"] = "Refined Section";
    changes.push("Added descriptive aria-label to Section.");
  }

  // Intent: calmer / spacing / rhythm
  if (/(calm|breath|space|spacing|rhythm|pad|gap)/.test(lower)) {
    const calmToken = pickNearest8ptToken(24, spacingTokens);
    if (calmToken) {
      next.styles = next.styles || {};
      next.styles.base = { ...(next.styles.base || {}), padding: `var(${calmToken.name})`, gap: `var(${calmToken.name})` };
      changes.push(`Applied 8pt spacing token var(${calmToken.name}).`);
    }
  }

  // Intent: one button / single CTA
  if (/(one button|single button|one cta|single cta|demote|primary cta)/.test(lower)) {
    let seenPrimary = false;
    const enforceOneCta = (n) => {
      if (isPrimaryCtaNode(n)) {
        if (seenPrimary) {
          Object.assign(n, demotePrimaryCta(n));
          changes.push(`Demoted extra primary CTA "${getNodeId(n) || "cta"}" to secondary.`);
        } else {
          seenPrimary = true;
        }
      }
      if (Array.isArray(n.children)) n.children.forEach(enforceOneCta);
    };
    enforceOneCta(next);
    if (!seenPrimary) {
      next.children = Array.isArray(next.children) ? next.children : [];
      next.children.push({
        element: "Link",
        props: {
          id: `${getNodeId(next) || "section"}-primary-cta`,
          href: "/blog",
          text: "Explore guides",
          variant: "primary",
        },
      });
      changes.push("Added one accessible primary CTA Link.");
    }
  }

  // Intent: shorter line length / measure (C4: use live measure token only; never fabricate 65ch)
  if (/(line length|measure|60ch|65ch|narrower|readable)/.test(lower)) {
    const liveMeasure = ["--grex-measure", "--grex-text-measure", "--grex-prose-width"].find((t) =>
      Object.prototype.hasOwnProperty.call(allTokens, t)
    );
    if (liveMeasure) {
      next.styles = next.styles || {};
      next.styles.base = { ...(next.styles.base || {}), "max-width": `var(${liveMeasure})` };
      changes.push(`Applied live line-measure token var(${liveMeasure}).`);
    } else {
      changes.push("Line-measure token unavailable in live design-system.md; flagged token_unavailable without fabricating 65ch.");
    }
  }

  // Intent: explicit copy rewrite only when instructed
  if (/(rewrite|change headline|update heading|shorten copy)/.test(lower)) {
    const firstText = (next.children || []).find((c) => getElementName(c) === "Text" && typeof c.props?.text === "string");
    if (firstText && lower.includes("shorten copy") && firstText.props.text.length > 140) {
      firstText.props.text = `${firstText.props.text.slice(0, 120).trim()}...`;
      changes.push("Shortened body copy per explicit instruction.");
    }
  }

  const craft = auditDesignCraft(next, context);
  validateSubtreeStrict(craft.repaired_subtree, context.designSystem);

  return {
    refined_subtree: craft.repaired_subtree,
    craft_report: craft,
    structural_changes: changes,
    diff: computeSubtreeDiff(subtree, craft.repaired_subtree),
  };
}

function toGrexAuditNode(node, palette = "light") {
  const el = getElementName(node) || "Section";
  const props = { ...(node.props || {}) };
  const attrs = {};
  if (props.id) { attrs.id = props.id; delete props.id; }
  if (props.class) { attrs.class = props.class; delete props.class; }
  if (props["aria-label"]) { attrs["aria-label"] = props["aria-label"]; delete props["aria-label"]; }
  if (el === "Section" && !props.label) props.label = attrs["aria-label"] || "Section Co-Pilot";
  const out = {
    type: el,
    tag: node.tag,
    props,
    attrs,
    styles: {
      color: palette === "dark" ? "#f8fafc" : "#0f172a",
      "background-color": palette === "dark" ? "#0f172a" : "#ffffff",
    },
  };
  if (Array.isArray(node.children) && node.children.length > 0) {
    out.children = node.children.map((ch) => toGrexAuditNode(ch, palette));
  }
  return out;
}

/** Audits the Section Co-Pilot studio UI itself using Grex JS validateElementNode + Light/Dark auditAccessibility. */
export function auditSectionCopilotStudio(palette = "light") {
  const studioTree = {
    element: "Section",
    tag: "section",
    props: { id: "section-copilot-studio", label: "Iterative Section Co-Pilot & Design-Craft Studio" },
    children: [
      { element: "Heading", tag: "h2", props: { level: 2, text: "Iterative Section Co-Pilot" }, children: [] },
      {
        element: "Form",
        tag: "form",
        props: {},
        children: [
          { element: "Input", tag: "input", props: { label: "Target Builder slot", type: "text", required: true }, children: [] },
          { element: "Input", tag: "input", props: { label: "Target section_id", type: "text", required: true }, children: [] },
          { element: "Input", tag: "textarea", props: { label: "Plain-English refinement instruction", type: "textarea", required: true }, children: [] },
          {
            element: "Select",
            tag: "select",
            props: {
              label: "Generation mode",
              options: [
                { value: "deterministic", label: "Deterministic (Zero Fee)" },
                { value: "ollama", label: "Local Ollama (127.0.0.1:11434)" },
                { value: "byok", label: "Allowlisted HTTPS BYOK" },
              ],
            },
            children: [],
          },
          { element: "Button", tag: "button", props: { type: "submit", text: "Propose Section Refinement" }, children: [] },
        ],
      },
      {
        element: "Modal",
        tag: "dialog",
        props: { open: true, title: "Confirm Section Refinement" },
        children: [
          { element: "Heading", tag: "h3", props: { level: 3, text: "Confirm Section Refinement" }, children: [] },
          { element: "Text", tag: "p", props: { text: "Review subtree diff and Design-Craft report before applying." }, children: [] },
          { element: "Button", tag: "button", props: { type: "button", text: "Approve & Apply to Builder" }, children: [] },
          { element: "Button", tag: "button", props: { type: "button", text: "Cancel" }, children: [] },
        ],
      },
    ],
  };
  const tree = toGrexAuditNode(studioTree, palette);
  validateElementNode(tree);
  const accessibility = auditAccessibility(tree);
  return { valid: true, palette, accessibility };
}

function appendEl(doc, parent, tag, attrs = {}, text = "") {
  const el = doc.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v !== undefined && v !== null) el.setAttribute(k, String(v));
  }
  if (text) setSafeText(el, text);
  parent.appendChild(el);
  return el;
}

/** Pure Grex JS v1.0.0 semantic UI panel for /groxy (zero <div>, zero innerHTML, Escape/focus-restoring dialog). */
export function mountSectionCopilotStudio({ root, document: doc = globalThis.document, csrfToken = "", fetchFn = globalThis.fetch } = {}) {
  if (!root || !doc) throw new TypeError("Section Co-Pilot requires a root and document.");

  const section = appendEl(doc, root, "section", {
    id: "section-copilot-studio",
    class: "groxy-card groxy-section-copilot",
    "aria-labelledby": "section-copilot-title",
  });
  appendEl(doc, section, "h2", { id: "section-copilot-title" }, "Iterative Section Co-Pilot & Design-Craft Studio (v1.6.0)");
  appendEl(
    doc,
    section,
    "p",
    { class: "groxy-muted" },
    "Refine one Grex Theme Builder section in plain conversation. Sibling sections remain byte-for-byte unchanged, Design-Craft rules (8pt, 60-65ch, 1 CTA, Light/Dark contrast, CMS wiring) run before staging, and apply requires your explicit approval."
  );

  const form = appendEl(doc, section, "form", { id: "section-copilot-form" });

  const slotField = appendEl(doc, form, "p", { class: "groxy-field" });
  appendEl(doc, slotField, "label", { for: "copilot-slot-input" }, "Target Builder slot");
  const slotInput = appendEl(doc, slotField, "input", {
    id: "copilot-slot-input",
    name: "slot",
    type: "text",
    value: "home",
    required: "required",
    maxlength: "64",
  });

  const secField = appendEl(doc, form, "p", { class: "groxy-field" });
  appendEl(doc, secField, "label", { for: "copilot-section-input" }, "Target section_id");
  const sectionInput = appendEl(doc, secField, "input", {
    id: "copilot-section-input",
    name: "section_id",
    type: "text",
    value: "home-hero",
    required: "required",
    maxlength: "128",
  });

  const modeField = appendEl(doc, form, "p", { class: "groxy-field" });
  appendEl(doc, modeField, "label", { for: "copilot-mode-select" }, "Generation mode");
  const modeSelect = appendEl(doc, modeField, "select", { id: "copilot-mode-select", name: "generation_mode" });
  for (const [val, lbl] of [
    ["deterministic", "Deterministic (Offline, Zero Fee)"],
    ["ollama", "Local Ollama (127.0.0.1:11434)"],
    ["byok", "Allowlisted HTTPS BYOK"],
  ]) {
    appendEl(doc, modeSelect, "option", { value: val }, lbl);
  }

  const instField = appendEl(doc, form, "p", { class: "groxy-field" });
  appendEl(doc, instField, "label", { for: "copilot-instruction-input" }, "Plain-English section refinement instruction");
  const instInput = appendEl(doc, instField, "textarea", {
    id: "copilot-instruction-input",
    name: "instruction",
    rows: "3",
    maxlength: "2000",
    required: "required",
  });
  instInput.value = "Make this hero calmer, keep one primary CTA button, and improve spacing rhythm.";

  const actions = appendEl(doc, form, "p", { class: "groxy-actions" });
  const proposeBtn = appendEl(doc, actions, "button", { id: "copilot-propose-btn", type: "submit", class: "groxy-btn" }, "Propose Section Refinement");
  const reviewApplyBtn = appendEl(doc, actions, "button", { id: "copilot-review-apply-btn", type: "button", class: "groxy-btn", disabled: "disabled" }, "Review & Apply to Builder");
  const discardBtn = appendEl(doc, actions, "button", { id: "copilot-discard-btn", type: "button", class: "groxy-btn groxy-btn-secondary", disabled: "disabled" }, "Discard Proposal");

  const statusOut = appendEl(doc, section, "p", { id: "copilot-status", role: "status", "aria-live": "polite", class: "groxy-muted" }, "No section refinement staged.");
  const errorOut = appendEl(doc, section, "p", { id: "copilot-error", role: "alert", class: "groxy-alert-danger" }, "");

  const diffDetails = appendEl(doc, section, "details", { id: "copilot-diff-details" });
  appendEl(doc, diffDetails, "summary", {}, "Side-by-Side Subtree Diff & Design-Craft Report");
  const craftSummary = appendEl(doc, diffDetails, "p", { id: "copilot-craft-summary", class: "groxy-muted" }, "Design-Craft checks will appear after proposing a refinement.");
  const beforePre = appendEl(doc, diffDetails, "pre", { id: "copilot-before-pre", "aria-label": "Before subtree preview" }, "");
  const afterPre = appendEl(doc, diffDetails, "pre", { id: "copilot-after-pre", "aria-label": "After subtree preview" }, "");

  const confirmDialog = appendEl(doc, section, "dialog", {
    id: "copilot-confirm-dialog",
    class: "groxy-commerce-dialog",
    "aria-labelledby": "copilot-dialog-title",
  });
  appendEl(doc, confirmDialog, "h3", { id: "copilot-dialog-title" }, "Confirm One-Slot Builder Subtree Patch");
  const dialogSummary = appendEl(doc, confirmDialog, "p", { id: "copilot-dialog-summary" }, "");
  const dialogActions = appendEl(doc, confirmDialog, "p", { class: "groxy-actions" });
  const confirmApplyBtn = appendEl(doc, dialogActions, "button", { id: "copilot-confirm-apply-btn", type: "button", class: "groxy-btn" }, "Approve & Apply to Builder");
  const cancelDialogBtn = appendEl(doc, dialogActions, "button", { id: "copilot-cancel-dialog-btn", type: "button", class: "groxy-btn groxy-btn-secondary" }, "Cancel");

  let staged = null;
  let lastOpener = null;

  const setDialogOpen = (open) => {
    if (open) {
      confirmDialog.setAttribute("open", "open");
      if (typeof confirmDialog.showModal === "function") {
        try { confirmDialog.showModal(); } catch { /* fallback attribute open */ }
      }
      confirmApplyBtn.focus?.();
    } else {
      confirmDialog.removeAttribute("open");
      if (typeof confirmDialog.close === "function") {
        try { confirmDialog.close(); } catch { /* ignore */ }
      }
      if (lastOpener && typeof lastOpener.focus === "function") {
        lastOpener.focus();
      }
    }
  };

  const renderStaged = () => {
    if (!staged) {
      reviewApplyBtn.setAttribute("disabled", "disabled");
      reviewApplyBtn.disabled = true;
      discardBtn.setAttribute("disabled", "disabled");
      discardBtn.disabled = true;
      setSafeText(beforePre, "");
      setSafeText(afterPre, "");
      return;
    }
    reviewApplyBtn.removeAttribute("disabled");
    reviewApplyBtn.disabled = false;
    discardBtn.removeAttribute("disabled");
    discardBtn.disabled = false;
    setSafeText(beforePre, JSON.stringify(staged.before_subtree, null, 2));
    setSafeText(afterPre, JSON.stringify(staged.after_subtree, null, 2));
    const craft = staged.design_craft || {};
    const grade = staged.audit_report?.overall_grade || "A";
    const score = staged.audit_report?.overall_score ?? 95;
    setSafeText(
      craftSummary,
      `Audit Grade: ${grade} (${score}/100) | Repairs: ${(craft.repairs || []).length} | Token gaps: ${(craft.token_unavailable || []).length}`
    );
    setSafeText(
      dialogSummary,
      `Apply refined subtree for "${staged.section_id}" in slot "${staged.slot}" (refine_id: ${staged.refine_id}, Grade ${grade}). Only this subtree will be patched; 1-click Ctrl+Z undo remains available in Grex Theme Builder.`
    );
  };

  const propose = async () => {
    setSafeText(errorOut, "");
    const payload = {
      slot: String(slotInput.value || "").trim(),
      section_id: String(sectionInput.value || "").trim(),
      instruction: String(instInput.value || "").trim(),
      generation_mode: String(modeSelect.value || "deterministic"),
    };
    if (!payload.slot || !payload.section_id || !payload.instruction) {
      setSafeText(errorOut, "Slot, section_id, and instruction are required.");
      return null;
    }
    if (typeof fetchFn !== "function") {
      setSafeText(statusOut, "Offline preview ready (server fetch unavailable).");
      return null;
    }
    proposeBtn.disabled = true;
    try {
      const resp = await fetchFn("/api/groxy/section-refine", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setSafeText(errorOut, data.error || "Section refinement failed.");
        return null;
      }
      staged = data;
      setSafeText(statusOut, `Staged refinement ${data.refine_id} for ${data.slot}#${data.section_id}. Review diff before applying.`);
      renderStaged();
      return data;
    } catch (err) {
      setSafeText(errorOut, err?.message || "Section refinement request failed.");
      return null;
    } finally {
      proposeBtn.disabled = false;
    }
  };

  const applyStaged = async () => {
    if (!staged || typeof fetchFn !== "function") return null;
    setSafeText(errorOut, "");
    confirmApplyBtn.disabled = true;
    try {
      const resp = await fetchFn("/api/groxy/section-refine/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
        body: JSON.stringify({
          refine_id: staged.refine_id,
          slot: staged.slot,
          section_id: staged.section_id,
          subtree_sha256: staged.subtree_sha256,
          approval_token: staged.approval_token,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setSafeText(errorOut, data.error || "Apply failed.");
        return null;
      }
      setSafeText(statusOut, `Applied ${staged.section_id} to Builder slot "${data.builder_slot}" via applyAiLayout (actor: ${data.actor}).`);
      staged = null;
      renderStaged();
      setDialogOpen(false);
      return data;
    } catch (err) {
      setSafeText(errorOut, err?.message || "Apply request failed.");
      return null;
    } finally {
      confirmApplyBtn.disabled = false;
    }
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void propose();
  });
  reviewApplyBtn.addEventListener("click", () => {
    if (!staged) return;
    lastOpener = reviewApplyBtn;
    setDialogOpen(true);
  });
  reviewApplyBtn.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (staged) {
        lastOpener = reviewApplyBtn;
        setDialogOpen(true);
      }
    }
  });
  confirmApplyBtn.addEventListener("click", () => {
    void applyStaged();
  });
  cancelDialogBtn.addEventListener("click", () => {
    setDialogOpen(false);
  });
  confirmDialog.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault?.();
      setDialogOpen(false);
    }
  });
  discardBtn.addEventListener("click", () => {
    staged = null;
    renderStaged();
    setSafeText(statusOut, "Discarded staged section refinement.");
    setSafeText(errorOut, "");
  });

  return {
    section,
    propose,
    applyStaged,
    getStaged: () => staged,
    openConfirmDialog: () => {
      if (staged) {
        lastOpener = reviewApplyBtn;
        setDialogOpen(true);
      }
    },
    closeConfirmDialog: () => setDialogOpen(false),
    dispose: () => section.parentNode?.removeChild(section),
  };
}
