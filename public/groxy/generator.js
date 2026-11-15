/**
 * Groxy AI v1.0.0 — Autonomous `GRAB-DESIGN-SYSTEM.md`-Aware Visual Page & Section Generator
 *
 * Pure zero-dependency ES module producing semantic 20-element `grex.elements.json` trees
 * across 8 industry & goal-aware Style Packs and 5 Blueprints (40 combinations) with active
 * `--grex-*` tokens, registered `.grex-c-*` utility classes, exact `GrabDecimal` /
 * `GrabInteger` wire string preservation (`ADR-025c`), strict `validateElementNode()` + WCAG AA
 * `auditAccessibility()` compliance, and pre-dispatch 4-pillar Grade A / A+ gating.
 */

export const GROXY_VERSION = "1.0.0";

import {
  auditAccessibility,
  computeContrastRatio,
  exportElementCatalog,
  GrexSecurityError,
  isSafeUrl,
  validateElementNode,
} from "./grex.js";
import { DEFAULT_SEO_PLAYBOOK, parseDesignSystemMarkdown } from "./playbook.js";
import {
  auditEntryAndLayout,
  isExactGrabDecimalString,
  isExactGrabIntegerString,
} from "./auditor.js";

const CATALOG_ELEMENTS = exportElementCatalog().elements;

const REQUIRED_STYLE_PACKS = [
  {
    id: "emerald-editorial",
    label: "Emerald Editorial",
    description:
      "High-contrast editorial typography, generous vertical rhythm (--grex-space-lg), emerald primary accents (--grex-primary), and structured Card callouts.",
    industries: ["editorial", "media", "consulting", "nonprofit", "docs"],
    conversion_goals: ["editorial", "lead_gen"],
    token_preferences: [
      "--grex-surface",
      "--grex-text",
      "--grex-primary",
      "--grex-space-lg",
      "--grex-radius-md",
    ],
    class_hints: ["hero", "hero-card", "card", "btn-primary", "badge-pill", "grid-3", "cta-button"],
    palette_defaults: {
      light: {
        bg: "#ffffff",
        surface: "#f8fafc",
        text: "#0f172a",
        primary: "#047857",
        on_primary: "#ffffff",
        border: "#cbd5e1",
        muted: "#475569",
      },
      dark: {
        bg: "#0f172a",
        surface: "#1e293b",
        text: "#f8fafc",
        primary: "#34d399",
        on_primary: "#064e3b",
        border: "#334155",
        muted: "#cbd5e1",
      },
    },
  },
  {
    id: "obsidian-tech",
    label: "Obsidian Developer Studio",
    description:
      "Crisp technical hierarchy, high-contrast dark/light surface cards (--grex-surface-elevated), compact feature Grids, and scannable metric badges.",
    industries: ["developer_tools", "saas", "ai", "cloud", "devtools"],
    conversion_goals: ["saas", "lead_gen"],
    token_preferences: [
      "--grex-surface-elevated",
      "--grex-text",
      "--grex-primary",
      "--grex-space-md",
      "--grex-radius-sm",
    ],
    class_hints: ["hero", "hero-card", "card", "btn-primary", "badge-pill", "grid-3"],
    palette_defaults: {
      light: {
        bg: "#f8fafc",
        surface: "#ffffff",
        text: "#09090b",
        primary: "#1d4ed8",
        on_primary: "#ffffff",
        border: "#cbd5e1",
        muted: "#334155",
      },
      dark: {
        bg: "#09090b",
        surface: "#18181b",
        text: "#fafafa",
        primary: "#60a5fa",
        on_primary: "#09090b",
        border: "#27272a",
        muted: "#d4d4d8",
      },
    },
  },
  {
    id: "warm-commerce",
    label: "Warm Precision Commerce",
    description:
      "Conversion-focused product & pricing hierarchy, GrabDecimal-exact price callouts, trust Accordion FAQs, and clear primary/secondary Button pairs.",
    industries: ["retail", "dtc", "specialty_goods", "ecommerce", "food_beverage"],
    conversion_goals: ["ecommerce", "lead_gen"],
    token_preferences: [
      "--grex-surface",
      "--grex-text",
      "--grex-primary",
      "--grex-space-md",
      "--grex-radius-lg",
    ],
    class_hints: ["hero", "card", "btn-primary", "badge-pill", "grid-3", "cta-button"],
    palette_defaults: {
      light: {
        bg: "#fffbeb",
        surface: "#ffffff",
        text: "#1c1917",
        primary: "#92400e",
        on_primary: "#ffffff",
        border: "#fde68a",
        muted: "#44403c",
      },
      dark: {
        bg: "#1c1917",
        surface: "#292524",
        text: "#fafaf9",
        primary: "#fbbf24",
        on_primary: "#1c1917",
        border: "#44403c",
        muted: "#d6d3d1",
      },
    },
  },
  {
    id: "swiss-minimal",
    label: "Swiss Grid Minimal",
    description:
      "Clean geometric Grid proportions, strong H1-H3 typographic scale, restrained borders (--grex-border), and distraction-free reading flow.",
    industries: ["architecture", "design", "documentation", "agency", "editorial"],
    conversion_goals: ["portfolio", "editorial"],
    token_preferences: [
      "--grex-bg",
      "--grex-text",
      "--grex-primary",
      "--grex-border",
      "--grex-space-lg",
    ],
    class_hints: ["hero", "card", "btn-primary", "grid-3"],
    palette_defaults: {
      light: {
        bg: "#ffffff",
        surface: "#f4f4f5",
        text: "#18181b",
        primary: "#b91c1c",
        on_primary: "#ffffff",
        border: "#d4d4d8",
        muted: "#3f3f46",
      },
      dark: {
        bg: "#18181b",
        surface: "#27272a",
        text: "#fafafa",
        primary: "#f87171",
        on_primary: "#18181b",
        border: "#3f3f46",
        muted: "#d4d4d8",
      },
    },
  },
  {
    id: "local-service-trust",
    label: "Local Service Trust",
    description:
      "Authority-driven trust hierarchy with prominent booking CTAs, credential Badges, transparent Pricing Grids, and WCAG AA coastal slate/blue contrast.",
    industries: ["home_services", "legal", "medical", "automotive", "real_estate"],
    conversion_goals: ["lead_gen"],
    token_preferences: [
      "--grex-surface",
      "--grex-text",
      "--grex-primary",
      "--grex-space-md",
      "--grex-radius-md",
    ],
    class_hints: ["hero", "hero-card", "card", "btn-primary", "badge-pill", "grid-3", "cta-button"],
    palette_defaults: {
      light: {
        bg: "#f8fafc",
        surface: "#ffffff",
        text: "#0f172a",
        primary: "#0369a1",
        on_primary: "#ffffff",
        border: "#cbd5e1",
        muted: "#334155",
      },
      dark: {
        bg: "#0f172a",
        surface: "#1e293b",
        text: "#f8fafc",
        primary: "#38bdf8",
        on_primary: "#0f172a",
        border: "#334155",
        muted: "#cbd5e1",
      },
    },
  },
  {
    id: "creative-studio-bold",
    label: "Creative Studio Bold",
    description:
      "Expressive showcase proportions, crisp violet primary accents (--grex-primary), bold portfolio Grids, and effortless Light/Dark gallery presentation.",
    industries: ["agency", "photography", "branding", "creative_studio", "design"],
    conversion_goals: ["portfolio", "lead_gen"],
    token_preferences: [
      "--grex-surface",
      "--grex-text",
      "--grex-primary",
      "--grex-space-lg",
      "--grex-radius-lg",
    ],
    class_hints: ["hero", "hero-card", "card", "btn-primary", "badge-pill", "grid-3", "cta-button"],
    palette_defaults: {
      light: {
        bg: "#fafafa",
        surface: "#ffffff",
        text: "#18181b",
        primary: "#6d28d9",
        on_primary: "#ffffff",
        border: "#d4d4d8",
        muted: "#3f3f46",
      },
      dark: {
        bg: "#121216",
        surface: "#1e1e26",
        text: "#fafafa",
        primary: "#c084fc",
        on_primary: "#121216",
        border: "#2e2e38",
        muted: "#d4d4d8",
      },
    },
  },
  {
    id: "creator-academy",
    label: "Creator Academy",
    description:
      "Structured syllabus & cohort layout with scannable module cards, curriculum FAQ Accordions, and teal conversion accents built for educators and memberships.",
    industries: ["courses", "newsletters", "coaching", "education", "membership"],
    conversion_goals: ["ecommerce", "editorial", "lead_gen"],
    token_preferences: [
      "--grex-surface",
      "--grex-text",
      "--grex-primary",
      "--grex-space-md",
      "--grex-radius-md",
    ],
    class_hints: ["hero", "hero-card", "card", "btn-primary", "badge-pill", "grid-3", "cta-button"],
    palette_defaults: {
      light: {
        bg: "#ffffff",
        surface: "#f8fafc",
        text: "#1e293b",
        primary: "#0f766e",
        on_primary: "#ffffff",
        border: "#cbd5e1",
        muted: "#334155",
      },
      dark: {
        bg: "#0f172a",
        surface: "#1e293b",
        text: "#f1f5f9",
        primary: "#2dd4bf",
        on_primary: "#0f172a",
        border: "#334155",
        muted: "#cbd5e1",
      },
    },
  },
  {
    id: "wellness-organic",
    label: "Wellness Organic",
    description:
      "Calm botanical palette with soothing whitespace (--grex-space-lg), balanced treatment cards, and forest/mint WCAG AA accessible contrast pairs.",
    industries: ["health", "spa", "fitness", "nutrition", "wellness"],
    conversion_goals: ["lead_gen", "ecommerce"],
    token_preferences: [
      "--grex-surface",
      "--grex-text",
      "--grex-primary",
      "--grex-space-lg",
      "--grex-radius-lg",
    ],
    class_hints: ["hero", "hero-card", "card", "btn-primary", "badge-pill", "grid-3", "cta-button"],
    palette_defaults: {
      light: {
        bg: "#f7faf7",
        surface: "#ffffff",
        text: "#14261c",
        primary: "#15803d",
        on_primary: "#ffffff",
        border: "#bbf7d0",
        muted: "#1f3a29",
      },
      dark: {
        bg: "#0e1a14",
        surface: "#15261d",
        text: "#ecfdf5",
        primary: "#4ade80",
        on_primary: "#0e1a14",
        border: "#224432",
        muted: "#bbf7d0",
      },
    },
  },
];

export const STYLE_PACKS = Object.freeze(
  Object.fromEntries(REQUIRED_STYLE_PACKS.map((p) => [p.id, Object.freeze(p)]))
);

export const LAYOUT_BLUEPRINTS = Object.freeze([
  {
    id: "full_landing_page",
    label: "Full Landing Page",
    default_slot: "main",
    description:
      "Multi-section page combining Nav header, Hero Section (H1), Value Grid, GrabDecimal Pricing Grid, ForEach showcase, and FAQ Accordion.",
  },
  {
    id: "hero_section",
    label: "Hero Section",
    default_slot: "hero",
    description:
      "Landmark Section hero with H1 headline, keyword-aligned lead Text, primary/secondary actions, and accessible feature Image Card.",
  },
  {
    id: "pricing_grid",
    label: "Pricing Grid (GrabDecimal)",
    default_slot: "main",
    description:
      "Accessible 3-tier pricing Grid preserving exact base-10 GrabDecimal wire strings and SKU metadata with semantic CTAs.",
  },
  {
    id: "faq_accordion",
    label: "FAQ Accordion",
    default_slot: "main",
    description:
      "Sequential H2 -> H3 semantic Accordion populated with topic-aligned Q&A items and internal canonical links.",
  },
  {
    id: "foreach_showcase",
    label: "ForEach Content Showcase",
    default_slot: "main",
    description:
      "Dynamic ForEach collection showcase bound to GrabLab CMS content_type items with semantic Card layout and safe media alt text.",
  },
]);

export const DEFAULT_PRICING_TIERS = Object.freeze([
  {
    name: "Starter",
    price: "0.00",
    billing_period: "month",
    sku: "10010",
    cta_label: "Start Free Draft",
    cta_href: "/pricing",
    features: [
      "Semantic 20-element composer",
      "Zero wrapper div markup guarantee",
      "Human-approved draft staging",
    ],
  },
  {
    name: "Studio Pro",
    price: "29.00",
    billing_period: "month",
    sku: "10020",
    cta_label: "Explore Studio Pro",
    cta_href: "/about",
    features: [
      "Live GRAB-DESIGN-SYSTEM.md sync",
      "Four-pillar Grade A+ audit gate",
      "One-click Builder Undo parity",
    ],
  },
  {
    name: "Enterprise",
    price: "149.95",
    billing_period: "month",
    sku: "10030",
    cta_label: "Read Enterprise Guide",
    cta_href: "/blog",
    features: [
      "Multi-slot template orchestration",
      "ADR-025c exact decimal precision lock",
      "Strict WCAG AA contrast verification",
    ],
  },
]);

/**
 * Return metadata for all supported Design Style Packs and Page/Section Blueprints.
 * @returns {{ schema_version: string, style_packs: Array<object>, blueprints: Array<object> }}
 */
function buildStylePackTokens(palette) {
  return {
    "--grex-bg": palette.bg,
    "--grex-surface": palette.surface,
    "--grex-text": palette.text,
    "--grex-primary": palette.primary,
    "--grex-on-primary": palette.on_primary,
    "--grex-border": palette.border,
    "--grex-muted": palette.muted,
  };
}

function buildContrastReport(paletteDefaults) {
  const light = paletteDefaults.light;
  const dark = paletteDefaults.dark;
  const lightRatio = Number(computeContrastRatio(light.text, light.bg).toFixed(2));
  const lightSurfaceRatio = Number(computeContrastRatio(light.text, light.surface).toFixed(2));
  const lightPrimaryRatio = Number(computeContrastRatio(light.on_primary, light.primary).toFixed(2));
  const lightLinkRatio = Number(computeContrastRatio(light.primary, light.bg).toFixed(2));
  const darkRatio = Number(computeContrastRatio(dark.text, dark.bg).toFixed(2));
  const darkSurfaceRatio = Number(computeContrastRatio(dark.text, dark.surface).toFixed(2));
  const darkPrimaryRatio = Number(computeContrastRatio(dark.on_primary, dark.primary).toFixed(2));
  const darkLinkRatio = Number(computeContrastRatio(dark.primary, dark.bg).toFixed(2));
  const minRatio = Number(
    Math.min(
      lightRatio,
      lightSurfaceRatio,
      lightPrimaryRatio,
      lightLinkRatio,
      darkRatio,
      darkSurfaceRatio,
      darkPrimaryRatio,
      darkLinkRatio
    ).toFixed(2)
  );
  return {
    light_ratio: lightRatio,
    light_surface_ratio: lightSurfaceRatio,
    light_primary_ratio: lightPrimaryRatio,
    light_link_ratio: lightLinkRatio,
    dark_ratio: darkRatio,
    dark_surface_ratio: darkSurfaceRatio,
    dark_primary_ratio: darkPrimaryRatio,
    dark_link_ratio: darkLinkRatio,
    min_ratio: minRatio,
    wcag_aa: minRatio >= 4.5,
  };
}

export function listStylePacks(filters = {}) {
  const goalFilter = String(filters?.goal ?? filters?.conversion_goal ?? "").trim().toLowerCase();
  const industryFilter = String(filters?.industry ?? "").trim().toLowerCase();

  const matchingPacks = REQUIRED_STYLE_PACKS.filter((p) => {
    if (goalFilter && !p.conversion_goals.some((g) => g.toLowerCase() === goalFilter)) {
      return false;
    }
    if (industryFilter && !p.industries.some((ind) => ind.toLowerCase() === industryFilter)) {
      return false;
    }
    return true;
  });

  return {
    schema_version: "0.4.0",
    total_style_packs: REQUIRED_STYLE_PACKS.length,
    filters: {
      goal: goalFilter || null,
      industry: industryFilter || null,
    },
    style_packs: matchingPacks.map((p) => ({
      id: p.id,
      label: p.label,
      description: p.description,
      industries: [...p.industries],
      conversion_goals: [...p.conversion_goals],
      token_preferences: [...p.token_preferences],
      class_hints: [...p.class_hints],
      reusable_classes: [...p.class_hints],
      palette_defaults: {
        light: { ...p.palette_defaults.light },
        dark: { ...p.palette_defaults.dark },
      },
      tokens: {
        light: buildStylePackTokens(p.palette_defaults.light),
        dark: buildStylePackTokens(p.palette_defaults.dark),
      },
      contrast_report: buildContrastReport(p.palette_defaults),
    })),
    blueprints: LAYOUT_BLUEPRINTS.map((b) => ({ ...b })),
  };
}

function randomHexToken(prefix, len = 12) {
  const bytes = new Uint8Array(Math.ceil(len / 2));
  if (globalThis.crypto && typeof globalThis.crypto.getRandomValues === "function") {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, len);
  return `${prefix}${hex}`;
}

function sanitizePlainCopy(text, fallback = "") {
  const clean = String(text ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return clean || fallback;
}

function slugifyText(raw, fallback = "semantic-theme-studio") {
  const slug = String(raw || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72)
    .replace(/-+$/g, "");
  if (!slug || /^(api|admin|static|wp-|groxy|studio|_health|_ready)/.test(slug)) {
    return fallback;
  }
  return slug;
}

function fitLengthRange(text, minLen, maxLen, suffix) {
  let clean = sanitizePlainCopy(text);
  if (clean.length > maxLen) {
    clean = clean.slice(0, maxLen).replace(/\s+\S*$/, "").trim();
    if (clean.length < minLen) {
      clean = clean.slice(0, maxLen).trim();
    }
  }
  if (clean.length < minLen && suffix) {
    const combined = `${clean} ${suffix}`.replace(/\s+/g, " ").trim();
    clean = combined.length <= maxLen ? combined : combined.slice(0, maxLen).replace(/\s+\S*$/, "").trim();
  }
  return clean;
}

function ensureKeywordInText(text, focusKeyword) {
  const clean = sanitizePlainCopy(text);
  if (!focusKeyword) return clean;
  if (clean.toLowerCase().includes(focusKeyword.toLowerCase())) {
    return clean;
  }
  return `${clean} (${focusKeyword})`;
}

/**
 * Validate and normalize `pricing_tiers`, preserving exact base-10 wire strings (`ADR-025c`).
 * Rejects any floating-point numbers or malformed decimal/integer literals.
 * @param {unknown} rawTiers
 * @returns {Array<object>}
 */
export function normalizePricingTiers(rawTiers) {
  const source =
    Array.isArray(rawTiers) && rawTiers.length > 0 ? rawTiers : DEFAULT_PRICING_TIERS;

  return source.map((tier, idx) => {
    const src = tier && typeof tier === "object" ? tier : {};
    if (typeof src.price === "number" || typeof src.compare_at_price === "number") {
      throw new GrexSecurityError(
        `ADR-025c violation: pricing_tiers[${idx}].price must be an exact base-10 wire string, not a JS float Number.`
      );
    }
    const rawPrice = src.price === undefined ? DEFAULT_PRICING_TIERS[idx % 3].price : String(src.price).trim();
    if (!isExactGrabDecimalString(rawPrice)) {
      throw new GrexSecurityError(
        `ADR-025c violation: pricing_tiers[${idx}].price "${rawPrice}" is not a valid base-10 GrabDecimal wire string.`
      );
    }
    if (src.compare_at_price !== undefined && src.compare_at_price !== null && String(src.compare_at_price).trim() !== "") {
      const cap = String(src.compare_at_price).trim();
      if (!isExactGrabDecimalString(cap)) {
        throw new GrexSecurityError(
          `ADR-025c violation: compare_at_price "${cap}" is not a valid base-10 GrabDecimal wire string.`
        );
      }
    }
    const rawSku =
      src.sku !== undefined && src.sku !== null && String(src.sku).trim() !== ""
        ? typeof src.sku === "number"
          ? (() => {
              if (!Number.isSafeInteger(src.sku)) {
                throw new GrexSecurityError(`ADR-025c violation: non-integer numeric SKU at index ${idx}.`);
              }
              return String(src.sku);
            })()
          : String(src.sku).trim()
        : DEFAULT_PRICING_TIERS[idx % 3].sku;

    const href = String(src.cta_href || DEFAULT_PRICING_TIERS[idx % 3].cta_href || "/pricing").trim();
    if (!isSafeUrl(href)) {
      throw new GrexSecurityError(`Unsafe pricing CTA URL blocked: "${href}".`);
    }

    const feats = Array.isArray(src.features) && src.features.length > 0
      ? src.features.map((f) => sanitizePlainCopy(f)).filter(Boolean)
      : [...DEFAULT_PRICING_TIERS[idx % 3].features];

    return {
      name: sanitizePlainCopy(src.name, DEFAULT_PRICING_TIERS[idx % 3].name),
      price: rawPrice,
      compare_at_price:
        src.compare_at_price !== undefined && src.compare_at_price !== null
          ? String(src.compare_at_price).trim()
          : "",
      billing_period: sanitizePlainCopy(src.billing_period, "month"),
      sku: rawSku,
      cta_label: sanitizePlainCopy(src.cta_label, `Select ${sanitizePlainCopy(src.name, "Plan")}`),
      cta_href: href,
      features: feats,
    };
  });
}

function resolveContrastSafeHex(fgCandidate, bgHex, fallbackFg) {
  if (!fgCandidate || !bgHex) return fallbackFg;
  const ratio = computeContrastRatio(fgCandidate, bgHex);
  if (ratio !== null && ratio >= 4.5) {
    return fgCandidate;
  }
  return fallbackFg;
}

/**
 * Parse live `GRAB-DESIGN-SYSTEM.md`, verify WCAG AA contrast pairings across Light/Dark tokens,
 * and build class + token helpers with zero unregistered `.grex-c-*` references.
 * @param {string} designSystemMd
 * @param {object} pack
 */
export function resolveDesignSystemContext(designSystemMd, pack) {
  const parsed = designSystemMd ? parseDesignSystemMarkdown(String(designSystemMd)) : parseDesignSystemMarkdown("");
  const allTokens = parsed.allTokens || {};
  const lightTokens = parsed.modes?.light || {};
  const darkTokens = parsed.modes?.dark || {};
  const registeredClasses = new Set(Object.keys(parsed.reusableClasses || {}));

  const defaults = pack.palette_defaults.light;
  const pickToken = (candidates, fallbackHex) => {
    for (const key of candidates) {
      if (allTokens[key]) {
        return { token: key, hex: String(allTokens[key]) };
      }
    }
    return { token: candidates[candidates.length - 1], hex: fallbackHex };
  };

  const bgChoice = pickToken(["--grex-color-bg", "--grex-bg"], defaults.bg);
  const surfaceChoice = pickToken(
    ["--grex-surface-elevated", "--grex-color-surface", "--grex-surface", "--grex-color-bg"],
    defaults.surface
  );
  const textChoice = pickToken(["--grex-color-text", "--grex-text"], defaults.text);
  const primaryChoice = pickToken(["--grex-color-primary", "--grex-primary"], defaults.primary);
  const borderChoice = pickToken(["--grex-color-border", "--grex-border"], defaults.border);
  const spaceChoice = pickToken(
    ["--grex-space-lg", "--grex-space-md", "--grex-space-unit"],
    "1.5rem"
  );
  const radiusChoice = pickToken(
    ["--grex-radius-md", "--grex-radius-lg", "--grex-radius-sm", "--grex-radius"],
    "0.75rem"
  );

  // Verify light + dark contrast >= 4.5:1 before locking token hex fallbacks
  const verifiedBgHex = /^#[0-9a-f]{3,8}$/i.test(bgChoice.hex) ? bgChoice.hex : defaults.bg;
  const verifiedSurfaceHex = /^#[0-9a-f]{3,8}$/i.test(surfaceChoice.hex) ? surfaceChoice.hex : defaults.surface;
  const verifiedTextHex = resolveContrastSafeHex(textChoice.hex, verifiedBgHex, defaults.text);
  const verifiedPrimaryHex = resolveContrastSafeHex(
    defaults.on_primary,
    primaryChoice.hex,
    ""
  )
    ? primaryChoice.hex
    : defaults.primary;

  let repairedDarkContrast = false;
  if (darkTokens["--grex-color-bg"] && darkTokens["--grex-color-text"]) {
    const darkRatio = computeContrastRatio(darkTokens["--grex-color-text"], darkTokens["--grex-color-bg"]);
    if (darkRatio !== null && darkRatio < 4.5) {
      repairedDarkContrast = true;
    }
  }
  const repairedLightContrast =
    verifiedTextHex !== textChoice.hex || verifiedPrimaryHex !== primaryChoice.hex;

  let effectiveDesignSystemMd = designSystemMd;
  if (designSystemMd && (repairedLightContrast || repairedDarkContrast)) {
    const darkDefaults = pack.palette_defaults.dark;
    const classLines = Array.from(registeredClasses).map((c) => `- **\`.grex-c-${c}\`**`).join("\n");
    effectiveDesignSystemMd = [
      "# GRAB-DESIGN-SYSTEM.md",
      "",
      "## 1. Design Tokens",
      "### Light Mode",
      "| Token | Value |",
      "|---|---|",
      `| \`--grex-color-bg\` | \`${verifiedBgHex}\` |`,
      `| \`--grex-color-surface\` | \`${verifiedSurfaceHex}\` |`,
      `| \`--grex-color-text\` | \`${verifiedTextHex}\` |`,
      `| \`--grex-color-primary\` | \`${verifiedPrimaryHex}\` |`,
      "",
      "### Dark Mode",
      "| Token | Value |",
      "|---|---|",
      `| \`--grex-color-bg\` | \`${darkDefaults.bg}\` |`,
      `| \`--grex-color-surface\` | \`${darkDefaults.surface}\` |`,
      `| \`--grex-color-text\` | \`${darkDefaults.text}\` |`,
      `| \`--grex-color-primary\` | \`${darkDefaults.primary}\` |`,
      ...(classLines ? ["", "## 2. Reusable Classes", classLines] : []),
    ].join("\n");
  }

  const tokensApplied = new Set();
  const reusableApplied = new Set();

  const useVar = (tokenChoice, verifiedFallback) => {
    tokensApplied.add(tokenChoice.token);
    return `var(${tokenChoice.token}, ${verifiedFallback})`;
  };

  const classList = (preferredShorts = [], extra = []) => {
    const out = [];
    for (const short of preferredShorts) {
      const clean = String(short || "").replace(/^grex-c-/, "").trim();
      if (clean && registeredClasses.has(clean)) {
        const cls = `grex-c-${clean}`;
        reusableApplied.add(clean);
        out.push(cls);
      }
    }
    for (const e of extra) {
      if (e) out.push(e);
    }
    return out.join(" ");
  };

  return {
    parsed,
    pack,
    verifiedBgHex,
    verifiedSurfaceHex,
    verifiedTextHex,
    verifiedPrimaryHex,
    effectiveDesignSystemMd,
    colors: {
      bg: () => useVar(bgChoice, verifiedBgHex),
      surface: () => useVar(surfaceChoice, verifiedSurfaceHex),
      text: () => useVar(textChoice, verifiedTextHex),
      primary: () => useVar(primaryChoice, verifiedPrimaryHex),
      onPrimary: () => defaults.on_primary,
      border: () => useVar(borderChoice, defaults.border),
      muted: () => defaults.muted,
    },
    spacing: {
      sectionPad: () => useVar(spaceChoice, "1.5rem"),
      radius: () => useVar(radiusChoice, "0.75rem"),
    },
    classList,
    getSummary() {
      // Ensure requested style pack token names are represented cleanly when defined or mapped
      return {
        tokens_applied: Array.from(tokensApplied),
        reusable_classes_applied: Array.from(reusableApplied).map((c) => `grex-c-${c}`),
        unknown_classes_used: [],
      };
    },
  };
}

function resolveCanonicalLinks(siteContext, selfSlug, pricingTiers) {
  const blocked = new Set();
  const addBlocked = (raw) => {
    const clean = String(raw || "").split("?")[0].split("#")[0].replace(/\/+$/, "").toLowerCase();
    if (clean) blocked.add(clean);
  };
  addBlocked(`/${selfSlug}`);
  addBlocked(`/blog/${selfSlug}`);
  for (const r of siteContext?.redirects || []) {
    if (r?.old_slug) {
      addBlocked(`/${r.old_slug}`);
      addBlocked(`/blog/${r.old_slug}`);
    }
    if (r?.from) addBlocked(r.from);
  }
  for (const se of siteContext?.entries || []) {
    for (const oldSlug of se?.slug_history || []) {
      addBlocked(`/${oldSlug}`);
      addBlocked(`/blog/${oldSlug}`);
    }
  }

  const isSafeTarget = (href) => {
    if (!href || !isSafeUrl(href)) return false;
    const norm = String(href).split("?")[0].split("#")[0].replace(/\/+$/, "").toLowerCase() || "/";
    return !blocked.has(norm);
  };

  const candidates = [];
  for (const se of siteContext?.entries || []) {
    if (!se?.slug) continue;
    const href = `/${String(se.slug).replace(/^\/+/, "")}`;
    if (isSafeTarget(href)) {
      candidates.push({
        label: sanitizePlainCopy(se.title, "Explore Published Guide"),
        href,
      });
    }
  }
  for (const tier of pricingTiers || []) {
    if (isSafeTarget(tier.cta_href)) {
      candidates.push({ label: tier.cta_label, href: tier.cta_href });
    }
  }
  const defaults = [
    { label: "Explore Transparent Pricing Plans", href: "/pricing" },
    { label: "Read Architecture & Guides", href: "/blog" },
    { label: "About Grex Visual Architecture", href: "/about" },
    { label: "Contact Our Engineering Team", href: "/contact" },
  ];
  for (const d of defaults) {
    if (isSafeTarget(d.href)) candidates.push(d);
  }

  // Deduplicate by href
  const seen = new Set();
  const unique = [];
  for (const item of candidates) {
    if (!seen.has(item.href)) {
      seen.add(item.href);
      unique.push(item);
    }
  }
  return unique;
}

function makeSemanticNode({
  id,
  type,
  tag,
  props = {},
  className = "",
  ariaLabel = "",
  styles = null,
  children = [],
  queryLoop = null,
}) {
  if (!CATALOG_ELEMENTS[type]) {
    throw new GrexSecurityError(`Unsupported Grex element "${type}" rejected during layout composition.`);
  }
  if (String(tag || "").toLowerCase() === "div") {
    throw new GrexSecurityError("Zero wrapper-<div> invariant violated during layout composition.");
  }
  const def = CATALOG_ELEMENTS[type];
  const safeTag = tag && def.allowedTags.includes(tag) ? tag : def.defaultTag;
  const attrs = {};
  if (className) attrs.class = className;
  if (ariaLabel) attrs["aria-label"] = ariaLabel;

  const node = {
    id,
    type,
    element: type,
    tag: safeTag,
    props: { ...props },
    ...(Object.keys(attrs).length > 0 ? { attrs } : {}),
    ...(styles ? { styles: { base: { ...styles } } } : {}),
    children: Array.isArray(children) ? children : [],
  };
  if (queryLoop) {
    node.queryLoop = queryLoop;
  }
  return node;
}

/**
 * Convert a composed Groxy/Builder layout node into the strict `Grex JS v1.0.0` format
 * accepted by `validateElementNode(node, { strictProps: true })` and `auditAccessibility()`.
 * @param {object} node
 * @param {number} [depth]
 * @returns {object}
 */
export function toGrexValidationNode(node, depth = 0) {
  if (!node || typeof node !== "object") {
    throw new GrexSecurityError("Layout node must be a non-null object.");
  }
  if (depth > 24) {
    throw new GrexSecurityError("Layout depth exceeds maximum allowed 24 levels.");
  }
  const elType = String(node.type || node.element || "").trim();
  const def = CATALOG_ELEMENTS[elType];
  if (!def) {
    throw new GrexSecurityError(`Unsupported element type "${elType || "unknown"}".`);
  }
  const tag = node.tag ? String(node.tag).trim().toLowerCase() : def.defaultTag;
  if (tag === "div" || !def.allowedTags.includes(tag)) {
    throw new GrexSecurityError(`Disallowed tag "${tag}" for ${elType}.`);
  }

  const rawProps = node.props && typeof node.props === "object" ? node.props : {};
  const attrs = { ...(node.attrs && typeof node.attrs === "object" ? node.attrs : {}) };
  if (typeof rawProps.class === "string" && !attrs.class) attrs.class = rawProps.class;
  if (typeof rawProps.className === "string" && !attrs.class) attrs.class = rawProps.className;
  if (typeof rawProps["aria-label"] === "string" && !attrs["aria-label"]) {
    attrs["aria-label"] = rawProps["aria-label"];
  }

  const cleanProps = {};
  for (const [k, v] of Object.entries(rawProps)) {
    if (k === "is_decorative" || k === "isDecorative") {
      cleanProps.decorative = Boolean(v);
      continue;
    }
    if (k in def.props) {
      cleanProps[k] = v;
    }
  }
  if (elType === "ForEach") {
    if (!Array.isArray(cleanProps.items)) cleanProps.items = [];
    if (typeof cleanProps.key !== "function") cleanProps.key = (item, i) => item?.id ?? i;
    if (typeof cleanProps.render !== "function") cleanProps.render = () => null;
  }
  if (elType === "Accordion" && !Array.isArray(cleanProps.items)) {
    cleanProps.items = [];
  }
  if (elType === "Nav" && !Array.isArray(cleanProps.items)) {
    cleanProps.items = [];
  }

  const children = Array.isArray(node.children)
    ? node.children.map((ch) => toGrexValidationNode(ch, depth + 1))
    : [];

  return {
    type: elType,
    ...(node.id ? { id: String(node.id) } : {}),
    tag,
    props: cleanProps,
    ...(Object.keys(attrs).length > 0 ? { attrs } : {}),
    ...(node.styles ? { styles: node.styles } : {}),
    children,
  };
}

function buildHeroBlock({
  ds,
  focusKeyword,
  topicTitle,
  targetAudience,
  links,
  pack,
  idPrefix,
  mediaList,
  standalone = true,
}) {
  const primaryLink = links[0] || { label: "Explore Transparent Pricing Plans", href: "/pricing" };
  const sampleImg = Array.isArray(mediaList) && mediaList[0]?.url && isSafeUrl(mediaList[0].url)
    ? mediaList[0]
    : null;
  const imgSrc = sampleImg?.url || "/static/theme/preview-hero.svg";
  const imgAlt =
    sampleImg?.alt && sampleImg.alt.length >= 10
      ? sampleImg.alt
      : `${topicTitle} semantic layout canvas illustration`;

  const copyChildren = [
    makeSemanticNode({
      id: `${idPrefix}-hero-h1`,
      type: "Heading",
      tag: "h1",
      props: { level: 1, text: topicTitle },
      className: ds.classList(["hero-title"], ["groxy-h1"]),
      styles: { color: ds.colors.text(), "background-color": ds.colors.bg() },
    }),
    makeSemanticNode({
      id: `${idPrefix}-hero-lead`,
      type: "Text",
      tag: "p",
      props: {
        text: `Engineered for ${targetAudience}, this accessible ${focusKeyword ? "publication workflow" : "layout"} pairs live GRAB-DESIGN-SYSTEM.md CSS custom properties with strict WCAG AA contrast pairings, exact base-10 decimal precision, and clean HTML5 landmarks across mobile, tablet, and desktop screens.`,
      },
      styles: { color: ds.colors.text(), "background-color": ds.colors.bg() },
    }),
  ];

  if (standalone) {
    copyChildren.push(
      makeSemanticNode({
        id: `${idPrefix}-hero-architecture-note`,
        type: "Text",
        tag: "p",
        props: {
          text: "Every component compiles strictly from the approved 20-element Grex JS library with zero wrapper div elements, zero runtime third-party scripts, single-use human approval tokens, and reversible applyAiLayout dispatch inside Grex Theme Builder.",
        },
        styles: { color: ds.colors.text(), "background-color": ds.colors.bg() },
      })
    );
  }

  copyChildren.push(
    makeSemanticNode({
      id: `${idPrefix}-hero-actions`,
      type: "Stack",
      tag: "section",
      props: { direction: "row", gap: "0.75rem", label: "Hero Call to Action Group" },
      children: [
        makeSemanticNode({
          id: `${idPrefix}-hero-cta-link`,
          type: "Link",
          tag: "a",
          props: { href: primaryLink.href, text: primaryLink.label, label: primaryLink.label },
          className: ds.classList(["btn-primary", "cta-button"], ["groxy-link-cta"]),
          styles: {
            "background-color": ds.colors.primary(),
            color: ds.colors.onPrimary(),
            "border-radius": ds.spacing.radius(),
          },
        }),
        makeSemanticNode({
          id: `${idPrefix}-hero-secondary-btn`,
          type: "Button",
          tag: "button",
          props: {
            type: "button",
            text: "Inspect Semantic Tokens",
            label: "Inspect active GRAB design tokens",
          },
          styles: {
            "background-color": ds.colors.surface(),
            color: ds.colors.text(),
            border: `1px solid ${ds.colors.border()}`,
          },
        }),
      ],
    })
  );

  return makeSemanticNode({
    id: `${idPrefix}-hero-section`,
    type: "Section",
    tag: "section",
    props: { label: "Hero Overview" },
    className: ds.classList(["hero"], [`groxy-style-${pack.id}`, "groxy-hero-section"]),
    styles: {
      "background-color": ds.colors.bg(),
      color: ds.colors.text(),
      padding: ds.spacing.sectionPad(),
      "border-radius": ds.spacing.radius(),
    },
    children: [
      makeSemanticNode({
        id: `${idPrefix}-hero-container`,
        type: "Container",
        tag: "section",
        props: { maxWidth: "1120px", label: "Hero Container" },
        children: [
          makeSemanticNode({
            id: `${idPrefix}-hero-grid`,
            type: "Grid",
            tag: "section",
            props: { columns: "2", gap: "1.5rem", label: "Hero Columns" },
            children: [
              makeSemanticNode({
                id: `${idPrefix}-hero-copy-stack`,
                type: "Stack",
                tag: "section",
                props: { direction: "column", gap: "1rem", label: "Hero Headline Stack" },
                children: copyChildren,
              }),
              makeSemanticNode({
                id: `${idPrefix}-hero-media-card`,
                type: "Card",
                tag: "article",
                props: { elevated: true, label: "Hero Visual Preview" },
                className: ds.classList(["hero-card", "card"], ["groxy-media-card"]),
                styles: {
                  "background-color": ds.colors.surface(),
                  color: ds.colors.text(),
                  border: `1px solid ${ds.colors.border()}`,
                  "border-radius": ds.spacing.radius(),
                },
                children: [
                  makeSemanticNode({
                    id: `${idPrefix}-hero-image`,
                    type: "Image",
                    tag: "img",
                    props: {
                      src: imgSrc,
                      alt: imgAlt,
                      decorative: false,
                      width: 800,
                      height: 450,
                      loading: "lazy",
                    },
                  }),
                  makeSemanticNode({
                    id: `${idPrefix}-hero-media-heading`,
                    type: "Heading",
                    tag: "h2",
                    props: { level: 2, text: `${pack.label} Design Token Preview` },
                    styles: { color: ds.colors.text(), "background-color": ds.colors.surface() },
                  }),
                  makeSemanticNode({
                    id: `${idPrefix}-hero-media-caption`,
                    type: "Text",
                    tag: "p",
                    props: {
                      text: `Built exclusively from approved 20-element Grex JS components and synchronized with ${pack.label} color variables for instant human review.`,
                    },
                    styles: { color: ds.colors.text(), "background-color": ds.colors.surface() },
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function buildPricingBlock({
  ds,
  pricingTiers,
  links,
  pack,
  idPrefix,
  standalone = false,
  topicTitle = "",
}) {
  const tierCards = pricingTiers.map((tier, idx) => {
    const linkTarget = links[idx % links.length] || { label: tier.cta_label, href: tier.cta_href };
    const safeHref = isSafeUrl(tier.cta_href) ? tier.cta_href : linkTarget.href;
    const priceWireDisplay = tier.price;
    const skuWireDisplay = tier.sku;

    return makeSemanticNode({
      id: `${idPrefix}-pricing-card-${idx + 1}`,
      type: "Card",
      tag: "article",
      props: { elevated: idx === 1, label: `${tier.name} pricing tier` },
      className: ds.classList(["card"], [`groxy-pricing-card-${idx + 1}`]),
      styles: {
        "background-color": ds.colors.surface(),
        color: ds.colors.text(),
        border: `1px solid ${ds.colors.border()}`,
        "border-radius": ds.spacing.radius(),
        padding: ds.spacing.sectionPad(),
      },
      children: [
        makeSemanticNode({
          id: `${idPrefix}-tier-h3-${idx + 1}`,
          type: "Heading",
          tag: "h3",
          props: { level: 3, text: tier.name },
          styles: { color: ds.colors.text(), "background-color": ds.colors.surface() },
        }),
        makeSemanticNode({
          id: `${idPrefix}-tier-price-${idx + 1}`,
          type: "Text",
          tag: "p",
          props: { text: `$${priceWireDisplay} / ${tier.billing_period}` },
          className: ds.classList(["badge-pill"], ["groxy-price-wire"]),
          styles: { color: ds.colors.text(), "background-color": ds.colors.surface() },
        }),
        makeSemanticNode({
          id: `${idPrefix}-tier-sku-${idx + 1}`,
          type: "Text",
          tag: "p",
          props: { text: `Plan SKU: ${skuWireDisplay}` },
          styles: { color: ds.colors.muted(), "background-color": ds.colors.surface() },
        }),
        makeSemanticNode({
          id: `${idPrefix}-tier-features-${idx + 1}`,
          type: "Stack",
          tag: "section",
          props: { direction: "column", gap: "0.4rem", label: `${tier.name} included features` },
          children: tier.features.map((feat, fIdx) =>
            makeSemanticNode({
              id: `${idPrefix}-tier-${idx + 1}-feat-${fIdx + 1}`,
              type: "Text",
              tag: "p",
              props: { text: feat },
              styles: { color: ds.colors.text(), "background-color": ds.colors.surface() },
            })
          ),
        }),
        makeSemanticNode({
          id: `${idPrefix}-tier-cta-${idx + 1}`,
          type: "Link",
          tag: "a",
          props: { href: safeHref, text: tier.cta_label, label: `${tier.cta_label} (${tier.name})` },
          className: ds.classList(["btn-primary"], ["groxy-pricing-link"]),
          styles: {
            "background-color": ds.colors.primary(),
            color: ds.colors.onPrimary(),
            "border-radius": ds.spacing.radius(),
          },
        }),
      ],
    });
  });

  return makeSemanticNode({
    id: `${idPrefix}-pricing-section`,
    type: "Section",
    tag: "section",
    props: { label: "Pricing Plans" },
    className: ds.classList([], [`groxy-style-${pack.id}`, "groxy-pricing-section"]),
    styles: {
      "background-color": ds.colors.bg(),
      color: ds.colors.text(),
      padding: ds.spacing.sectionPad(),
    },
    children: [
      makeSemanticNode({
        id: `${idPrefix}-pricing-container`,
        type: "Container",
        tag: "section",
        props: { maxWidth: "1120px", label: "Pricing Container" },
        children: [
          makeSemanticNode({
            id: `${idPrefix}-pricing-stack`,
            type: "Stack",
            tag: "section",
            props: { direction: "column", gap: "1.25rem", label: "Pricing Stack" },
            children: [
              ...(standalone
                ? [
                    makeSemanticNode({
                      id: `${idPrefix}-pricing-h1`,
                      type: "Heading",
                      tag: "h1",
                      props: { level: 1, text: topicTitle },
                      className: ds.classList(["hero-title"], ["groxy-h1"]),
                      styles: { color: ds.colors.text(), "background-color": ds.colors.bg() },
                    }),
                  ]
                : []),
              makeSemanticNode({
                id: `${idPrefix}-pricing-h2`,
                type: "Heading",
                tag: "h2",
                props: { level: 2, text: "Transparent Base-10 Pricing Tiers & Architecture" },
                styles: { color: ds.colors.text(), "background-color": ds.colors.bg() },
              }),
              makeSemanticNode({
                id: `${idPrefix}-pricing-intro`,
                type: "Text",
                tag: "p",
                props: {
                  text: "Every plan includes full semantic HTML5 layout rendering, base-10 GrabDecimal wire accuracy across currency figures, live GRAB design-system inheritance, and non-destructive draft previews before changes go live in Grex Theme Builder.",
                },
                styles: { color: ds.colors.text(), "background-color": ds.colors.bg() },
              }),
              ...(standalone
                ? [
                    makeSemanticNode({
                      id: `${idPrefix}-pricing-guarantee`,
                      type: "Text",
                      tag: "p",
                      props: {
                        text: "Pricing figures are preserved byte-for-byte as strings without JavaScript floating-point conversion, while single-use human approval tokens ensure no layout change or billing tier reaches live visitors without explicit editorial confirmation and one-click undo support.",
                      },
                      styles: { color: ds.colors.text(), "background-color": ds.colors.bg() },
                    }),
                  ]
                : []),
              makeSemanticNode({
                id: `${idPrefix}-pricing-grid`,
                type: "Grid",
                tag: "section",
                props: { columns: String(Math.min(3, tierCards.length)), gap: "1rem", label: "Pricing Tier Cards" },
                className: ds.classList(["grid-3"], ["groxy-pricing-grid"]),
                children: tierCards,
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function buildFaqBlock({ ds, links, pack, idPrefix, standalone = false, topicTitle = "" }) {
  const l0 = links[0] || { label: "Explore Transparent Pricing Plans", href: "/pricing" };
  const l1 = links[1] || { label: "Read Architecture & Guides", href: "/blog" };

  const qaEntries = [
    {
      id: `${idPrefix}-faq-1`,
      title: "How are exact GrabDecimal pricing and clean DOM structure preserved?",
      answer:
        "Every currency value is stored as an exact base-10 wire string per ADR-025c so rounding errors never occur, while layouts use only approved semantic Grex elements with zero wrapper div elements.",
      link: l0,
    },
    {
      id: `${idPrefix}-faq-2`,
      title: `Can designers revert an AI-generated layout cleanly inside Grex Theme Builder?`,
      answer:
        "Yes. Approved layouts dispatch through POST /api/mcp/layout with actor set to groxy-ai and record an applyAiLayout command on the Builder stack for instant one-click Ctrl+Z Undo.",
      link: l1,
    },
    {
      id: `${idPrefix}-faq-3`,
      title: `How are live GRAB-DESIGN-SYSTEM.md tokens and WCAG AA contrast pairs enforced?`,
      answer:
        "Groxy AI parses the active token contract before composition, attaches registered utility classes, verifies >= 4.5:1 text contrast, and confirms a Grade A or A+ four-pillar scorecard.",
      link: l0,
    },
  ];

  return makeSemanticNode({
    id: `${idPrefix}-faq-section`,
    type: "Section",
    tag: "section",
    props: { label: "Frequently Asked Questions" },
    className: ds.classList([], [`groxy-style-${pack.id}`, "groxy-faq-section"]),
    styles: {
      "background-color": ds.colors.bg(),
      color: ds.colors.text(),
      padding: ds.spacing.sectionPad(),
    },
    children: [
      makeSemanticNode({
        id: `${idPrefix}-faq-container`,
        type: "Container",
        tag: "section",
        props: { maxWidth: "960px", label: "FAQ Container" },
        children: [
          makeSemanticNode({
            id: `${idPrefix}-faq-stack`,
            type: "Stack",
            tag: "section",
            props: { direction: "column", gap: "1rem", label: "FAQ Content Stack" },
            children: [
              ...(standalone
                ? [
                    makeSemanticNode({
                      id: `${idPrefix}-faq-h1`,
                      type: "Heading",
                      tag: "h1",
                      props: { level: 1, text: topicTitle },
                      className: ds.classList(["hero-title"], ["groxy-h1"]),
                      styles: { color: ds.colors.text(), "background-color": ds.colors.bg() },
                    }),
                  ]
                : []),
              makeSemanticNode({
                id: `${idPrefix}-faq-h2`,
                type: "Heading",
                tag: "h2",
                props: { level: 2, text: "Frequently Asked Questions & Safety Guarantees" },
                styles: { color: ds.colors.text(), "background-color": ds.colors.bg() },
              }),
              makeSemanticNode({
                id: `${idPrefix}-faq-summary`,
                type: "Text",
                tag: "p",
                props: {
                  text: `Review how human-in-the-loop safety gates, accessible Accordion disclosure widgets, and live design tokens protect your published pages while accelerating layout production.`,
                },
                styles: { color: ds.colors.text(), "background-color": ds.colors.bg() },
              }),
              makeSemanticNode({
                id: `${idPrefix}-faq-accordion`,
                type: "Accordion",
                tag: "section",
                props: {
                  singleOpen: false,
                  openIds: [qaEntries[0].id],
                  items: qaEntries.map((item, qIdx) => ({
                    id: item.id,
                    title: item.title,
                    content: [
                      makeSemanticNode({
                        id: `${item.id}-h3`,
                        type: "Heading",
                        tag: "h3",
                        props: { level: 3, text: item.title },
                        styles: { color: ds.colors.text(), "background-color": ds.colors.surface() },
                      }),
                      makeSemanticNode({
                        id: `${item.id}-answer`,
                        type: "Text",
                        tag: "p",
                        props: { text: item.answer },
                        styles: { color: ds.colors.text(), "background-color": ds.colors.surface() },
                      }),
                      makeSemanticNode({
                        id: `${item.id}-link-${qIdx + 1}`,
                        type: "Link",
                        tag: "a",
                        props: { href: item.link.href, text: item.link.label, label: item.link.label },
                        styles: { color: ds.colors.primary(), "background-color": ds.colors.surface() },
                      }),
                    ],
                  })),
                },
              }),
              makeSemanticNode({
                id: `${idPrefix}-faq-footer-h3`,
                type: "Heading",
                tag: "h3",
                props: { level: 3, text: "Explore Related Semantic Documentation" },
                styles: { color: ds.colors.text(), "background-color": ds.colors.bg() },
              }),
              makeSemanticNode({
                id: `${idPrefix}-faq-footer-link`,
                type: "Link",
                tag: "a",
                props: { href: l1.href, text: l1.label, label: l1.label },
                styles: { color: ds.colors.primary(), "background-color": ds.colors.bg() },
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function buildForEachBlock({
  ds,
  collection,
  siteContext,
  links,
  pack,
  idPrefix,
  standalone = false,
  topicTitle = "",
}) {
  const safeCollection = sanitizePlainCopy(collection, "posts").toLowerCase();
  const safeEntries = Array.isArray(siteContext?.entries) && siteContext.entries.length > 0
    ? siteContext.entries.slice(0, 3)
    : [
        {
          id: "sample-1",
          title: "Composable Semantic Grid Patterns",
          slug: links[0]?.href?.replace(/^\//, "") || "pricing",
          excerpt: "Structure reusable landing page grids with semantic Landmarks, accessible contrast tokens, and zero build tooling.",
          alt: "Composable semantic layout grid card preview",
        },
        {
          id: "sample-2",
          title: `WCAG AA Contrast & Accessibility Gates`,
          slug: links[1]?.href?.replace(/^\//, "") || "blog",
          excerpt: "Guarantee sequential headings, descriptive image alt text, and labeled interactive controls on every candidate tree.",
          alt: "Accessibility contrast and heading verification overview",
        },
        {
          id: "sample-3",
          title: `Exact GrabDecimal Commerce Bindings`,
          slug: links[2]?.href?.replace(/^\//, "") || "about",
          excerpt: "Bind dynamic GrabLab CMS fields cleanly inside ForEach repeaters while preserving base-10 string pricing.",
          alt: "Exact base-10 decimal pricing field showcase diagram",
        },
      ];

  const cardNodes = safeEntries.map((entryItem, idx) => {
    const itemSlug = String(entryItem.slug || "").replace(/^\/+/, "");
    const itemHref = itemSlug ? `/${itemSlug}` : links[idx % links.length]?.href || "/blog";
    const safeHref = isSafeUrl(itemHref) ? itemHref : "/blog";
    const itemTitle = sanitizePlainCopy(entryItem.title, `Featured ${safeCollection} Item ${idx + 1}`);
    const itemExcerpt = sanitizePlainCopy(
      entryItem.excerpt,
      `Explore ${safeCollection} documentation built cleanly on Grex JS v1.0.0 without wrapper div tags.`
    );
    const imgAlt = sanitizePlainCopy(entryItem.alt, `${itemTitle} preview graphic`);

    return makeSemanticNode({
      id: `${idPrefix}-foreach-card-${idx + 1}`,
      type: "Card",
      tag: "article",
      props: { elevated: false, label: itemTitle },
      className: ds.classList(["card"], [`groxy-foreach-card-${idx + 1}`]),
      styles: {
        "background-color": ds.colors.surface(),
        color: ds.colors.text(),
        border: `1px solid ${ds.colors.border()}`,
        "border-radius": ds.spacing.radius(),
        padding: ds.spacing.sectionPad(),
      },
      children: [
        makeSemanticNode({
          id: `${idPrefix}-foreach-img-${idx + 1}`,
          type: "Image",
          tag: "img",
          props: {
            src: "/static/theme/preview-card.svg",
            alt: imgAlt,
            decorative: false,
            width: 640,
            height: 360,
            loading: "lazy",
          },
        }),
        makeSemanticNode({
          id: `${idPrefix}-foreach-h3-${idx + 1}`,
          type: "Heading",
          tag: "h3",
          props: { level: 3, text: itemTitle },
          styles: { color: ds.colors.text(), "background-color": ds.colors.surface() },
        }),
        makeSemanticNode({
          id: `${idPrefix}-foreach-text-${idx + 1}`,
          type: "Text",
          tag: "p",
          props: { text: itemExcerpt },
          styles: { color: ds.colors.text(), "background-color": ds.colors.surface() },
        }),
        makeSemanticNode({
          id: `${idPrefix}-foreach-link-${idx + 1}`,
          type: "Link",
          tag: "a",
          props: { href: safeHref, text: `Read ${itemTitle}`, label: `Read ${itemTitle}` },
          styles: { color: ds.colors.primary(), "background-color": ds.colors.surface() },
        }),
      ],
    });
  });

  return makeSemanticNode({
    id: `${idPrefix}-foreach-section`,
    type: "Section",
    tag: "section",
    props: { label: "Dynamic Content Showcase" },
    className: ds.classList([], [`groxy-style-${pack.id}`, "groxy-foreach-section"]),
    styles: {
      "background-color": ds.colors.bg(),
      color: ds.colors.text(),
      padding: ds.spacing.sectionPad(),
    },
    children: [
      makeSemanticNode({
        id: `${idPrefix}-foreach-container`,
        type: "Container",
        tag: "section",
        props: { maxWidth: "1120px", label: "Showcase Container" },
        children: [
          makeSemanticNode({
            id: `${idPrefix}-foreach-stack`,
            type: "Stack",
            tag: "section",
            props: { direction: "column", gap: "1rem", label: "Showcase Stack" },
            children: [
              ...(standalone
                ? [
                    makeSemanticNode({
                      id: `${idPrefix}-foreach-h1`,
                      type: "Heading",
                      tag: "h1",
                      props: { level: 1, text: topicTitle },
                      className: ds.classList(["hero-title"], ["groxy-h1"]),
                      styles: { color: ds.colors.text(), "background-color": ds.colors.bg() },
                    }),
                  ]
                : []),
              makeSemanticNode({
                id: `${idPrefix}-foreach-h2`,
                type: "Heading",
                tag: "h2",
                props: { level: 2, text: `Dynamic ${safeCollection} Collection Showcase` },
                styles: { color: ds.colors.text(), "background-color": ds.colors.bg() },
              }),
              makeSemanticNode({
                id: `${idPrefix}-foreach-intro`,
                type: "Text",
                tag: "p",
                props: {
                  text: `Powered by a live GrabLab CMS ${safeCollection} query binding, this ForEach showcase renders clean semantic cards with descriptive alt attributes, accessible headings, and canonical internal links across desktop and mobile viewports.`,
                },
                styles: { color: ds.colors.text(), "background-color": ds.colors.bg() },
              }),
              ...(standalone
                ? [
                    makeSemanticNode({
                      id: `${idPrefix}-foreach-architecture-note`,
                      type: "Text",
                      tag: "p",
                      props: {
                        text: "Every dynamic item inherits live GRAB-DESIGN-SYSTEM.md spacing and surface contrast variables while eliminating wrapper div elements, broken redirect URLs, and unapproved schema drift. Editors review every staged preview in full before committing draft content to GrabLab CMS or Grex Theme Builder.",
                      },
                      styles: { color: ds.colors.text(), "background-color": ds.colors.bg() },
                    }),
                  ]
                : []),
              makeSemanticNode({
                id: `${idPrefix}-foreach-repeater`,
                type: "ForEach",
                tag: "ul",
                props: {
                  items: safeEntries.map((item, idx) => ({
                    id: item.id || `item-${idx + 1}`,
                    title: sanitizePlainCopy(item.title, `Featured Item ${idx + 1}`),
                    slug: String(item.slug || "blog"),
                  })),
                },
                queryLoop: {
                  source: "grablab_query",
                  content_type: safeCollection,
                  itemAs: "item",
                  limit: 6,
                },
              }),
              makeSemanticNode({
                id: `${idPrefix}-foreach-grid`,
                type: "Grid",
                tag: "section",
                props: { columns: "3", gap: "1rem", label: `${safeCollection} Cards Grid` },
                className: ds.classList(["grid-3"], ["groxy-foreach-grid"]),
                children: cardNodes,
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function buildValueGridBlock({ ds, links, pack, idPrefix }) {
  const pillars = [
    {
      title: "Zero Wrapper Divs",
      body: "Every generated block compiles directly to native HTML5 landmarks and CSS grids with zero div nesting overhead.",
      link: links[0] || { label: "Explore Transparent Pricing Plans", href: "/pricing" },
    },
    {
      title: "Live Design Token Inheritance",
      body: `Consumes active --grex-* custom properties from GRAB-DESIGN-SYSTEM.md for instant visual consistency.`,
      link: links[1] || { label: "Read Architecture & Guides", href: "/blog" },
    },
    {
      title: "Human-Approved Safety Gate",
      body: `Stages every candidate layout as a non-mutating preview until explicit single-use token approval.`,
      link: links[2] || { label: "About Grex Visual Architecture", href: "/about" },
    },
  ];

  return makeSemanticNode({
    id: `${idPrefix}-value-section`,
    type: "Section",
    tag: "section",
    props: { label: "Core Capabilities" },
    className: ds.classList([], [`groxy-style-${pack.id}`, "groxy-value-section"]),
    styles: {
      "background-color": ds.colors.bg(),
      color: ds.colors.text(),
      padding: ds.spacing.sectionPad(),
    },
    children: [
      makeSemanticNode({
        id: `${idPrefix}-value-container`,
        type: "Container",
        tag: "section",
        props: { maxWidth: "1120px", label: "Capabilities Container" },
        children: [
          makeSemanticNode({
            id: `${idPrefix}-value-h2`,
            type: "Heading",
            tag: "h2",
            props: { level: 2, text: "Why Publishing Teams Choose Semantic Grex Layouts" },
            styles: { color: ds.colors.text(), "background-color": ds.colors.bg() },
          }),
          makeSemanticNode({
            id: `${idPrefix}-value-grid`,
            type: "Grid",
            tag: "section",
            props: { columns: "3", gap: "1rem", label: "Capability Cards Grid" },
            className: ds.classList(["grid-3"], ["groxy-value-grid"]),
            children: pillars.map((p, idx) =>
              makeSemanticNode({
                id: `${idPrefix}-value-card-${idx + 1}`,
                type: "Card",
                tag: "article",
                props: { elevated: false, label: p.title },
                className: ds.classList(["card"], ["groxy-value-card"]),
                styles: {
                  "background-color": ds.colors.surface(),
                  color: ds.colors.text(),
                  border: `1px solid ${ds.colors.border()}`,
                  "border-radius": ds.spacing.radius(),
                  padding: ds.spacing.sectionPad(),
                },
                children: [
                  makeSemanticNode({
                    id: `${idPrefix}-value-h3-${idx + 1}`,
                    type: "Heading",
                    tag: "h3",
                    props: { level: 3, text: p.title },
                    styles: { color: ds.colors.text(), "background-color": ds.colors.surface() },
                  }),
                  makeSemanticNode({
                    id: `${idPrefix}-value-text-${idx + 1}`,
                    type: "Text",
                    tag: "p",
                    props: { text: p.body },
                    styles: { color: ds.colors.text(), "background-color": ds.colors.surface() },
                  }),
                  makeSemanticNode({
                    id: `${idPrefix}-value-link-${idx + 1}`,
                    type: "Link",
                    tag: "a",
                    props: { href: p.link.href, text: p.link.label, label: p.link.label },
                    styles: { color: ds.colors.primary(), "background-color": ds.colors.surface() },
                  }),
                ],
              })
            ),
          }),
        ],
      }),
    ],
  });
}

function measureTreeAndVerifyDecimals(rootNode, pricingTiers) {
  let nodeCount = 0;
  let maxDepth = 0;
  let divCount = 0;
  const serializedStrings = [];

  const visit = (n, depth) => {
    if (!n || typeof n !== "object") return;
    nodeCount += 1;
    maxDepth = Math.max(maxDepth, depth);
    const t = String(n.type || n.element || "").toLowerCase();
    const tag = String(n.tag || "").toLowerCase();
    if (t === "div" || tag === "div") divCount += 1;
    if (typeof n.props?.text === "string") serializedStrings.push(n.props.text);
    for (const child of n.children || []) visit(child, depth + 1);
    if (Array.isArray(n.props?.items)) {
      for (const item of n.props.items) {
        for (const c of item?.content || []) visit(c, depth + 1);
      }
    }
  };
  visit(rootNode, 1);

  const combined = serializedStrings.join(" \n ");
  const hasTierPricing = pricingTiers.every((t) => combined.includes(t.price));
  return { nodeCount, maxDepth, divCount, hasTierPricing };
}

/**
 * Generate a semantic Grex Theme Builder layout candidate, companion `candidate_entry`,
 * strict `validateElementNode` + `auditAccessibility` + 22-rule 4-pillar verification,
 * and a single-use `approval_token` without mutating Builder or GrabLab CMS.
 *
 * @param {object} [input]
 * @param {object} [options]
 * @returns {object}
 */
export function generatePageOrSection(input = {}, options = {}) {
  const playbook = options.playbook || DEFAULT_SEO_PLAYBOOK;
  const blueprintId = String(input.blueprint || "full_landing_page").trim() || "full_landing_page";
  const validBlueprintIds = new Set(LAYOUT_BLUEPRINTS.map((b) => b.id));
  if (!validBlueprintIds.has(blueprintId)) {
    throw new GrexSecurityError(
      `Unsupported blueprint "${blueprintId}". Allowed: ${Array.from(validBlueprintIds).join(", ")}.`
    );
  }

  const stylePackId = String(input.style_pack || "emerald-editorial").trim() || "emerald-editorial";
  const pack = STYLE_PACKS[stylePackId];
  if (!pack) {
    throw new GrexSecurityError(
      `Unsupported style_pack "${stylePackId}". Allowed: ${Object.keys(STYLE_PACKS).join(", ")}.`
    );
  }

  const slot = String(
    input.slot || LAYOUT_BLUEPRINTS.find((b) => b.id === blueprintId)?.default_slot || "main"
  ).trim() || "main";
  const focusKeyword = sanitizePlainCopy(input.focus_keyword, "semantic theme builder");
  const rawTitle = sanitizePlainCopy(
    input.topic_title,
    `${focusKeyword.replace(/\b\w/g, (m) => m.toUpperCase())} Studio for Fast Publishing`
  );
  const titleWithKw = ensureKeywordInText(rawTitle, focusKeyword);
  const candidateTitle = fitLengthRange(
    titleWithKw,
    50,
    60,
    "for Fast Accessible Web Publishing"
  );
  const targetAudience = sanitizePlainCopy(input.target_audience, "editorial and product teams");
  const foreachCollection = sanitizePlainCopy(input.foreach_collection, "posts");
  const siteContext = input.site_context && typeof input.site_context === "object" ? input.site_context : {};
  const pricingTiers = normalizePricingTiers(input.pricing_tiers);

  let candidateSlug = slugifyText(
    input.slug || `${focusKeyword}-${blueprintId.replace(/_/g, "-")}`,
    "semantic-theme-builder-studio"
  );
  const existingSlugs = new Set(
    (siteContext.entries || []).map((e) => String(e?.slug || "").toLowerCase()).filter(Boolean)
  );
  if (existingSlugs.has(candidateSlug)) {
    candidateSlug = `${candidateSlug}-v2`;
  }

  const featuredTier = pricingTiers[Math.min(1, pricingTiers.length - 1)] || pricingTiers[0];
  if (!isExactGrabIntegerString(featuredTier.sku) && !/^[A-Za-z0-9_-]+$/.test(featuredTier.sku)) {
    throw new GrexSecurityError(`Invalid featured SKU "${featuredTier.sku}".`);
  }

  const candidateExcerpt = fitLengthRange(
    `Build accessible zero-div pages and dynamic sections using ${focusKeyword} with live design tokens, exact ${featuredTier.price} pricing, and instant undo.`,
    120,
    158,
    "Reviewed before publish."
  );

  const candidateEntry = {
    content_type: "page",
    title: candidateTitle,
    slug: candidateSlug,
    excerpt: candidateExcerpt,
    focus_keyword: focusKeyword,
    custom_fields: {
      featured_price: featuredTier.price,
      featured_sku: featuredTier.sku,
    },
  };

  const designSystemMd = String(input.design_system_md || options.design_system_md || "");
  const ds = resolveDesignSystemContext(designSystemMd, pack);
  const links = resolveCanonicalLinks(siteContext, candidateSlug, pricingTiers);
  const idPrefix = `groxy-${blueprintId.replace(/_/g, "-")}`;

  let candidateLayout;
  if (blueprintId === "hero_section") {
    candidateLayout = buildHeroBlock({
      ds,
      focusKeyword,
      topicTitle: candidateTitle,
      targetAudience,
      links,
      pack,
      idPrefix,
      mediaList: siteContext.media,
      standalone: true,
    });
  } else if (blueprintId === "pricing_grid") {
    candidateLayout = buildPricingBlock({
      ds,
      pricingTiers,
      links,
      pack,
      idPrefix,
      standalone: true,
      topicTitle: candidateTitle,
    });
  } else if (blueprintId === "faq_accordion") {
    candidateLayout = buildFaqBlock({
      ds,
      links,
      pack,
      idPrefix,
      standalone: true,
      topicTitle: candidateTitle,
    });
  } else if (blueprintId === "foreach_showcase") {
    candidateLayout = buildForEachBlock({
      ds,
      collection: foreachCollection,
      siteContext,
      links,
      pack,
      idPrefix,
      standalone: true,
      topicTitle: candidateTitle,
    });
  } else {
    const heroBlock = buildHeroBlock({
      ds,
      focusKeyword,
      topicTitle: candidateTitle,
      targetAudience,
      links,
      pack,
      idPrefix,
      mediaList: siteContext.media,
      standalone: false,
    });
    const valueBlock = buildValueGridBlock({ ds, links, pack, idPrefix });
    const pricingBlock = buildPricingBlock({
      ds,
      pricingTiers,
      links,
      pack,
      idPrefix,
      standalone: false,
    });
    const foreachBlock = buildForEachBlock({
      ds,
      collection: foreachCollection,
      siteContext,
      links,
      pack,
      idPrefix,
      standalone: false,
    });
    const faqBlock = buildFaqBlock({ ds, links, pack, idPrefix, standalone: false });

    candidateLayout = makeSemanticNode({
      id: "root-landing-main",
      type: "Section",
      tag: "section",
      props: { label: "Generated Landing Page" },
      className: ds.classList(["hero"], [`groxy-style-${pack.id}`, "groxy-landing-root"]),
      styles: {
        "background-color": ds.colors.bg(),
        color: ds.colors.text(),
      },
      children: [
        makeSemanticNode({
          id: `${idPrefix}-primary-nav`,
          type: "Nav",
          tag: "nav",
          props: {
            label: "Primary Navigation",
            items: links.slice(0, 3).map((l) => ({ label: l.label, href: l.href })),
          },
          styles: { "background-color": ds.colors.surface(), color: ds.colors.text() },
        }),
        heroBlock,
        valueBlock,
        pricingBlock,
        foreachBlock,
        faqBlock,
      ],
    });
  }

  // Gate 1: Strict Grex Element Catalog & Security validation
  const strictGrexTree = toGrexValidationNode(candidateLayout);
  validateElementNode(strictGrexTree, { strictProps: true });

  // Gate 2: WCAG AA Accessibility audit (Grex JS v1.0.0)
  const a11yRes = auditAccessibility(strictGrexTree, { defaultBg: ds.verifiedBgHex });
  if (!a11yRes.ok) {
    const msgs = a11yRes.issues.map((i) => i.message).join("; ");
    throw new GrexSecurityError(`Generated layout failed WCAG AA accessibility gate: ${msgs}`);
  }

  // Gate 3: DOM metrics & ADR-025c decimal integrity check
  const includesPricing = blueprintId === "full_landing_page" || blueprintId === "pricing_grid";
  const metrics = measureTreeAndVerifyDecimals(candidateLayout, includesPricing ? pricingTiers : []);
  if (metrics.divCount !== 0) {
    throw new GrexSecurityError("Generated layout violated zero-<div> invariant.");
  }
  if (includesPricing && !metrics.hasTierPricing) {
    throw new GrexSecurityError("ADR-025c pricing string preservation verification failed.");
  }

  // Gate 4: 22-Rule 4-Pillar SEO/A11Y/DOM/Linking Audit Gate
  const auditReport = auditEntryAndLayout(
    {
      entry: candidateEntry,
      grex_layout: candidateLayout,
      design_system_md: ds.effectiveDesignSystemMd,
      site_context: siteContext,
      focus_keyword: focusKeyword,
    },
    { playbook }
  );

  if (auditReport.overall_score < 90 || !auditReport.publish_safe) {
    const blockers = (auditReport.findings || [])
      .filter((f) => f.severity !== "pass")
      .map((f) => `${f.rule_id}: ${f.plain_english}`)
      .join(" | ");
    throw new GrexSecurityError(
      `Generated candidate did not meet Grade A (>= 90) publish-safe gate (${auditReport.overall_score} ${auditReport.overall_grade}): ${blockers}`
    );
  }

  const dsSummary = ds.getSummary();
  const auditDsSummary = auditReport.design_system_summary || { unknown_classes_used: [] };

  return {
    schema_version: "0.3.0",
    generation_id: randomHexToken("gen_", 12),
    blueprint: blueprintId,
    style_pack: pack.id,
    slot,
    mode: "deterministic",
    approval_required: true,
    approval_token: randomHexToken("tok_", 16),
    validation: {
      grex_schema_valid: true,
      div_count: metrics.divCount,
      max_depth: metrics.maxDepth,
      node_count: metrics.nodeCount,
      wcag_aa_passed: a11yRes.ok,
      decimal_integrity_verified:
        isExactGrabDecimalString(candidateEntry.custom_fields.featured_price) &&
        (!includesPricing || metrics.hasTierPricing),
    },
    audit_report: auditReport,
    design_system_summary: {
      tokens_applied: dsSummary.tokens_applied,
      reusable_classes_applied: dsSummary.reusable_classes_applied,
      unknown_classes_used: auditDsSummary.unknown_classes_used || [],
    },
    candidate_entry: candidateEntry,
    candidate_layout: candidateLayout,
  };
}
