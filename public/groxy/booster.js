/**
 * Groxy AI v1.1.0 — Pre-Publish Grade Review Gate & "Let Groxy Boost This"
 * Deterministic Remediation + Side-by-Side Diff Engine.
 *
 * Zero external dependencies, zero wrapper <div>s, exact ADR-025c numeric preservation,
 * and strict GROXY-SAFE-001 human-in-the-loop approval enforcement.
 */

export const GROXY_VERSION = "1.6.0";

import {
  auditEntryAndLayout,
  isExactGrabDecimalString,
  isExactGrabIntegerString,
} from "./auditor.js";
import { computeContrastRatio } from "./grex.js";
import {
  DEFAULT_SEO_PLAYBOOK,
  parseDesignSystemMarkdown,
} from "./playbook.js";

const RESERVED_SLUGS = new Set(DEFAULT_SEO_PLAYBOOK.reserved_slug_prefixes);
const STOP_WORDS = new Set(DEFAULT_SEO_PLAYBOOK.stop_words);
const VAGUE_ANCHORS = new Set(DEFAULT_SEO_PLAYBOOK.vague_anchors);
const ALLOWED_GREX_SET = new Set([
  "Fragment",
  "TemplatePart",
  ...DEFAULT_SEO_PLAYBOOK.allowed_grex_elements,
]);
const NUMERIC_WIRE_KEYS = new Set([
  "price",
  "sale_price",
  "compare_at_price",
  "weight",
  "rating",
  "sku",
  "inventory",
  "inventory_count",
  "stock",
  "reading_minutes",
]);

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function makeOpaqueId(prefix, seedStr = "") {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return `${prefix}_${globalThis.crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
  }
  let h = 2166136261;
  const s = `${prefix}:${seedStr}:${Date.now()}`;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `${prefix}_${(h >>> 0).toString(16).padStart(8, "0")}`;
}

function titleCase(str) {
  return String(str || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function tokenizeWords(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function normalizePath(rawUrl) {
  const s = String(rawUrl || "").trim();
  if (!s) return "";
  const base = s.split("?")[0].split("#")[0].toLowerCase();
  return base.length > 1 && base.endsWith("/") ? base.slice(0, -1) : base;
}

function isUnsafeUrl(raw) {
  if (typeof raw !== "string") return false;
  const norm = raw.replace(/[\u0000-\u0020]+/g, "").toLowerCase();
  if (!norm) return false;
  return (
    norm.startsWith("javascript:") ||
    norm.startsWith("vbscript:") ||
    norm.startsWith("file:") ||
    norm.startsWith("data:")
  );
}

function isInternalHref(href) {
  const s = String(href || "").trim();
  if (!s || s.startsWith("#") || isUnsafeUrl(s)) return false;
  if (s.startsWith("/")) return true;
  if (/^(https?:|mailto:|tel:)/i.test(s)) return false;
  return true;
}

function stripHtml(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function trimToWindow(text, minLen, maxLen, suffixPhrase) {
  let s = String(text || "").replace(/\s+/g, " ").trim();
  if (s.length < minLen && suffixPhrase) {
    const glue = s ? (s.endsWith(".") || s.endsWith(":") ? " " : " — ") : "";
    s = `${s}${glue}${suffixPhrase}`.replace(/\s+/g, " ").trim();
  }
  if (s.length > maxLen) {
    const slice = s.slice(0, maxLen);
    const lastSpace = slice.lastIndexOf(" ");
    s = (lastSpace >= minLen ? slice.slice(0, lastSpace) : slice).replace(/[,\s:;-]+$/, "").trim();
  }
  return s;
}

function deriveFocusKeyword(entry, explicitKeyword) {
  const kw = String(explicitKeyword || entry?.focus_keyword || "").trim();
  if (kw) return kw;
  const words = tokenizeWords(entry?.title || "").filter(
    (w) => w.length >= 3 && !STOP_WORDS.has(w)
  );
  if (words.length >= 2) return `${words[0]} ${words[1]}`;
  if (words.length === 1) return words[0];
  return "semantic web publishing";
}

function buildBoostedTitle(rawTitle, focusKeyword, contentType, existingEntries = [], entryId = "") {
  const orig = String(rawTitle || "").replace(/\s+/g, " ").trim();
  const kwTitle = titleCase(focusKeyword);
  const kwWords = tokenizeWords(focusKeyword);
  const hasAllKw = kwWords.length > 0 && kwWords.every((w) => orig.toLowerCase().includes(w));

  let candidate = orig;
  if (!candidate || candidate.length < 15 || /^(draft|post|page|untitled|short)/i.test(candidate)) {
    const noun = contentType === "product" ? "Edition & Pricing Overview" : "Complete Guide & Best Practices";
    candidate = `${kwTitle}: ${noun}`;
  } else if (!hasAllKw && kwTitle) {
    candidate = `${kwTitle} — ${candidate}`;
  }

  const pads = [
    "Fast Semantic Architecture Guide",
    "Best Practices & Clean Design Guide",
    "Complete Optimization Overview",
  ];
  let idx = 0;
  while (candidate.length < 50 && idx < pads.length) {
    candidate = trimToWindow(candidate, 50, 60, pads[idx]);
    idx += 1;
  }
  if (candidate.length > 60) {
    candidate = trimToWindow(candidate, 50, 60, "");
  }

  // Ensure uniqueness against site_context.entries (GROXY-SEO-007)
  const usedTitles = new Set(
    (existingEntries || [])
      .filter((e) => e && (!entryId || String(e.id) !== String(entryId)))
      .map((e) => String(e.title || "").trim().toLowerCase())
      .filter(Boolean)
  );
  if (usedTitles.has(candidate.toLowerCase())) {
    const tag = " (Updated Edition)";
    const base = trimToWindow(candidate, 30, 60 - tag.length, "");
    candidate = `${base}${tag}`;
  }

  return candidate;
}

function buildBoostedExcerpt(rawExcerpt, boostedTitle, focusKeyword, plainCopy) {
  let candidate = String(rawExcerpt || "").replace(/\s+/g, " ").trim();
  const kwLower = String(focusKeyword || "").toLowerCase();
  const copySnippet = stripHtml(plainCopy)
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .find((s) => s.length >= 25);

  if (!candidate || candidate.length < 120) {
    const parts = [];
    if (candidate && candidate.length >= 20) {
      parts.push(candidate.replace(/[.!?]+$/, ""));
    } else {
      parts.push(
        `Explore ${boostedTitle} with practical ${focusKeyword || "semantic"} guidelines`
      );
    }
    if (copySnippet && !parts[0].toLowerCase().includes(copySnippet.slice(0, 20).toLowerCase())) {
      parts.push(copySnippet);
    }
    if (!parts.join(" ").toLowerCase().includes(kwLower) && focusKeyword) {
      parts.push(`Focused on ${focusKeyword} clarity, WCAG AA accessibility, and clean semantic markup`);
    }
    parts.push("Built for fast search visibility, zero wrapper divs, and reliable publishing.");
    candidate = parts.join(". ").replace(/\.\s*\./g, ".").replace(/\s+/g, " ").trim();
  }

  if (candidate.length > 158) {
    candidate = trimToWindow(candidate, 120, 157, "");
    if (!/[.!?]$/.test(candidate)) {
      candidate = `${candidate}.`;
    }
  }
  while (candidate.length < 120) {
    const extra = " Ready for accessible, fast publishing.";
    if (candidate.length + extra.length <= 158) {
      candidate = `${candidate.replace(/[.!?]*$/, "")}.${extra}`;
    } else {
      break;
    }
  }
  return candidate;
}

function buildBoostedSlug(rawSlug, boostedTitle, existingEntries = [], redirects = [], entryId = "") {
  const cleanTokens = (str) =>
    String(str || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .split("-")
      .filter(Boolean);

  let segs = cleanTokens(rawSlug);
  while (segs.length > 0 && RESERVED_SLUGS.has(segs[0])) {
    segs.shift();
  }
  // Drop generic placeholder tokens if slug was e.g. "admin-bad_slug"
  if (segs.length === 0 || segs.join("-") === "bad-slug" || segs.length === 1 && segs[0] === "short") {
    segs = cleanTokens(boostedTitle).filter((w) => !STOP_WORDS.has(w));
  }
  if (segs.length === 0) {
    segs = ["semantic-guide"];
  }
  let slug = segs.join("-").slice(0, 75).replace(/-+$/, "");
  if (RESERVED_SLUGS.has(slug.split("-")[0])) {
    slug = `guide-${slug}`.slice(0, 75).replace(/-+$/, "");
  }

  const taken = new Set();
  for (const se of existingEntries || []) {
    if (!se) continue;
    if (entryId && String(se.id) === String(entryId)) continue;
    if (se.slug) taken.add(String(se.slug).toLowerCase());
    if (Array.isArray(se.slug_history)) {
      for (const oldS of se.slug_history) {
        taken.add(String(oldS).toLowerCase());
      }
    }
  }
  for (const rd of redirects || []) {
    if (rd?.old_slug) taken.add(String(rd.old_slug).toLowerCase());
  }

  if (taken.has(slug)) {
    let n = 2;
    while (taken.has(`${slug}-${n}`) && n < 50) {
      n += 1;
    }
    slug = `${slug}-${n}`.slice(0, 75).replace(/-+$/, "");
  }
  return slug;
}

function buildRedirectResolutionMaps(siteContext, selfSlug, entryId) {
  const redirectMap = new Map();
  const knownTargets = [];

  for (const rd of siteContext?.redirects || []) {
    if (rd?.old_slug && rd?.new_slug) {
      redirectMap.set(normalizePath(`/${rd.old_slug}`), `/${String(rd.new_slug).replace(/^\/+/, "")}`);
    }
    if (rd?.from && rd?.to) {
      redirectMap.set(normalizePath(rd.from), rd.to);
    }
  }

  for (const se of siteContext?.entries || []) {
    if (!se) continue;
    const canonicalSlug = String(se.slug || "").replace(/^\/+/, "");
    const canonicalPath = canonicalSlug ? `/${canonicalSlug}` : se.url || "";
    if (Array.isArray(se.slug_history) && canonicalPath) {
      for (const oldSlug of se.slug_history) {
        redirectMap.set(normalizePath(`/${oldSlug}`), canonicalPath);
        redirectMap.set(normalizePath(`/blog/${oldSlug}`), `/blog/${canonicalSlug}`);
      }
    }
    const isSelf =
      (entryId && String(se.id) === String(entryId)) ||
      (selfSlug && canonicalSlug.toLowerCase() === selfSlug.toLowerCase());
    if (!isSelf && canonicalPath && !RESERVED_SLUGS.has(canonicalSlug.split("-")[0])) {
      knownTargets.push({
        href: canonicalPath,
        title: String(se.title || canonicalSlug).trim(),
      });
    }
  }

  const menuLists = Array.isArray(siteContext?.menus)
    ? [siteContext.menus]
    : siteContext?.menus && typeof siteContext.menus === "object"
      ? Object.values(siteContext.menus)
      : [];
  for (const list of menuLists) {
    if (!Array.isArray(list)) continue;
    for (const item of list) {
      if (item?.href && isInternalHref(item.href)) {
        const norm = normalizePath(item.href);
        if (!redirectMap.has(norm) && norm !== normalizePath(`/${selfSlug}`)) {
          knownTargets.push({
            href: item.href,
            title: String(item.label || item.title || "Site Section").trim(),
          });
        }
      }
    }
  }

  const resolveCanonical = (rawHref) => {
    let cur = String(rawHref || "").trim();
    const seen = new Set();
    let hops = 0;
    while (cur && hops < 10) {
      const norm = normalizePath(cur);
      if (seen.has(norm)) {
        // Loop detected; break to safe fallback
        return "";
      }
      seen.add(norm);
      if (redirectMap.has(norm)) {
        cur = redirectMap.get(norm);
        hops += 1;
      } else {
        return cur;
      }
    }
    return cur;
  };

  return { redirectMap, knownTargets, resolveCanonical };
}

function humanizeImageAlt(imgProps, boostedTitle, focusKeyword, mediaList = []) {
  const src = String(imgProps?.src || "").trim();
  const matchedMedia = (mediaList || []).find(
    (m) => m && (m.url === src || m.path === src || (src && m.filename && src.endsWith(m.filename)))
  );
  if (matchedMedia && typeof matchedMedia.alt === "string" && matchedMedia.alt.trim().length >= 3) {
    return matchedMedia.alt.trim().slice(0, 125);
  }
  const baseName = src
    .split("/")
    .pop()
    ?.split("?")[0]
    ?.replace(/\.[a-z0-9]+$/i, "")
    ?.replace(/[-_]+/g, " ")
    ?.trim();
  if (baseName && baseName.length >= 4 && !/^(img|image|photo|pic|dsc)\s*\d*$/i.test(baseName)) {
    return `${titleCase(baseName)} illustration for ${boostedTitle}`.slice(0, 125);
  }
  return `Editorial illustration for ${boostedTitle} (${focusKeyword})`.slice(0, 125);
}

function sanitizeHtmlFragment(rawHtml) {
  let html = String(rawHtml || "");
  html = html.replace(/<script[\s\S]*?<\/script>/gi, "");
  html = html.replace(/<iframe[\s\S]*?<\/iframe>/gi, "");
  html = html.replace(/<object[\s\S]*?<\/object>/gi, "");
  html = html.replace(/<style[\s\S]*?<\/style>/gi, "");
  html = html.replace(/<\s*div(\b[^>]*)>/gi, "<section$1>");
  html = html.replace(/<\s*\/\s*div\s*>/gi, "</section>");
  html = html.replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  html = html.replace(/(href|src)\s*=\s*(["'])\s*(?:javascript|vbscript|file|data):[^"']*\2/gi, '$1="#"');
  return html.trim();
}

function cleanNodeStyles(rawStyles, designSystem) {
  if (!rawStyles || typeof rawStyles !== "object") return rawStyles;
  const fgToken =
    designSystem?.modes?.light?.["--grex-color-text"] ||
    designSystem?.tokens?.["--grex-color-text"] ||
    "#0f172a";
  const bgToken =
    designSystem?.modes?.light?.["--grex-color-bg"] ||
    designSystem?.tokens?.["--grex-color-bg"] ||
    "#ffffff";

  const cleanMap = (sm) => {
    if (!sm || typeof sm !== "object") return sm;
    const out = {};
    for (const [k, v] of Object.entries(sm)) {
      const sv = String(v ?? "");
      const svLower = sv.toLowerCase();
      if (svLower.includes("javascript:") || svLower.includes("expression(") || svLower.includes("<script")) {
        continue;
      }
      if (k.toLowerCase() === "outline" && (svLower.trim() === "none" || svLower.trim() === "0")) {
        continue;
      }
      out[k] = v;
    }
    const bgVal = String(out["background-color"] || out.backgroundColor || bgToken);
    const fgVal = String(out.color || "");
    if (fgVal) {
      const ratio = computeContrastRatio(fgVal, bgVal);
      if (ratio !== null && ratio < 4.5) {
        out.color = fgToken;
        if (!out["background-color"] && !out.backgroundColor) {
          out["background-color"] = bgToken;
        }
      }
    }
    return out;
  };

  if ("base" in rawStyles || "tablet" in rawStyles || "mobile" in rawStyles) {
    const res = {};
    for (const bp of ["base", "tablet", "mobile"]) {
      if (rawStyles[bp]) res[bp] = cleanMap(rawStyles[bp]);
    }
    return res;
  }
  return cleanMap(rawStyles);
}

function sanitizeGrexTree(node, ctx, depth = 1) {
  if (!node || typeof node !== "object") return null;
  const rawType = String(node.element || node.type || "").trim();
  const rawTag = typeof node.tag === "string" ? node.tag.trim().toLowerCase() : "";

  if (["script", "iframe", "object", "embed", "style"].includes(rawTag)) {
    ctx.fixedRules.add("GROXY-DOM-003");
    return null;
  }

  let nextType = rawType;
  let nextTag = rawTag;
  if (rawType.toLowerCase() === "div" || rawTag === "div" || !ALLOWED_GREX_SET.has(rawType)) {
    nextType = depth === 1 ? "Section" : "Stack";
    nextTag = depth === 1 ? "main" : "section";
    if (rawType.toLowerCase() === "div" || rawTag === "div") {
      ctx.fixedRules.add("GROXY-DOM-001");
    } else {
      ctx.fixedRules.add("GROXY-DOM-002");
    }
  }

  const nextProps = {};
  if (node.props && typeof node.props === "object") {
    for (const [k, v] of Object.entries(node.props)) {
      const kl = k.toLowerCase();
      if (
        kl.startsWith("on") ||
        kl === "innerhtml" ||
        kl === "outerhtml" ||
        kl === "dangerouslysetinnerhtml" ||
        kl === "srcdoc"
      ) {
        ctx.fixedRules.add("GROXY-DOM-003");
        continue;
      }
      if (["href", "src", "action", "formaction"].includes(kl) && typeof v === "string" && isUnsafeUrl(v)) {
        ctx.fixedRules.add("GROXY-DOM-003");
        nextProps[k] = kl === "src" ? "/static/theme/preview-hero.svg" : "/blog";
        continue;
      }
      nextProps[k] = v;
    }
  }

  const nextAttrs = {};
  if (node.attrs && typeof node.attrs === "object") {
    for (const [k, v] of Object.entries(node.attrs)) {
      const kl = k.toLowerCase();
      if (
        kl.startsWith("on") ||
        kl === "innerhtml" ||
        kl === "outerhtml" ||
        kl === "dangerouslysetinnerhtml" ||
        kl === "srcdoc"
      ) {
        ctx.fixedRules.add("GROXY-DOM-003");
        continue;
      }
      if (["href", "src", "action", "formaction"].includes(kl) && typeof v === "string" && isUnsafeUrl(v)) {
        ctx.fixedRules.add("GROXY-DOM-003");
        nextAttrs[k] = "/blog";
        continue;
      }
      nextAttrs[k] = v;
    }
  }

  if (typeof nextProps.html === "string" && nextProps.html.trim()) {
    const sanitized = sanitizeHtmlFragment(nextProps.html);
    if (sanitized !== nextProps.html) {
      ctx.fixedRules.add("GROXY-DOM-001");
      ctx.fixedRules.add("GROXY-DOM-003");
    }
    nextProps.html = sanitized;
  }

  // Filter unregistered .grex-c-* classes if designSystem specifies classes
  const registeredClasses = new Set(Object.keys(ctx.designSystem?.reusableClasses || {}));
  for (const bag of [nextProps, nextAttrs]) {
    for (const ck of ["class", "className"]) {
      if (typeof bag[ck] === "string" && bag[ck].trim()) {
        const cleaned = bag[ck]
          .split(/\s+/)
          .filter(Boolean)
          .filter((cls) => {
            if (cls.startsWith("grex-c-") && registeredClasses.size > 0) {
              const shortName = cls.slice("grex-c-".length);
              if (!registeredClasses.has(shortName)) {
                ctx.fixedRules.add("GROXY-DOM-005");
                return false;
              }
            }
            return true;
          })
          .join(" ");
        bag[ck] = cleaned;
      }
    }
  }

  const nextStyles = cleanNodeStyles(node.styles, ctx.designSystem);
  if (JSON.stringify(nextStyles) !== JSON.stringify(node.styles)) {
    ctx.fixedRules.add("GROXY-A11Y-001");
  }

  // Element-specific accessibility & SEO fixes
  if (nextType === "Heading") {
    let lvl = Number(nextProps.level || (nextTag.startsWith("h") ? nextTag.slice(1) : 2)) || 2;
    if (lvl === 1) {
      if (ctx.h1Seen) {
        lvl = 2;
        ctx.fixedRules.add("GROXY-SEO-005");
        ctx.fixedRules.add("GROXY-A11Y-004");
      } else {
        ctx.h1Seen = true;
        const hText = String(nextProps.text || "").trim();
        const kwWords = tokenizeWords(ctx.focusKeyword);
        const hasKw = kwWords.length > 0 && kwWords.every((w) => hText.toLowerCase().includes(w));
        if (!hasKw || hText.length < 15) {
          nextProps.text = ctx.boostedTitle;
          ctx.fixedRules.add("GROXY-SEO-002");
        }
      }
    } else if (ctx.lastHeadingLevel > 0 && lvl > ctx.lastHeadingLevel + 1) {
      lvl = ctx.lastHeadingLevel + 1;
      ctx.fixedRules.add("GROXY-A11Y-004");
    } else if (ctx.lastHeadingLevel === 0 && lvl > 2) {
      lvl = 2;
      ctx.fixedRules.add("GROXY-A11Y-004");
    }
    nextProps.level = lvl;
    if (nextTag && /^h[1-6]$/.test(nextTag)) {
      nextTag = `h${lvl}`;
    }
    ctx.lastHeadingLevel = lvl;
    if (lvl === 2 || lvl === 3) ctx.subHeadingCount += 1;
  } else if (nextType === "Image") {
    const isDeco =
      nextProps.decorative === true ||
      nextProps.isDecorative === true ||
      nextProps.is_decorative === true;
    const alt = String(nextProps.alt || "").trim();
    const badAlt =
      !isDeco &&
      (!alt ||
        alt.length < 3 ||
        alt.length > 125 ||
        /\.(jpe?g|png|gif|webp|svg)$/i.test(alt) ||
        /^(image|photo|picture|img|screenshot)$/i.test(alt));
    if (badAlt) {
      nextProps.alt = humanizeImageAlt(nextProps, ctx.boostedTitle, ctx.focusKeyword, ctx.mediaList);
      ctx.fixedRules.add("GROXY-A11Y-002");
    }
  } else if (nextType === "Input" || nextType === "Select") {
    const itype = String(nextProps.type || "").toLowerCase();
    if (itype !== "hidden") {
      const hasLbl = Boolean(
        String(nextProps.label || nextProps["aria-label"] || nextAttrs["aria-label"] || "").trim()
      );
      if (!hasLbl) {
        nextProps.label = String(nextProps.placeholder || nextProps.name || "Form Field").trim();
        ctx.fixedRules.add("GROXY-A11Y-003");
      }
    }
  } else if (nextType === "Link" || nextType === "Button") {
    const rawText = String(
      nextProps.text || nextProps.label || nextProps["aria-label"] || nextAttrs["aria-label"] || ""
    ).trim();
    if (!rawText) {
      nextProps.text = nextType === "Link" ? `Explore ${ctx.focusKeyword}` : "Continue";
      ctx.fixedRules.add("GROXY-A11Y-005");
    }
    if (nextType === "Link") {
      const href = String(nextProps.href || "").trim();
      const normHref = normalizePath(href);
      const isSelf = normHref && ctx.selfPaths.has(normHref);
      const isRedirect = normHref && ctx.redirectMap.has(normHref);
      const isUnknown =
        isInternalHref(href) &&
        ctx.knownEntryPaths &&
        !normHref.startsWith("/static/") &&
        !normHref.startsWith("/category/") &&
        !ctx.knownEntryPaths.has(normHref);

      let resolvedHref = href;
      let matchedTarget = null;
      if (isRedirect) {
        resolvedHref = ctx.resolveCanonical(href) || "";
        ctx.fixedRules.add("GROXY-LINK-002");
      }
      if (isSelf || isUnknown || !resolvedHref || isUnsafeUrl(resolvedHref)) {
        matchedTarget = ctx.knownTargets[0] || { href: "/blog", title: `${titleCase(ctx.focusKeyword)} Guides` };
        resolvedHref = matchedTarget.href;
        ctx.fixedRules.add("GROXY-LINK-002");
      }
      nextProps.href = resolvedHref;

      const anchorLower = String(nextProps.text || "").trim().toLowerCase();
      if (!anchorLower || anchorLower.length < 4 || VAGUE_ANCHORS.has(anchorLower)) {
        const destTitle =
          matchedTarget?.title ||
          ctx.knownTargets.find((t) => normalizePath(t.href) === normalizePath(resolvedHref))?.title ||
          `${titleCase(ctx.focusKeyword)} Architecture Guide`;
        nextProps.text = `Explore ${destTitle}`.slice(0, 80);
        ctx.fixedRules.add("GROXY-LINK-001");
      }
      ctx.internalLinkCount += isInternalHref(nextProps.href) ? 1 : 0;
    }
  }

  const children = Array.isArray(node.children)
    ? node.children.map((ch) => sanitizeGrexTree(ch, ctx, depth + 1)).filter(Boolean)
    : [];

  const out = {
    ...(node.id ? { id: node.id } : {}),
    element: nextType,
    ...(nextTag ? { tag: nextTag } : {}),
    props: nextProps,
    ...(Object.keys(nextAttrs).length > 0 ? { attrs: nextAttrs } : {}),
    ...(nextStyles ? { styles: nextStyles } : {}),
    children,
  };
  return out;
}

function collectPlainWordsFromTree(node, out = []) {
  if (!node || typeof node !== "object") return out;
  const p = node.props || {};
  if (typeof p.text === "string" && p.text.trim()) out.push(p.text.trim());
  if (typeof p.html === "string" && p.html.trim()) out.push(stripHtml(p.html));
  for (const ch of node.children || []) {
    collectPlainWordsFromTree(ch, out);
  }
  return out;
}

function defaultRootLayout(boostedTitle) {
  return {
    element: "Section",
    tag: "main",
    props: { id: "groxy-main" },
    styles: {
      base: {
        color: "var(--grex-color-text, #0f172a)",
        "background-color": "var(--grex-color-bg, #ffffff)",
      },
    },
    children: [
      {
        element: "Heading",
        props: { id: "groxy-h1", level: 1, text: boostedTitle },
      },
    ],
  };
}

function buildDepthParagraph(focusKeyword, boostedTitle, targetWords) {
  const kw = focusKeyword || "semantic publishing";
  const sentences = [
    `${boostedTitle} establishes a clear, accessible structure for modern web teams using ${kw}.`,
    `Each section pairs semantic HTML5 landmarks with verified design tokens from GRAB-DESIGN-SYSTEM.md so pages remain fast and easy to maintain.`,
    `Consistent heading hierarchy from H1 through H3 helps visitors scan key concepts while enabling search crawlers to understand topic depth accurately.`,
    `Descriptive image alt attributes, high-contrast typography, and meaningful internal links improve usability for keyboard and screen-reader users alike.`,
    `Structured metadata and exact base-10 numeric precision keep product prices, specifications, and editorial summaries consistent across every view.`,
  ];
  const out = [];
  let words = 0;
  let i = 0;
  while (words < targetWords && i < 24) {
    const s = sentences[i % sentences.length];
    out.push(s);
    words += tokenizeWords(s).length;
    i += 1;
  }
  return out.join(" ");
}

/**
 * Evaluate the Pre-Publish SEO & Performance Grade Review Gate (`POST /api/groxy/prepublish-review`).
 * Respects opt-in `groxy_assist_enabled`.
 *
 * @param {object} input
 * @param {object} [options]
 * @returns {object}
 */
export function buildPrePublishReview(input = {}, options = {}) {
  const enabled = input.groxy_assist_enabled !== false;
  const reviewId = makeOpaqueId("rev", input?.entry?.id || input?.entry?.slug || "entry");

  if (!enabled) {
    return {
      schema_version: "0.2.0",
      review_id: reviewId,
      groxy_assist_enabled: false,
      gate_status: "bypassed",
      audit_report: null,
      actions: [
        { id: "make_live", label: "Make This Live", requires_confirmation: false },
      ],
    };
  }

  const auditReport = auditEntryAndLayout(input, options);
  return {
    schema_version: "0.2.0",
    review_id: reviewId,
    groxy_assist_enabled: true,
    gate_status: "review_required",
    audit_report: auditReport,
    actions: [
      { id: "make_live", label: "Make This Live", requires_confirmation: true },
      { id: "boost", label: "Let Groxy Boost This", icon: "rocket" },
    ],
  };
}

/**
 * Snapshot exact base-10 GrabDecimal / GrabInteger wire strings from custom_fields (ADR-025c).
 * @param {object} customFields
 * @returns {{ lockedStrings: Map<string, string>, normalizedFields: object }}
 */
function lockNumericCustomFields(customFields) {
  const lockedStrings = new Map();
  const normalizedFields = {};
  if (!customFields || typeof customFields !== "object") {
    return { lockedStrings, normalizedFields };
  }
  for (const [k, v] of Object.entries(customFields)) {
    const kl = k.toLowerCase();
    if (typeof v === "string" && (isExactGrabDecimalString(v) || isExactGrabIntegerString(v))) {
      lockedStrings.set(k, v);
      normalizedFields[k] = v;
    } else if (typeof v === "number" && Number.isFinite(v) && NUMERIC_WIRE_KEYS.has(kl)) {
      // Preserve raw finite decimal into exact wire string when non-string was supplied
      normalizedFields[k] = String(v);
    } else {
      normalizedFields[k] = cloneJson(v);
    }
  }
  return { lockedStrings, normalizedFields };
}

function assertNumericFieldsPreserved(lockedStrings, candidateCustomFields) {
  for (const [k, exactVal] of lockedStrings.entries()) {
    if (!candidateCustomFields || candidateCustomFields[k] !== exactVal) {
      throw new Error(
        `ADR-025c invariant violation: custom_fields.${k} mutated from "${exactVal}" to "${String(candidateCustomFields?.[k])}".`
      );
    }
  }
}

/**
 * Run the deterministic "Let Groxy Boost This" remediation & side-by-side diff engine.
 * Stages candidate_entry and candidate_layout in memory ONLY; requires explicit human
 * approval ("Approve & Make This Live") before persistence or publish (`GROXY-SAFE-001`).
 *
 * @param {object} input
 * @param {object} [options]
 * @returns {object}
 */
export function boostEntryAndLayout(input = {}, options = {}) {
  const playbook = options.playbook || DEFAULT_SEO_PLAYBOOK;
  const designSystemMd = String(input.design_system_md || options.design_system_md || "");
  const designSystem = designSystemMd ? parseDesignSystemMarkdown(designSystemMd) : null;

  const beforeReport = auditEntryAndLayout(input, { ...options, playbook });
  const origEntry = input.entry && typeof input.entry === "object" ? cloneJson(input.entry) : {};
  const contentType = String(origEntry.content_type || "post").toLowerCase() || "post";
  const entryId = String(origEntry.id ?? "");
  const siteContext = input.site_context && typeof input.site_context === "object" ? input.site_context : {};
  const focusKeyword = deriveFocusKeyword(origEntry, input.focus_keyword);

  // Lock exact GrabDecimal / GrabInteger wire strings (ADR-025c)
  const { lockedStrings, normalizedFields } = lockNumericCustomFields(origEntry.custom_fields);

  const origTitle = String(origEntry.meta_title || origEntry.title || "").trim();
  const origExcerpt = String(origEntry.meta_description || origEntry.excerpt || "").trim();
  const origSlug = String(origEntry.slug || "").trim();

  const boostedTitle = buildBoostedTitle(
    origTitle,
    focusKeyword,
    contentType,
    siteContext.entries || [],
    entryId
  );
  const boostedSlug = buildBoostedSlug(
    origSlug,
    boostedTitle,
    siteContext.entries || [],
    siteContext.redirects || [],
    entryId
  );

  const rawLayout = input.grex_layout || input.layout || origEntry.grex_layout || null;
  const { redirectMap, knownTargets, resolveCanonical } = buildRedirectResolutionMaps(
    siteContext,
    boostedSlug,
    entryId
  );
  const knownEntryPaths =
    Array.isArray(siteContext.entries) && siteContext.entries.length > 0
      ? new Set([
          "/",
          "/blog",
          "/about",
          "/search",
          "/contact",
          "/pricing",
          ...knownTargets.map((t) => normalizePath(t.href)),
        ])
      : null;

  const selfPaths = new Set(
    [
      origSlug ? normalizePath(`/${origSlug}`) : "",
      boostedSlug ? normalizePath(`/${boostedSlug}`) : "",
      origEntry.url ? normalizePath(origEntry.url) : "",
    ].filter(Boolean)
  );

  const ctx = {
    designSystem,
    focusKeyword,
    boostedTitle,
    mediaList: siteContext.media || [],
    redirectMap,
    knownTargets,
    knownEntryPaths,
    resolveCanonical,
    selfPaths,
    h1Seen: false,
    lastHeadingLevel: 0,
    subHeadingCount: 0,
    internalLinkCount: 0,
    fixedRules: new Set(),
  };

  let boostedLayout = rawLayout
    ? sanitizeGrexTree(cloneJson(rawLayout), ctx, 1)
    : defaultRootLayout(boostedTitle);

  if (!boostedLayout) {
    boostedLayout = defaultRootLayout(boostedTitle);
  }
  if (!Array.isArray(boostedLayout.children)) {
    boostedLayout.children = [];
  }

  // Ensure root layout uses safe high-contrast design-system tokens when inline overrides fail or lack tokens
  const rootStyles = boostedLayout.styles || {};
  const rootBase = rootStyles.base || rootStyles;
  if (!rootBase || !rootBase.color || !String(rootBase.color).includes("var(--grex-")) {
    boostedLayout.styles = {
      ...(rootStyles.base ? rootStyles : {}),
      base: {
        ...(rootBase || {}),
        color: designSystem?.modes?.light?.["--grex-color-text"] ? "var(--grex-color-text, #0f172a)" : "#0f172a",
        "background-color": designSystem?.modes?.light?.["--grex-color-bg"]
          ? "var(--grex-color-bg, #ffffff)"
          : "#ffffff",
      },
    };
  }

  if (!ctx.h1Seen) {
    boostedLayout.children.unshift({
      element: "Heading",
      props: { id: "groxy-h1", level: 1, text: boostedTitle },
    });
    ctx.h1Seen = true;
    ctx.fixedRules.add("GROXY-SEO-005");
  }

  // Ensure substantive word count + H2 subheading + keyword in lead copy
  const minWords = contentType === "page" || contentType === "product" ? 120 : 300;
  const plainSegments = [
    origEntry.body || "",
    origEntry.body_html ? stripHtml(origEntry.body_html) : "",
    ...collectPlainWordsFromTree(boostedLayout),
  ];
  const combinedText = plainSegments.join(" ");
  const currentWords = tokenizeWords(combinedText);
  const kwWords = tokenizeWords(focusKeyword);
  const leadWords = currentWords.slice(0, 80).join(" ");
  const leadHasKw = kwWords.length > 0 && kwWords.every((w) => leadWords.includes(w));

  if (!leadHasKw) {
    const h1Idx = boostedLayout.children.findIndex(
      (c) => c?.element === "Heading" && Number(c?.props?.level) === 1
    );
    const introNode = {
      element: "Text",
      tag: "p",
      props: {
        id: "groxy-lead-intro",
        text: `${boostedTitle} brings ${focusKeyword} best practices together with clean semantic markup and verified accessibility.`,
      },
    };
    boostedLayout.children.splice(h1Idx >= 0 ? h1Idx + 1 : 0, 0, introNode);
    ctx.fixedRules.add("GROXY-SEO-002");
  }

  if (ctx.subHeadingCount === 0) {
    boostedLayout.children.push({
      element: "Heading",
      props: {
        id: "groxy-h2-overview",
        level: 2,
        text: `${titleCase(focusKeyword)} Architecture & Key Details`,
      },
    });
    ctx.subHeadingCount += 1;
    ctx.fixedRules.add("GROXY-SEO-006");
  }

  const updatedWordCount = tokenizeWords(
    [
      origEntry.body || "",
      origEntry.body_html ? stripHtml(origEntry.body_html) : "",
      ...collectPlainWordsFromTree(boostedLayout),
    ].join(" ")
  ).length;

  if (updatedWordCount < minWords) {
    const needed = minWords - updatedWordCount + 25;
    boostedLayout.children.push({
      element: "Text",
      tag: "p",
      props: {
        id: "groxy-editorial-depth",
        text: buildDepthParagraph(focusKeyword, boostedTitle, needed),
      },
    });
    ctx.fixedRules.add("GROXY-SEO-006");
  }

  if (ctx.internalLinkCount === 0) {
    const target = knownTargets[0] || {
      href: "/blog",
      title: `${titleCase(focusKeyword)} Guides`,
    };
    boostedLayout.children.push({
      element: "Link",
      props: {
        id: "groxy-internal-link",
        href: target.href,
        text: `Explore ${target.title}`.slice(0, 80),
      },
    });
    ctx.fixedRules.add("GROXY-LINK-001");
  }

  const boostedPlainCopy = [
    origEntry.body || "",
    ...collectPlainWordsFromTree(boostedLayout),
  ].join(" ");
  const boostedExcerpt = buildBoostedExcerpt(origExcerpt, boostedTitle, focusKeyword, boostedPlainCopy);

  const candidateEntry = {
    ...origEntry,
    title: boostedTitle,
    slug: boostedSlug,
    excerpt: boostedExcerpt,
    focus_keyword: focusKeyword,
    custom_fields: normalizedFields,
  };
  if (typeof origEntry.meta_title === "string") {
    candidateEntry.meta_title = boostedTitle;
  }
  if (typeof origEntry.meta_description === "string") {
    candidateEntry.meta_description = boostedExcerpt;
  }
  if (typeof origEntry.body_html === "string" && origEntry.body_html.trim()) {
    candidateEntry.body_html = sanitizeHtmlFragment(origEntry.body_html);
  }

  // Enforce ADR-025c exact GrabDecimal / GrabInteger wire strings
  assertNumericFieldsPreserved(lockedStrings, candidateEntry.custom_fields);

  const afterReport = auditEntryAndLayout(
    {
      ...input,
      entry: candidateEntry,
      grex_layout: boostedLayout,
      focus_keyword: focusKeyword,
      design_system_md: designSystemMd,
    },
    { ...options, playbook }
  );

  // Build Before vs. After rule-attribution diffs
  const beforeMap = new Map((beforeReport.findings || []).map((f) => [f.rule_id, f]));
  const afterMap = new Map((afterReport.findings || []).map((f) => [f.rule_id, f]));
  const improvedRuleIds = [];
  for (const [rid, afterF] of afterMap.entries()) {
    const beforeF = beforeMap.get(rid);
    if (beforeF && afterF.points_earned > beforeF.points_earned) {
      improvedRuleIds.push(rid);
    }
  }

  const titleRules = ["GROXY-SEO-001", "GROXY-SEO-002", "GROXY-SEO-007"].filter((id) =>
    improvedRuleIds.includes(id)
  );
  const excerptRules = ["GROXY-SEO-003"].filter((id) => improvedRuleIds.includes(id));
  const slugRules = ["GROXY-SEO-004", "GROXY-SEO-007"].filter((id) =>
    improvedRuleIds.includes(id)
  );
  const layoutRules = [
    "GROXY-SEO-005",
    "GROXY-SEO-006",
    "GROXY-A11Y-001",
    "GROXY-A11Y-002",
    "GROXY-A11Y-003",
    "GROXY-A11Y-004",
    "GROXY-A11Y-005",
    "GROXY-DOM-001",
    "GROXY-DOM-002",
    "GROXY-DOM-003",
    "GROXY-DOM-005",
    "GROXY-LINK-001",
    "GROXY-LINK-002",
  ].filter((id) => improvedRuleIds.includes(id) || ctx.fixedRules.has(id));

  const diffs = [
    {
      field: "title",
      label: "SEO Title",
      before: origTitle,
      after: boostedTitle,
      rule_ids_fixed: titleRules.length > 0 ? titleRules : origTitle !== boostedTitle ? ["GROXY-SEO-001"] : [],
      changed: origTitle !== boostedTitle,
    },
    {
      field: "excerpt",
      label: "Meta Description / Excerpt",
      before: origExcerpt,
      after: boostedExcerpt,
      rule_ids_fixed: excerptRules.length > 0 ? excerptRules : origExcerpt !== boostedExcerpt ? ["GROXY-SEO-003"] : [],
      changed: origExcerpt !== boostedExcerpt,
    },
    {
      field: "slug",
      label: "URL Slug",
      before: origSlug,
      after: boostedSlug,
      rule_ids_fixed: slugRules.length > 0 ? slugRules : origSlug !== boostedSlug ? ["GROXY-SEO-004"] : [],
      changed: origSlug !== boostedSlug,
    },
    {
      field: "grex_layout",
      label: "Semantic Grex Layout, Headings, Alt Text & Links",
      before: JSON.stringify(rawLayout || {}),
      after: JSON.stringify(boostedLayout),
      rule_ids_fixed: Array.from(new Set(layoutRules)),
      changed: JSON.stringify(rawLayout || {}) !== JSON.stringify(boostedLayout),
    },
  ];

  const boostId = makeOpaqueId("bst", `${entryId}:${boostedSlug}`);
  const approvalToken = makeOpaqueId("tok", boostId);

  return {
    schema_version: "0.2.0",
    boost_id: boostId,
    review_id: input.review_id || makeOpaqueId("rev", entryId || boostedSlug),
    mode: input.use_local_ai ? "local_ai_assisted" : "deterministic",
    approval_required: true,
    approval_token: approvalToken,
    before_report: beforeReport,
    after_report: afterReport,
    diffs,
    candidate_entry: candidateEntry,
    candidate_layout: boostedLayout,
  };
}
