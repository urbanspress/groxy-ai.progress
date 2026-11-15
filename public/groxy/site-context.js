/**
 * Groxy AI v1.0.0 — Site-Wide Intelligence Engine
 *
 * Pure zero-dependency Grex JS v1.0.0 ES module providing:
 * 1. Live `SITE-CONTEXT.md` background snapshot & ADR-025c price preservation
 * 2. Read-only Site-Wide Internal Linking Graph, authority scoring & 301 loop exclusion
 * 3. Deterministic, XSS-safe (`</script>`-escaped) `schema.org` JSON-LD generator
 * 4. Media Library `alt`-text enrichment & single-use approval gate (decorative preserved)
 * 5. Quiet `Groxy Nightly Watch` Morning Boost Digest & Portable `Site DNA` bundle
 */

export const GROXY_VERSION = "1.0.0";

import { GrexSecurityError, isSafeUrl } from "./grex.js";
import { parseDesignSystemMarkdown } from "./playbook.js";
import {
  isExactGrabDecimalString,
  isExactGrabIntegerString,
  scoreToGrade,
} from "./auditor.js";
import { listStylePacks, STYLE_PACKS } from "./generator.js";

export const GENERIC_ANCHOR_TEXTS = Object.freeze([
  "click here",
  "here",
  "read more",
  "learn more",
  "more",
  "more info",
  "details",
  "link",
  "this",
  "this page",
  "view",
  "go",
  "see more",
]);

const STOP_WORDS = new Set([
  "the", "and", "for", "with", "that", "this", "from", "your", "into", "about",
  "have", "will", "what", "when", "where", "which", "more", "than", "then",
  "our", "you", "are", "how", "why", "all", "can", "use", "page", "post",
  "guide", "home", "site", "web", "new", "best", "top",
]);

function generateToken(prefix = "tok_") {
  if (globalThis.crypto && typeof globalThis.crypto.getRandomValues === "function") {
    const bytes = new Uint8Array(12);
    globalThis.crypto.getRandomValues(bytes);
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    return `${prefix}${hex}`;
  }
  const fallback = `${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`;
  return `${prefix}${fallback}`;
}

export function normalizeInternalPath(rawPath) {
  if (typeof rawPath !== "string") return "";
  let clean = rawPath.trim();
  if (!clean) return "";
  const hashIdx = clean.indexOf("#");
  if (hashIdx !== -1) clean = clean.slice(0, hashIdx);
  const queryIdx = clean.indexOf("?");
  if (queryIdx !== -1) clean = clean.slice(0, queryIdx);
  if (!clean) return "/";
  if (/^https?:\/\//i.test(clean)) {
    try {
      const parsed = new URL(clean);
      clean = parsed.pathname || "/";
    } catch {
      return "";
    }
  } else if (/^[a-z][a-z0-9+.-]*:/i.test(clean)) {
    return "";
  }
  if (!clean.startsWith("/")) {
    clean = `/${clean}`;
  }
  clean = clean.replace(/\/{2,}/g, "/");
  if (clean.length > 1 && clean.endsWith("/")) {
    clean = clean.slice(0, -1);
  }
  return clean.toLowerCase();
}

function isSameSiteUrl(rawUrl, baseOrigin = "") {
  if (typeof rawUrl !== "string") return false;
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.startsWith("#")) return false;
  if (trimmed.startsWith("/")) return !trimmed.startsWith("//");
  if (/^https?:\/\//i.test(trimmed)) {
    if (!baseOrigin) return false;
    try {
      return new URL(trimmed).origin.toLowerCase() === String(baseOrigin).toLowerCase();
    } catch {
      return false;
    }
  }
  return false;
}

function stripTags(html) {
  return String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeKeywords(...inputs) {
  const tokens = new Set();
  for (const val of inputs) {
    const str = Array.isArray(val) ? val.join(" ") : String(val || "");
    const parts = str.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/);
    for (const part of parts) {
      for (const piece of part.split("-")) {
        if (piece.length >= 3 && !STOP_WORDS.has(piece)) {
          tokens.add(piece);
        }
      }
    }
  }
  return tokens;
}

export function extractInternalLinksFromEntry(entry, baseOrigin = "") {
  const collected = [];
  const seenKey = new Set();

  function addLink(rawTarget, anchorText) {
    if (!isSameSiteUrl(rawTarget, baseOrigin) && !String(rawTarget || "").trim().startsWith("/")) {
      return;
    }
    const targetPath = normalizeInternalPath(String(rawTarget || ""));
    if (!targetPath) return;
    const cleanAnchor = stripTags(anchorText || "").trim();
    const key = `${targetPath}::${cleanAnchor.toLowerCase()}`;
    if (seenKey.has(key)) return;
    seenKey.add(key);
    collected.push({
      target_path: targetPath,
      anchor_text: cleanAnchor,
    });
  }

  const explicit = entry?.internal_links || entry?.outgoing_links || [];
  if (Array.isArray(explicit)) {
    for (const item of explicit) {
      if (typeof item === "string") {
        addLink(item, "");
      } else if (item && typeof item === "object") {
        addLink(item.target_path || item.url || item.href || item.to, item.anchor_text || item.anchor || item.label || "");
      }
    }
  }

  const html = String(entry?.body_html || entry?.body || "");
  if (html) {
    const anchorRegex = /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let match;
    while ((match = anchorRegex.exec(html)) !== null) {
      addLink(match[1], match[2]);
    }
  }

  function walkLayout(node) {
    if (!node || typeof node !== "object") return;
    const props = node.props && typeof node.props === "object" ? node.props : {};
    const href = props.href || props.to || props.url;
    if (typeof href === "string" && (node.type === "Link" || node.type === "Button" || node.tag === "a")) {
      addLink(href, props.label || props.text || node.text || "");
    }
    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        if (child && typeof child === "object") walkLayout(child);
      }
    }
  }
  if (entry?.grex_layout && typeof entry.grex_layout === "object") {
    walkLayout(entry.grex_layout);
  }

  return collected;
}

function validateExactPriceField(value, fieldName = "price") {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "number") {
    throw new GrexSecurityError(
      `ADR-025c violation: "${fieldName}" must be an exact base-10 GrabDecimal/GrabInteger wire string, not a JavaScript number (${value}).`
    );
  }
  const str = String(value).trim();
  if (!isExactGrabDecimalString(str) && !isExactGrabIntegerString(str)) {
    throw new GrexSecurityError(
      `ADR-025c violation: "${fieldName}" must be a valid exact base-10 GrabDecimal string (got "${str}").`
    );
  }
  if (str.startsWith("-")) {
    throw new GrexSecurityError(
      `ADR-025c violation: "${fieldName}" cannot be negative (got "${str}").`
    );
  }
  return str;
}

function flattenMenus(menusInput) {
  const flatItems = [];
  const locationsSeen = new Set();

  function walkMenuItems(items, location, menuSlug) {
    if (!Array.isArray(items)) return;
    for (const item of items) {
      if (!item || typeof item !== "object") continue;
      const rawUrl = item.url || item.external_url || item.path || "";
      const normPath = normalizeInternalPath(String(rawUrl));
      const label = String(item.label || item.title || "").trim();
      if (label || normPath || rawUrl) {
        flatItems.push({
          menu_slug: menuSlug,
          location: location || "primary",
          label: label || normPath || String(rawUrl),
          url: String(rawUrl),
          target_path: normPath,
          is_internal: normPath !== "",
        });
      }
      if (Array.isArray(item.children)) {
        walkMenuItems(item.children, location, menuSlug);
      }
    }
  }

  if (Array.isArray(menusInput)) {
    for (const m of menusInput) {
      if (!m || typeof m !== "object") continue;
      const loc = String(m.location || "primary").trim().toLowerCase() || "primary";
      locationsSeen.add(loc);
      walkMenuItems(m.items || [], loc, String(m.slug || loc));
    }
  } else if (menusInput && typeof menusInput === "object") {
    for (const [locKey, items] of Object.entries(menusInput)) {
      const loc = String(locKey || "primary").trim().toLowerCase();
      locationsSeen.add(loc);
      if (Array.isArray(items)) {
        walkMenuItems(items, loc, loc);
      } else if (items && typeof items === "object" && Array.isArray(items.items)) {
        walkMenuItems(items.items, String(items.location || loc).toLowerCase(), String(items.slug || loc));
      }
    }
  }

  return {
    locations: Array.from(locationsSeen),
    items: flatItems,
  };
}

/**
 * Builds a structured, read-only Site Context snapshot (`ADR-025c` price-safe).
 */
export function buildSiteContextSnapshot(input = {}) {
  const src = input?.site_context && typeof input.site_context === "object" ? input.site_context : input;
  const siteName = String(src?.site_name || src?.site_title || "GrabLab Site").trim();
  const siteUrl = String(src?.site_url || src?.base_url || "https://example.com").trim();
  let baseOrigin = "";
  try {
    baseOrigin = new URL(siteUrl).origin;
  } catch {
    baseOrigin = "";
  }
  const generatedAt = String(src?.generated_at || new Date().toISOString());

  const categorySet = new Set();
  const tagSet = new Set();
  const addTerms = (list, targetSet) => {
    if (!Array.isArray(list)) return;
    for (const t of list) {
      const label = typeof t === "string" ? t.trim() : String(t?.name || t?.slug || t?.label || "").trim();
      if (label) targetSet.add(label);
    }
  };
  addTerms(src?.categories, categorySet);
  addTerms(src?.tags, tagSet);
  if (Array.isArray(src?.taxonomies)) {
    for (const tax of src.taxonomies) {
      const slug = String(tax?.slug || tax?.taxonomy || "").toLowerCase();
      if (slug.includes("tag")) addTerms(tax.terms || [tax], tagSet);
      else addTerms(tax.terms || [tax], categorySet);
    }
  }

  const rawEntries = Array.isArray(src?.entries) ? src.entries : [];
  const entries = [];
  const discoveredProducts = [];
  const productSkusSeen = new Set();
  const redirectMap = new Map();

  function addRedirect(oldPathRaw, targetPathRaw, statusCode = 301) {
    const oldPath = normalizeInternalPath(String(oldPathRaw || ""));
    const targetPath = normalizeInternalPath(String(targetPathRaw || ""));
    if (!oldPath || !targetPath) return;
    redirectMap.set(oldPath, {
      old_path: oldPath,
      target_path: targetPath,
      status_code: Number(statusCode) || 301,
    });
  }

  for (const rawEntry of rawEntries) {
    if (!rawEntry || typeof rawEntry !== "object") continue;
    const rawPath = rawEntry.full_path || rawEntry.path || (rawEntry.slug ? `/${rawEntry.slug}` : "/");
    const fullPath = normalizeInternalPath(String(rawPath));
    const slug = String(rawEntry.slug || fullPath.split("/").filter(Boolean).pop() || "home").trim();
    const contentType = String(rawEntry.content_type || rawEntry.content_type_slug || "page").trim().toLowerCase();
    const status = String(rawEntry.status || "published").trim().toLowerCase();
    const title = String(rawEntry.title || slug).trim();
    const cf = rawEntry.custom_fields && typeof rawEntry.custom_fields === "object" ? { ...rawEntry.custom_fields } : {};

    const entryCats = Array.isArray(rawEntry.categories) ? rawEntry.categories.map((c) => String(c).trim()).filter(Boolean) : [];
    const entryTags = Array.isArray(rawEntry.tags) ? rawEntry.tags.map((t) => String(t).trim()).filter(Boolean) : [];
    addTerms(entryCats, categorySet);
    addTerms(entryTags, tagSet);

    if (Array.isArray(rawEntry.terms)) {
      for (const term of rawEntry.terms) {
        const taxSlug = String(term?.taxonomy || term?.taxonomy_slug || "category").toLowerCase();
        const termName = String(term?.name || term?.slug || "").trim();
        if (!termName) continue;
        if (taxSlug.includes("tag")) {
          tagSet.add(termName);
          if (!entryTags.includes(termName)) entryTags.push(termName);
        } else {
          categorySet.add(termName);
          if (!entryCats.includes(termName)) entryCats.push(termName);
        }
      }
    }

    if (Array.isArray(rawEntry.slug_history)) {
      for (const hist of rawEntry.slug_history) {
        if (typeof hist === "string") addRedirect(hist, fullPath, 301);
        else if (hist && typeof hist === "object") addRedirect(hist.old_path || hist.from, hist.target_path || fullPath, hist.status_code || 301);
      }
    }

    const priceField =
      cf.price !== undefined ? cf.price : cf.featured_price !== undefined ? cf.featured_price : cf.sale_price;
    if (priceField !== undefined && priceField !== null && priceField !== "") {
      const exactPrice = validateExactPriceField(priceField, `entry("${fullPath}").price`);
      const sku = String(cf.sku || rawEntry.sku || slug.toUpperCase());
      if (!productSkusSeen.has(`${fullPath}::${sku}`)) {
        productSkusSeen.add(`${fullPath}::${sku}`);
        discoveredProducts.push({
          title,
          path: fullPath,
          sku,
          price: exactPrice,
          currency: String(cf.currency || "USD").toUpperCase(),
          availability: String(cf.availability || "InStock"),
        });
      }
    }

    const extractedLinks = extractInternalLinksFromEntry(rawEntry, baseOrigin);
    const plainBody = stripTags(rawEntry.body_html || rawEntry.body || rawEntry.excerpt || "");

    entries.push({
      id: rawEntry.id ?? null,
      title,
      slug,
      full_path: fullPath,
      content_type: contentType,
      status,
      meta_title: String(rawEntry.meta_title || title),
      meta_description: String(rawEntry.meta_description || rawEntry.excerpt || plainBody.slice(0, 155)),
      excerpt: String(rawEntry.excerpt || plainBody.slice(0, 180)),
      categories: entryCats,
      tags: entryTags,
      custom_fields: cf,
      internal_links: extractedLinks,
      word_count: plainBody ? plainBody.split(/\s+/).length : 0,
      recommended_anchor: String(rawEntry.recommended_anchor || title),
    });
  }

  const rawProducts = Array.isArray(src?.products) ? src.products : [];
  for (const prod of rawProducts) {
    if (!prod || typeof prod !== "object") continue;
    const exactPrice = validateExactPriceField(prod.price, `product("${prod.title || prod.sku}").price`);
    const pPath = normalizeInternalPath(String(prod.path || prod.full_path || `/products/${prod.slug || "item"}`));
    const sku = String(prod.sku || prod.slug || "SKU").trim();
    const dedupeKey = `${pPath}::${sku}`;
    if (!productSkusSeen.has(dedupeKey)) {
      productSkusSeen.add(dedupeKey);
      discoveredProducts.push({
        title: String(prod.title || prod.name || sku),
        path: pPath,
        sku,
        price: exactPrice || "0.00",
        currency: String(prod.currency || "USD").toUpperCase(),
        availability: String(prod.availability || "InStock"),
      });
    }
  }

  const rawRedirects = [
    ...(Array.isArray(src?.redirects) ? src.redirects : []),
    ...(Array.isArray(src?.slug_history) ? src.slug_history : []),
  ];
  for (const r of rawRedirects) {
    if (!r || typeof r !== "object") continue;
    addRedirect(r.old_path || r.from || r.source, r.target_path || r.to || r.destination, r.status_code || 301);
  }

  const menusInfo = flattenMenus(src?.menus);
  const rawMedia = Array.isArray(src?.media) ? src.media : [];
  let decorativeCount = 0;
  let missingAltCount = 0;
  let filenameAltCount = 0;
  let validAltCount = 0;
  for (const m of rawMedia) {
    if (!m || typeof m !== "object") continue;
    const isDec = Boolean(m.decorative || m.is_decorative || m.isDecorative);
    if (isDec) {
      decorativeCount += 1;
      continue;
    }
    const alt = String(m.alt_text ?? m.alt ?? "").trim();
    if (!alt) missingAltCount += 1;
    else if (isFilenameAltText(alt)) filenameAltCount += 1;
    else validAltCount += 1;
  }

  const publishedCount = entries.filter((e) => e.status === "published").length;

  return {
    schema_version: "0.4.0",
    read_only: true,
    site_name: siteName,
    site_url: siteUrl,
    generated_at: generatedAt,
    active_theme: String(src?.active_theme || "grex-builder").trim(),
    entries,
    categories: Array.from(categorySet).sort(),
    tags: Array.from(tagSet).sort(),
    products: discoveredProducts,
    menus: menusInfo,
    redirects: Array.from(redirectMap.values()),
    media_summary: {
      total: rawMedia.length,
      decorative: decorativeCount,
      missing_alt: missingAltCount,
      filename_alt: filenameAltCount,
      valid_alt: validAltCount,
    },
    counts: {
      entries: entries.length,
      published_entries: publishedCount,
      categories: categorySet.size,
      tags: tagSet.size,
      products: discoveredProducts.length,
      menus: menusInfo.locations.length,
      menu_links: menusInfo.items.length,
      redirects: redirectMap.size,
      media: rawMedia.length,
    },
    decimal_integrity_verified: true,
  };
}

/**
 * Renders compact human- and AI-readable `storage/SITE-CONTEXT.md`.
 */
export function renderSiteContextMarkdown(snapshot) {
  const s = snapshot && snapshot.entries ? snapshot : buildSiteContextSnapshot(snapshot);
  const lines = [
    `# SITE-CONTEXT.md — ${s.site_name}`,
    "",
    `- **Site URL:** ${s.site_url}`,
    `- **Active Theme:** ${s.active_theme}`,
    `- **Synced At:** ${s.generated_at}`,
    `- **ADR-025c Decimal Integrity:** ${s.decimal_integrity_verified ? "Verified (exact base-10 wire strings)" : "Unverified"}`,
    `- **Counts:** ${s.counts.entries} entries (${s.counts.published_entries} published), ${s.counts.products} products, ${s.counts.categories} categories, ${s.counts.tags} tags, ${s.counts.menu_links} menu links, ${s.counts.redirects} 301 redirects, ${s.counts.media} media items`,
    "",
    "## Navigation Menus (Primary, Footer, Mobile)",
  ];

  if (s.menus.items.length === 0) {
    lines.push("- _(No navigation menu links indexed)_");
  } else {
    for (const item of s.menus.items) {
      lines.push(`- [${item.label}](${item.target_path || item.url}) (location: \`${item.location}\`)`);
    }
  }

  lines.push("", "## Entries & Landing Pages Index");
  if (s.entries.length === 0) {
    lines.push("- _(No entries indexed)_");
  } else {
    for (const e of s.entries) {
      const taxParts = [];
      if (e.categories.length) taxParts.push(`categories: ${e.categories.join(", ")}`);
      if (e.tags.length) taxParts.push(`tags: ${e.tags.join(", ")}`);
      const taxStr = taxParts.length ? ` | ${taxParts.join(" | ")}` : "";
      lines.push(`- \`${e.full_path}\` — **${e.title}** (${e.content_type}, status: ${e.status}${taxStr})`);
    }
  }

  lines.push("", "## Categories & Tags");
  lines.push(`- **Categories:** ${s.categories.length ? s.categories.join(", ") : "None"}`);
  lines.push(`- **Tags:** ${s.tags.length ? s.tags.join(", ") : "None"}`);

  lines.push("", "## Products & Exact Pricing Catalog (ADR-025c)");
  if (s.products.length === 0) {
    lines.push("- _(No products with GrabDecimal prices indexed)_");
  } else {
    for (const p of s.products) {
      lines.push(`- **${p.title}** (\`${p.path}\`, SKU: \`${p.sku}\`) — Price: \`"${p.price}"\` ${p.currency} (${p.availability})`);
    }
  }

  lines.push("", "## 301 Redirects & Slug History");
  if (s.redirects.length === 0) {
    lines.push("- _(No slug_history 301 redirects indexed)_");
  } else {
    for (const r of s.redirects) {
      lines.push(`- \`${r.old_path}\` -> \`${r.target_path}\` (${r.status_code})`);
    }
  }

  lines.push("", "## Media Inventory Summary");
  lines.push(
    `- Total: ${s.media_summary.total} | Valid Alt: ${s.media_summary.valid_alt} | Missing Alt: ${s.media_summary.missing_alt} | Filename Alt: ${s.media_summary.filename_alt} | Decorative Preserved (\`alt=""\`): ${s.media_summary.decorative}`
  );
  lines.push("");
  return lines.join("\n");
}

export function parseSiteContextMarkdown(markdownText = "") {
  const lines = String(markdownText || "").split(/\r?\n/);
  const heading = (lines.find((l) => l.startsWith("# SITE-CONTEXT.md")) || "").replace(/^#\s*SITE-CONTEXT\.md\s*[-—]?\s*/, "").trim();
  const sections = [];
  for (const line of lines) {
    if (line.startsWith("## ")) {
      sections.push(line.slice(3).trim());
    }
  }
  return {
    site_name: heading || "GrabLab Site",
    sections,
    line_count: lines.length,
    byte_length: new TextEncoder().encode(String(markdownText || "")).length,
  };
}

/**
 * Resolves redirect chains and cycles so 301 loops are strictly detected and excluded.
 */
function analyzeRedirectTopology(redirects) {
  const forward = new Map();
  for (const r of redirects) {
    if (r?.old_path && r?.target_path) {
      forward.set(r.old_path, r.target_path);
    }
  }

  const loopPaths = new Set();
  const loops = [];
  const chains = [];
  const recordedCycleSignatures = new Set();

  for (const startPath of forward.keys()) {
    const chain = [startPath];
    const visited = new Map([[startPath, 0]]);
    let current = startPath;

    while (forward.has(current)) {
      const next = forward.get(current);
      if (visited.has(next)) {
        const cycleStartIdx = visited.get(next);
        const cycleNodes = chain.slice(cycleStartIdx).concat(next);
        for (const p of chain) loopPaths.add(p);
        for (const p of cycleNodes) loopPaths.add(p);

        const canonicalSig = [...new Set(cycleNodes)].sort().join("->");
        if (!recordedCycleSignatures.has(canonicalSig)) {
          recordedCycleSignatures.add(canonicalSig);
          loops.push({
            cycle: cycleNodes,
            status_code: 301,
            reason: `301 redirect loop detected: ${cycleNodes.join(" -> ")}. Excluded from internal link suggestions.`,
          });
        }
        break;
      }
      visited.set(next, chain.length);
      chain.push(next);
      current = next;
      if (chain.length > 20) {
        for (const p of chain) loopPaths.add(p);
        break;
      }
    }

    if (!loopPaths.has(startPath) && chain.length >= 3) {
      chains.push({
        source_path: startPath,
        hops: chain,
        terminal_target: chain[chain.length - 1],
        hop_count: chain.length - 1,
        reason: `301 redirect chain (${chain.length - 1} hops): point directly to ${chain[chain.length - 1]}.`,
      });
    }
  }

  return {
    forward,
    loopPaths,
    loops,
    chains,
  };
}

/**
 * Read-only Site-Wide Internal Linking Graph, authority calculation, and contextual suggestions.
 * Excludes all 301 loop/cycle paths from link recommendations (`GROXY-SAFE-001`).
 */
export function analyzeInternalLinkingGraph(input = {}) {
  const snapshot =
    input?.snapshot && Array.isArray(input.snapshot.entries)
      ? input.snapshot
      : buildSiteContextSnapshot(input?.site_context || input);

  const maxSuggestionsPerPage = Math.max(1, Math.min(10, Number(input?.max_suggestions_per_page) || 3));
  const topology = analyzeRedirectTopology(snapshot.redirects);

  const entryByPath = new Map();
  for (const entry of snapshot.entries) {
    entryByPath.set(entry.full_path, entry);
  }

  const inboundContent = new Map();
  const inboundMenu = new Map();
  const outboundValid = new Map();

  for (const path of entryByPath.keys()) {
    inboundContent.set(path, new Set());
    inboundMenu.set(path, new Set());
    outboundValid.set(path, new Set());
  }

  const brokenLinks = [];
  const genericAnchors = [];
  const loopReferences = [];
  const chainReferences = [];

  for (const entry of snapshot.entries) {
    const sourcePath = entry.full_path;
    for (const link of entry.internal_links || []) {
      const target = link.target_path;
      const anchorLower = String(link.anchor_text || "").trim().toLowerCase();

      if (anchorLower && GENERIC_ANCHOR_TEXTS.includes(anchorLower)) {
        genericAnchors.push({
          source_path: sourcePath,
          target_path: target,
          anchor_text: link.anchor_text,
          issue: "generic_anchor_text",
          recommendation: `Replace vague "${link.anchor_text}" anchor with descriptive topic keywords.`,
        });
      }

      if (topology.loopPaths.has(target)) {
        loopReferences.push({
          source_path: sourcePath,
          target_path: target,
          issue: "redirect_loop",
          recommendation: `Remove link to 301 loop target "${target}".`,
        });
        continue;
      }

      if (topology.forward.has(target)) {
        // Resolve terminal path if it redirects cleanly
        let resolved = target;
        const hopVisited = new Set([resolved]);
        let hops = 0;
        while (topology.forward.has(resolved) && hops < 12) {
          resolved = topology.forward.get(resolved);
          if (hopVisited.has(resolved)) break;
          hopVisited.add(resolved);
          hops += 1;
        }
        if (hops >= 2) {
          chainReferences.push({
            source_path: sourcePath,
            target_path: target,
            terminal_target: resolved,
            issue: "redirect_chain",
            recommendation: `Update multi-hop 301 link "${target}" directly to canonical "${resolved}".`,
          });
        }
        if (entryByPath.has(resolved) && resolved !== sourcePath) {
          inboundContent.get(resolved).add(sourcePath);
          outboundValid.get(sourcePath).add(resolved);
        } else if (!entryByPath.has(resolved)) {
          brokenLinks.push({
            source_path: sourcePath,
            target_path: target,
            resolved_target: resolved,
            issue: "broken_internal_link",
            recommendation: `Target "${resolved}" does not match any active entry.`,
          });
        }
        continue;
      }

      if (entryByPath.has(target)) {
        if (target !== sourcePath) {
          inboundContent.get(target).add(sourcePath);
          outboundValid.get(sourcePath).add(target);
        }
      } else {
        const isSystemAsset = target.startsWith("/assets/") || target.startsWith("/media/");
        if (!isSystemAsset) {
          brokenLinks.push({
            source_path: sourcePath,
            target_path: target,
            issue: "broken_internal_link",
            recommendation: `Fix or redirect missing internal link target "${target}" referenced in "${sourcePath}".`,
          });
        }
      }
    }
  }

  for (const menuItem of snapshot.menus.items || []) {
    if (!menuItem.is_internal || !menuItem.target_path) continue;
    const tPath = menuItem.target_path;
    if (topology.loopPaths.has(tPath)) {
      loopReferences.push({
        source_path: `menu:${menuItem.location}`,
        target_path: tPath,
        issue: "redirect_loop",
        recommendation: `Menu link "${menuItem.label}" points to 301 loop "${tPath}".`,
      });
      continue;
    }
    if (entryByPath.has(tPath)) {
      inboundMenu.get(tPath).add(`menu:${menuItem.location}`);
    } else if (!topology.forward.has(tPath) && !tPath.startsWith("/assets/")) {
      brokenLinks.push({
        source_path: `menu:${menuItem.location}`,
        target_path: tPath,
        issue: "broken_internal_link",
        recommendation: `Menu "${menuItem.location}" links to missing route "${tPath}".`,
      });
    }
  }

  // Iterative authority calculation (deterministic damped PageRank normalized 0-100)
  const paths = Array.from(entryByPath.keys());
  const scores = new Map(paths.map((p) => [p, 1.0]));
  const damping = 0.85;
  for (let iter = 0; iter < 6; iter += 1) {
    const nextScores = new Map(paths.map((p) => [p, 1 - damping]));
    for (const srcPath of paths) {
      const out = outboundValid.get(srcPath);
      if (!out || out.size === 0) continue;
      const share = (scores.get(srcPath) * damping) / out.size;
      for (const dst of out) {
        nextScores.set(dst, (nextScores.get(dst) || 0) + share);
      }
    }
    for (const p of paths) {
      const menuBonus = (inboundMenu.get(p)?.size || 0) * 0.25;
      const hubBonus = p === "/" ? 0.35 : 0;
      scores.set(p, (nextScores.get(p) || 0) + menuBonus + hubBonus);
    }
  }
  const maxRaw = Math.max(1, ...Array.from(scores.values()));

  const nodes = [];
  const orphanPages = [];
  for (const entry of snapshot.entries) {
    const p = entry.full_path;
    const inContent = inboundContent.get(p)?.size || 0;
    const inNav = inboundMenu.get(p)?.size || 0;
    const totalIn = inContent + inNav;
    const outCnt = outboundValid.get(p)?.size || 0;
    const isOrphan = p !== "/" && totalIn === 0;
    const authority = Math.max(5, Math.min(100, Math.round((scores.get(p) / maxRaw) * 100)));

    const node = {
      path: p,
      title: entry.title,
      content_type: entry.content_type,
      status: entry.status,
      inbound_content_links: inContent,
      inbound_menu_links: inNav,
      inbound_links: totalIn,
      outbound_links: outCnt,
      is_orphan: isOrphan,
      authority_score: authority,
    };
    nodes.push(node);
    if (isOrphan) orphanPages.push(node);
  }

  // Contextual link suggestions (strictly excluding 301 loop targets and generic anchors)
  const keywordsByPath = new Map(
    snapshot.entries.map((e) => [
      e.full_path,
      tokenizeKeywords(e.title, e.categories, e.tags, e.excerpt, e.slug),
    ])
  );

  const suggestions = [];
  for (const source of snapshot.entries) {
    if (topology.loopPaths.has(source.full_path)) continue;
    const alreadyLinked = outboundValid.get(source.full_path) || new Set();
    const srcTokens = keywordsByPath.get(source.full_path) || new Set();
    const candidates = [];

    for (const target of snapshot.entries) {
      const tPath = target.full_path;
      if (tPath === source.full_path) continue;
      if (target.status !== "published" && target.status !== "") continue;
      // CRITICAL GROXY-SAFE-001 + Loop Exclusion: never suggest a path involved in a 301 loop!
      if (topology.loopPaths.has(tPath)) continue;
      if (alreadyLinked.has(tPath)) continue;

      const tgtTokens = keywordsByPath.get(tPath) || new Set();
      let sharedKeywords = [];
      for (const kw of srcTokens) {
        if (tgtTokens.has(kw)) sharedKeywords.push(kw);
      }

      const tgtInTotal = (inboundContent.get(tPath)?.size || 0) + (inboundMenu.get(tPath)?.size || 0);
      const orphanBoost = tPath !== "/" && tgtInTotal === 0 ? 25 : 0;
      const relevanceScore = sharedKeywords.length * 18 + orphanBoost + (tPath === "/" ? 2 : 5);
      if (sharedKeywords.length === 0 && orphanBoost === 0) continue;

      let anchor = String(target.recommended_anchor || target.title || tPath).trim();
      if (GENERIC_ANCHOR_TEXTS.includes(anchor.toLowerCase()) || anchor.length < 4) {
        anchor = `Explore ${target.title}`;
      }

      candidates.push({
        source_path: source.full_path,
        source_title: source.title,
        target_path: tPath,
        target_title: target.title,
        anchor_text: anchor,
        shared_topics: sharedKeywords,
        target_is_orphan: tPath !== "/" && tgtInTotal === 0,
        relevance_score: relevanceScore,
        reason:
          tPath !== "/" && tgtInTotal === 0
            ? `Connects orphan page "${target.title}" using descriptive anchor text (${sharedKeywords.length ? `shared topics: ${sharedKeywords.join(", ")}` : "site structure coverage"}).`
            : `Strengthens topical cluster around "${sharedKeywords.join(", ")}" with natural descriptive anchor text.`,
        read_only_preview: true,
      });
    }

    candidates.sort((a, b) => b.relevance_score - a.relevance_score || a.target_path.localeCompare(b.target_path));
    for (const c of candidates.slice(0, maxSuggestionsPerPage)) {
      suggestions.push(c);
    }
  }

  return {
    schema_version: "0.4.0",
    read_only: true,
    mutates_live_cms: false,
    summary: {
      total_pages: nodes.length,
      orphan_count: orphanPages.length,
      redirect_chain_count: topology.chains.length + chainReferences.length,
      redirect_loop_count: topology.loops.length,
      broken_link_count: brokenLinks.length,
      generic_anchor_count: genericAnchors.length,
      suggestion_count: suggestions.length,
    },
    nodes,
    orphan_pages: orphanPages,
    redirect_chains: [...topology.chains, ...chainReferences],
    redirect_loops: topology.loops,
    loop_references: loopReferences,
    excluded_loop_targets: Array.from(topology.loopPaths).sort(),
    broken_links: brokenLinks,
    generic_anchors: genericAnchors,
    suggestions,
  };
}

/**
 * Escapes `<`, `>`, `&`, and line separators inside serialized JSON-LD so `</script>`
 * can never break out of `<script type="application/ld+json">` (`GREX-SEC-003`).
 */
export function escapeJsonLdForScript(jsonString) {
  return String(jsonString || "")
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function resolveCanonicalUrl(baseUrl, pathOrUrl) {
  const cleanBase = String(baseUrl || "https://example.com").replace(/\/+$/, "");
  const raw = String(pathOrUrl || "/").trim();
  if (/^https?:\/\//i.test(raw)) {
    return isSafeUrl(raw) ? raw : cleanBase;
  }
  const p = normalizeInternalPath(raw) || "/";
  return `${cleanBase}${p === "/" ? "" : p}`;
}

function extractFaqItemsFromLayout(node, out = []) {
  if (!node || typeof node !== "object") return out;
  if (node.type === "Accordion") {
    const props = node.props && typeof node.props === "object" ? node.props : {};
    if (Array.isArray(props.items)) {
      for (const item of props.items) {
        if (item?.title || item?.question) {
          out.push({
            question: String(item.title || item.question).trim(),
            answer: String(item.content || item.answer || "").trim(),
          });
        }
      }
    }
  }
  if (Array.isArray(node.children)) {
    for (let i = 0; i < node.children.length; i += 1) {
      const c = node.children[i];
      if (!c || typeof c !== "object") continue;
      if (node.type === "Accordion" && (c.type === "Heading" || c.type === "Card")) {
        const q = c.props?.title || c.text || "";
        const nextNode = node.children[i + 1];
        const a = c.props?.content || nextNode?.text || "";
        if (q && a) {
          out.push({ question: String(q).trim(), answer: String(a).trim() });
        }
      } else {
        extractFaqItemsFromLayout(c, out);
      }
    }
  }
  return out;
}

/**
 * Generates deterministic, XSS-safe, ADR-025c exact `schema.org` JSON-LD blocks.
 */
export function generateSchemaOrgJsonLd(input = {}) {
  const entry = input.entry && typeof input.entry === "object" ? input.entry : input;
  const siteCtx = input.site_context && typeof input.site_context === "object" ? input.site_context : {};
  const siteUrl = String(input.site_url || siteCtx.site_url || "https://example.com").trim();
  if (!isSafeUrl(siteUrl)) {
    throw new GrexSecurityError(`Unsafe site_url rejected in schema.org generator: ${siteUrl}`);
  }
  const siteName = String(input.site_name || siteCtx.site_name || "GrabLab Site").trim();
  const entryPath = normalizeInternalPath(String(entry.full_path || entry.path || (entry.slug ? `/${entry.slug}` : "/"))) || "/";
  const canonicalUrl = resolveCanonicalUrl(siteUrl, entry.canonical_url || entryPath);
  const title = String(entry.meta_title || entry.title || siteName).trim();
  const description = String(entry.meta_description || entry.excerpt || stripTags(entry.body_html || "")).trim().slice(0, 320);

  const requestedTypes = [];
  if (Array.isArray(input.schema_types) && input.schema_types.length > 0) {
    for (const t of input.schema_types) requestedTypes.push(String(t).trim());
  } else if (input.schema_type) {
    requestedTypes.push(String(input.schema_type).trim());
  } else {
    const ct = String(entry.content_type || entry.content_type_slug || "").toLowerCase();
    const hasPrice =
      input.product ||
      entry.custom_fields?.price !== undefined ||
      entry.custom_fields?.featured_price !== undefined;
    if (ct === "product" || hasPrice) requestedTypes.push("Product");
    else if (ct === "post" || ct === "blog") requestedTypes.push("BlogPosting");
    else requestedTypes.push("Article");
  }

  const faqItems = Array.isArray(input.faq_items)
    ? input.faq_items
    : extractFaqItemsFromLayout(entry.grex_layout || input.grex_layout, []);
  if (!input.schema_type && !Array.isArray(input.schema_types) && faqItems.length > 0 && !requestedTypes.includes("FAQPage")) {
    requestedTypes.push("FAQPage");
  }
  if (input.include_breadcrumbs && !requestedTypes.includes("BreadcrumbList")) {
    requestedTypes.push("BreadcrumbList");
  }
  if (input.include_website && !requestedTypes.includes("WebSite")) {
    requestedTypes.push("WebSite");
  }

  const entities = [];
  const typesGenerated = [];
  let decimalVerified = true;

  for (const typeName of requestedTypes) {
    if (typeName === "Article" || typeName === "BlogPosting") {
      const entity = {
        "@type": typeName,
        headline: title,
        description,
        url: canonicalUrl,
        mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
        author: {
          "@type": "Person",
          name: String(entry.author_name || entry.author || siteName),
        },
        publisher: {
          "@type": "Organization",
          name: siteName,
        },
      };
      if (entry.published_at) entity.datePublished = String(entry.published_at);
      if (entry.updated_at) entity.dateModified = String(entry.updated_at);
      if (entry.featured_image && isSafeUrl(entry.featured_image)) {
        entity.image = resolveCanonicalUrl(siteUrl, entry.featured_image);
      }
      entities.push(entity);
      typesGenerated.push(typeName);
    } else if (typeName === "Product") {
      const prod = input.product && typeof input.product === "object" ? input.product : {};
      const cf = entry.custom_fields && typeof entry.custom_fields === "object" ? entry.custom_fields : {};
      const rawPrice =
        prod.price !== undefined
          ? prod.price
          : entry.offers?.price !== undefined
          ? entry.offers.price
          : cf.price !== undefined
          ? cf.price
          : cf.featured_price !== undefined
          ? cf.featured_price
          : cf.sale_price;

      const exactPrice = validateExactPriceField(rawPrice ?? "0.00", "Product.offers.price");
      decimalVerified = true;

      const currency = String(prod.currency || cf.currency || entry.offers?.priceCurrency || "USD").toUpperCase();
      const sku = String(prod.sku || cf.sku || entry.sku || entry.slug || "SKU-DEFAULT").trim();
      const availRaw = String(prod.availability || cf.availability || "InStock").trim();
      const availabilityUrl = availRaw.startsWith("http")
        ? availRaw
        : `https://schema.org/${availRaw}`;

      const entity = {
        "@type": "Product",
        name: String(prod.name || prod.title || title),
        description: String(prod.description || description),
        sku,
        url: canonicalUrl,
        offers: {
          "@type": "Offer",
          priceCurrency: currency,
          price: exactPrice,
          availability: availabilityUrl,
          url: canonicalUrl,
        },
      };
      entities.push(entity);
      typesGenerated.push("Product");
    } else if (typeName === "FAQPage") {
      const pairs = faqItems
        .map((q) => ({
          question: String(q?.question || q?.title || "").trim(),
          answer: String(q?.answer || q?.content || "").trim(),
        }))
        .filter((q) => q.question && q.answer);
      entities.push({
        "@type": "FAQPage",
        mainEntity: pairs.map((q) => ({
          "@type": "Question",
          name: q.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: q.answer,
          },
        })),
      });
      typesGenerated.push("FAQPage");
    } else if (typeName === "BreadcrumbList") {
      const rawCrumbs = Array.isArray(input.breadcrumbs) ? input.breadcrumbs : null;
      let crumbs;
      if (rawCrumbs && rawCrumbs.length > 0) {
        crumbs = rawCrumbs.map((c, idx) => ({
          "@type": "ListItem",
          position: idx + 1,
          name: String(c.name || c.label || `Step ${idx + 1}`).trim(),
          item: resolveCanonicalUrl(siteUrl, c.url || c.path || "/"),
        }));
      } else {
        const segments = entryPath.split("/").filter(Boolean);
        crumbs = [
          { "@type": "ListItem", position: 1, name: "Home", item: resolveCanonicalUrl(siteUrl, "/") },
        ];
        let acc = "";
        segments.forEach((seg, idx) => {
          acc += `/${seg}`;
          crumbs.push({
            "@type": "ListItem",
            position: idx + 2,
            name: idx === segments.length - 1 ? title : seg.replace(/-/g, " "),
            item: resolveCanonicalUrl(siteUrl, acc),
          });
        });
      }
      entities.push({
        "@type": "BreadcrumbList",
        itemListElement: crumbs,
      });
      typesGenerated.push("BreadcrumbList");
    } else if (typeName === "WebSite") {
      entities.push({
        "@type": "WebSite",
        name: siteName,
        url: resolveCanonicalUrl(siteUrl, "/"),
        potentialAction: {
          "@type": "SearchAction",
          target: `${resolveCanonicalUrl(siteUrl, "/")}?search={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      });
      typesGenerated.push("WebSite");
    } else {
      throw new GrexSecurityError(
        `Unsupported schema.org type "${typeName}". Supported: Article, BlogPosting, Product, FAQPage, BreadcrumbList, WebSite.`
      );
    }
  }

  const jsonLdObj =
    entities.length === 1
      ? { "@context": "https://schema.org", ...entities[0] }
      : { "@context": "https://schema.org", "@graph": entities };

  const rawSerialized = JSON.stringify(jsonLdObj, null, 2);
  const escapedJsonLd = escapeJsonLdForScript(rawSerialized);

  return {
    schema_version: "0.4.0",
    read_only: true,
    types_generated: typesGenerated,
    decimal_integrity_verified: decimalVerified,
    xss_safe: true,
    json_ld: jsonLdObj,
    json_ld_escaped: escapedJsonLd,
    script_tag_payload: `<script type="application/ld+json">\n${escapedJsonLd}\n</script>`,
  };
}

export function isFilenameAltText(altText) {
  const clean = String(altText || "").trim();
  if (!clean) return false;
  if (/\.(jpe?g|png|webp|gif|svg|avif|bmp|tiff?)$/i.test(clean)) return true;
  if (/^(img|dsc|pxl|screenshot|photo|image|pic)[_-]?\d+/i.test(clean)) return true;
  if (/^(image|photo|picture|untitled|alt|placeholder|img)$/i.test(clean)) return true;
  return false;
}

function synthesizeDescriptiveAlt(item) {
  const caption = String(item.caption || "").trim();
  const contextTitle = String(item.context_entry_title || item.entry_title || "").trim();
  const rawName = String(item.original_name || item.filename || "media asset")
    .replace(/\.[a-z0-9]{2,5}$/i, "")
    .replace(/^(img|dsc|pxl|screenshot)[_-]?/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  let candidate = "";
  if (caption && caption.length >= 12) {
    candidate = caption;
  } else if (contextTitle && rawName && !/^\d+$/.test(rawName)) {
    candidate = `${contextTitle} — ${rawName}`;
  } else if (contextTitle) {
    candidate = `Editorial photograph illustrating ${contextTitle}`;
  } else if (rawName && !/^\d+$/.test(rawName)) {
    const words = rawName
      .split(" ")
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1));
    candidate = `Visual asset showing ${words.join(" ")}`;
  } else {
    candidate = "High-resolution editorial product and layout photograph";
  }

  candidate = candidate.replace(/\s+/g, " ").trim();
  if (candidate.length > 125) {
    candidate = candidate.slice(0, 122).replace(/\s+\S*$/, "").trim();
  }
  if (candidate.length < 12) {
    candidate = `${candidate} photography`.trim();
  }
  return candidate;
}

/**
 * Audits Media Library assets for missing / filename-as-alt values while preserving
 * `decorative: true` / `is_decorative: true` items with `alt: ""` and `aria-hidden: "true"`.
 */
export function analyzeMediaAltText(input = {}, tokenStore = null) {
  const mediaList = Array.isArray(input?.media) ? input.media : Array.isArray(input) ? input : [];
  const proposals = [];
  let needsApprovalCount = 0;
  let decorativePreservedCount = 0;
  let validAltCount = 0;

  for (const item of mediaList) {
    if (!item || typeof item !== "object") continue;
    const mediaId = item.id ?? item.media_id ?? item.filename;
    const filename = String(item.filename || item.original_name || `media-${mediaId}`).trim();
    const currentAlt = String(item.alt_text ?? item.alt ?? "").trim();
    const isDecorative = Boolean(item.decorative || item.is_decorative || item.isDecorative);

    if (isDecorative) {
      decorativePreservedCount += 1;
      proposals.push({
        media_id: mediaId,
        filename,
        url: String(item.url || ""),
        decorative: true,
        is_decorative: true,
        current_alt: "",
        proposed_alt: "",
        aria_hidden: "true",
        status: "decorative_preserved",
        needs_enrichment: false,
        reason: 'Decorative image intentionally preserves empty alt="" and aria-hidden="true" per WCAG AA.',
      });
      continue;
    }

    const isFilename = isFilenameAltText(currentAlt);
    const tooShort = currentAlt.length > 0 && currentAlt.length < 3;
    const tooLong = currentAlt.length > 125;

    if (!currentAlt || isFilename || tooShort || tooLong) {
      needsApprovalCount += 1;
      const proposedAlt = synthesizeDescriptiveAlt(item);
      proposals.push({
        media_id: mediaId,
        filename,
        url: String(item.url || ""),
        decorative: false,
        is_decorative: false,
        current_alt: currentAlt,
        proposed_alt: proposedAlt,
        status: "needs_approval",
        needs_enrichment: true,
        approval_required: true,
        issue: !currentAlt
          ? "missing_alt_text"
          : isFilename
          ? "filename_as_alt_text"
          : "alt_length_out_of_range",
        reason: !currentAlt
          ? `Image "${filename}" has empty alt text.`
          : isFilename
          ? `Current alt text "${currentAlt}" exposes a raw filename instead of descriptive content.`
          : `Current alt text length (${currentAlt.length}) violates 3-125 character guideline.`,
      });
    } else {
      validAltCount += 1;
      proposals.push({
        media_id: mediaId,
        filename,
        url: String(item.url || ""),
        decorative: false,
        is_decorative: false,
        current_alt: currentAlt,
        proposed_alt: currentAlt,
        status: "ok",
        needs_enrichment: false,
      });
    }
  }

  const approvalToken = needsApprovalCount > 0 ? generateToken("altok_") : null;
  const plan = {
    schema_version: "0.4.0",
    read_only: true,
    mutates_live_cms: false,
    approval_required: needsApprovalCount > 0,
    approval_token: approvalToken,
    summary: {
      total_scanned: proposals.length,
      needs_enrichment: needsApprovalCount,
      decorative_preserved: decorativePreservedCount,
      already_valid: validAltCount,
    },
    items: proposals,
  };

  if (tokenStore && approvalToken) {
    tokenStore.set(approvalToken, {
      used: false,
      created_at: new Date().toISOString(),
      proposalsById: new Map(
        proposals.map((p) => [String(p.media_id), p])
      ),
    });
  }

  return plan;
}

/**
 * Single-use approval validator & applier for Media `alt`-text updates.
 */
export function approveMediaAltEnrichment(payload = {}, tokenStore) {
  const token = String(payload?.approval_token || "").trim();
  if (!token) {
    return { ok: false, status: 403, error: "approval_token is required for media alt approval." };
  }
  if (!tokenStore || !tokenStore.has(token)) {
    return { ok: false, status: 403, error: "Invalid or expired single-use approval_token." };
  }
  const entry = tokenStore.get(token);
  if (entry.used) {
    return { ok: false, status: 409, error: "approval_token has already been consumed (replay rejected)." };
  }

  const updates = Array.isArray(payload.updates)
    ? payload.updates
    : Array.isArray(payload.items)
    ? payload.items
    : [];

  if (updates.length === 0) {
    return { ok: false, status: 400, error: "At least one approved media alt item is required." };
  }

  const approved = [];
  let preservedDecorative = 0;

  for (const upd of updates) {
    const idKey = String(upd.media_id ?? upd.id ?? "");
    const existing = entry.proposalsById.get(idKey);
    if (!existing) continue;

    if (existing.decorative) {
      preservedDecorative += 1;
      approved.push({
        media_id: existing.media_id,
        filename: existing.filename,
        decorative: true,
        alt_text: "",
        aria_hidden: "true",
        status: "decorative_preserved",
      });
      continue;
    }

    const finalAlt = String(upd.alt_text ?? upd.proposed_alt ?? existing.proposed_alt ?? "").trim();
    if (finalAlt.length < 3 || finalAlt.length > 125 || isFilenameAltText(finalAlt)) {
      return {
        ok: false,
        status: 422,
        error: `Rejected invalid alt_text "${finalAlt}" for "${existing.filename}" (must be descriptive, 3-125 chars).`,
      };
    }

    approved.push({
      media_id: existing.media_id,
      filename: existing.filename,
      decorative: false,
      alt_text: finalAlt,
      status: "approved",
    });
  }

  entry.used = true;
  entry.consumed_at = new Date().toISOString();

  return {
    ok: true,
    status: 200,
    approval_token: token,
    single_use_consumed: true,
    approved_count: approved.filter((a) => a.status === "approved").length,
    preserved_decorative_count: preservedDecorative,
    approved_items: approved,
  };
}

/**
 * Quiet background Morning Boost Report (`Groxy Nightly Watch`) — zero popups, zero silent edits.
 */
export function buildNightlyWatchDigest(input = {}) {
  const snapshot =
    input?.snapshot && Array.isArray(input.snapshot.entries)
      ? input.snapshot
      : buildSiteContextSnapshot(input?.site_context || input);
  const linkReport = input?.link_report || analyzeInternalLinkingGraph({ snapshot });
  const mediaReport = input?.media_report || analyzeMediaAltText({ media: input?.media || input?.site_context?.media || [] });

  const entriesMissingMeta = snapshot.entries.filter((e) => !e.meta_description || e.meta_description.length < 50);
  const orphanCount = linkReport.summary.orphan_count;
  const loopCount = linkReport.summary.redirect_loop_count;
  const chainCount = linkReport.summary.redirect_chain_count;
  const brokenCount = linkReport.summary.broken_link_count;
  const mediaMissingAltCount = mediaReport.summary.needs_enrichment;

  let penalty =
    orphanCount * 7 +
    loopCount * 15 +
    chainCount * 4 +
    brokenCount * 10 +
    mediaMissingAltCount * 6 +
    entriesMissingMeta.length * 4;

  const siteHealthScore = Math.max(0, Math.min(100, 100 - penalty));
  const overallGrade = scoreToGrade(siteHealthScore, siteHealthScore >= 90 && loopCount === 0 && brokenCount === 0);

  const opportunities = [];
  if (orphanCount > 0) {
    opportunities.push({
      id: "boost-orphan-links",
      category: "internal_linking",
      priority: "high",
      title: `Connect ${orphanCount} orphan page${orphanCount === 1 ? "" : "s"} with internal links`,
      plain_english: `${orphanCount} published route(s) have 0 incoming links. Adding contextual descriptive links transfers authority safely.`,
      cta_label: "🚀 Let Groxy Boost This",
      action_endpoint: "/api/groxy/links/analyze",
      non_intrusive: true,
    });
  }
  if (mediaMissingAltCount > 0) {
    opportunities.push({
      id: "boost-media-alt",
      category: "accessibility",
      priority: "high",
      title: `Enrich ${mediaMissingAltCount} image alt attribute${mediaMissingAltCount === 1 ? "" : "s"}`,
      plain_english: `${mediaMissingAltCount} non-decorative asset(s) are missing descriptive alt text or expose raw filenames.`,
      cta_label: "🚀 Let Groxy Boost This",
      action_endpoint: "/api/groxy/media/enrich-alt",
      non_intrusive: true,
    });
  }
  if (loopCount > 0 || brokenCount > 0 || chainCount > 0) {
    opportunities.push({
      id: "boost-redirects-links",
      category: "technical_seo",
      priority: loopCount > 0 || brokenCount > 0 ? "critical" : "medium",
      title: `Resolve ${loopCount} 301 loop(s), ${brokenCount} broken link(s), ${chainCount} chain(s)`,
      plain_english: "Repairing broken internal paths and multi-hop or cyclic 301 redirects protects crawl equity.",
      cta_label: "🚀 Let Groxy Boost This",
      action_endpoint: "/api/groxy/links/analyze",
      non_intrusive: true,
    });
  }
  if (entriesMissingMeta.length > 0 || snapshot.entries.length > 0) {
    opportunities.push({
      id: "boost-schema-meta",
      category: "structured_data",
      priority: entriesMissingMeta.length > 0 ? "medium" : "low",
      title: `Generate XSS-safe schema.org JSON-LD across ${snapshot.entries.length} indexed entries`,
      plain_english: "Add deterministic Article, Product (ADR-025c exact price), and FAQPage JSON-LD previews.",
      cta_label: "🚀 Let Groxy Boost This",
      action_endpoint: "/api/groxy/schema/generate",
      non_intrusive: true,
    });
  }

  return {
    schema_version: "0.4.0",
    digest_name: "Morning Boost Report",
    generated_at: new Date().toISOString(),
    notification_mode: "quiet_digest",
    popups: false,
    silent_edits: false,
    mutates_live_cms: false,
    site_name: snapshot.site_name,
    site_health_score: siteHealthScore,
    overall_grade: overallGrade,
    metrics: {
      indexed_entries: snapshot.counts.entries,
      orphan_pages: orphanCount,
      redirect_loops: loopCount,
      redirect_chains: chainCount,
      broken_links: brokenCount,
      generic_anchors: linkReport.summary.generic_anchor_count,
      missing_or_filename_alt_media: mediaMissingAltCount,
      decorative_media_preserved: mediaReport.summary.decorative_preserved,
      entries_needing_meta_description: entriesMissingMeta.length,
    },
    boost_opportunities: opportunities,
  };
}

/**
 * Exports a portable Site DNA snapshot for Gashboard & grabman combining
 * `GRAB-DESIGN-SYSTEM.md` + `SITE-CONTEXT.md` + active Style Pack tokens + Morning Boost digest.
 */
export function buildPortableSiteDna(input = {}) {
  const snapshot =
    input?.snapshot && Array.isArray(input.snapshot.entries)
      ? input.snapshot
      : buildSiteContextSnapshot(input?.site_context || input);
  const siteContextMd = input?.site_context_md || renderSiteContextMarkdown(snapshot);
  const designSystemMd = String(input?.design_system_md || "");
  const parsedDesignSystem = designSystemMd ? parseDesignSystemMarkdown(designSystemMd) : null;
  const packId = String(input?.style_pack || "emerald-editorial").trim();
  const packCatalog = listStylePacks();
  const activeStylePack =
    packCatalog.style_packs.find((p) => p.id === packId) ||
    packCatalog.style_packs.find((p) => p.id === "emerald-editorial") ||
    STYLE_PACKS["emerald-editorial"];
  const digest = input?.nightly_watch_digest || buildNightlyWatchDigest({ snapshot, media: input?.media });

  return {
    schema_version: "0.4.0",
    bundle_name: "groxy-site-dna-v0.4.0",
    exported_at: new Date().toISOString(),
    read_only_snapshot: true,
    compatible_consumers: ["gashboard", "grabman", "grex-builder", "grablab-cms"],
    site_name: snapshot.site_name,
    site_url: snapshot.site_url,
    active_style_pack: activeStylePack,
    design_system: {
      raw_markdown: designSystemMd,
      tokens_loaded: parsedDesignSystem?.tokens_loaded || 0,
      reusable_classes_loaded: parsedDesignSystem?.reusable_classes_loaded || 0,
      tokens: parsedDesignSystem?.allTokens || parsedDesignSystem?.tokens || {},
      reusable_classes: Object.keys(parsedDesignSystem?.reusableClasses || {}),
    },
    site_context: {
      counts: snapshot.counts,
      products: snapshot.products,
      redirects: snapshot.redirects,
      markdown: siteContextMd,
    },
    nightly_watch_digest: digest,
    decimal_integrity_verified: snapshot.decimal_integrity_verified,
  };
}

export function renderPortableSiteDnaMarkdown(dna) {
  return [
    `# Groxy Site DNA Export (${dna.schema_version})`,
    "",
    `- **Site:** ${dna.site_name} (${dna.site_url})`,
    `- **Active Style Pack:** \`${dna.active_style_pack?.id || "emerald-editorial"}\` (${dna.active_style_pack?.label || ""})`,
    `- **Health Score:** ${dna.nightly_watch_digest?.site_health_score ?? "N/A"}/100 (Grade ${dna.nightly_watch_digest?.overall_grade ?? "N/A"})`,
    `- **Compatible Consumers:** ${(dna.compatible_consumers || []).join(", ")}`,
    "",
    "---",
    "",
    dna.site_context?.markdown || "",
    dna.design_system?.raw_markdown ? `\n---\n\n${dna.design_system.raw_markdown}\n` : "",
  ].join("\n");
}
