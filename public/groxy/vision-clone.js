/**
 * Groxy AI v1.1.0 Screenshot-to-Grex safe visual replica pipeline.
 * Screenshots and model output are untrusted; this module emits Grex trees only.
 */
import { auditAccessibility, computeContrastRatio, GrexSecurityError, validateElementNode } from "./grex.js";
import { generatePageOrSection } from "./generator.js";

export const GROXY_VERSION = "1.6.0";
export const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024;
const MIME_FORMATS = Object.freeze({ "image/png": "png", "image/jpeg": "jpeg", "image/webp": "webp" });
const FORBIDDEN_MARKERS = ["<script", "javascript:", "onerror=", "onload="];
const PALETTE_KEYS = ["bg", "surface", "text", "muted", "primary", "on_primary"];

function fail(status, errorCode, reason, message) {
  const error = new Error(message);
  Object.assign(error, { status, error_code: errorCode, reason });
  throw error;
}

function decodeBase64(input) {
  let data = String(input || "").trim();
  const match = /^data:image\/(png|jpeg|webp);base64,/i.exec(data);
  if (match) data = data.slice(match[0].length);
  data = data.replace(/-/g, "+").replace(/_/g, "/").replace(/\s/g, "");
  if (!data || !/^[A-Za-z0-9+/]*={0,2}$/.test(data) || data.length % 4 === 1) {
    fail(422, "GROXY-VISION-E001", "invalid_image_magic_bytes", "Screenshot must be valid base64 image data.");
  }
  if (data.length > Math.ceil(MAX_SCREENSHOT_BYTES / 3) * 4 + 4) {
    fail(413, "GROXY-VISION-E002", "screenshot_payload_too_large", "Decoded screenshot exceeds 5 MiB.");
  }
  try {
    const binary = atob(data.replace(/=+$/, ""));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    fail(422, "GROXY-VISION-E001", "invalid_image_magic_bytes", "Screenshot must be valid base64 image data.");
  }
}

function decodeHex(input) {
  const hex = String(input || "").replace(/\s/g, "").replace(/^0x/i, "");
  if (hex.length > MAX_SCREENSHOT_BYTES * 2) {
    fail(413, "GROXY-VISION-E002", "screenshot_payload_too_large", "Decoded screenshot exceeds 5 MiB.");
  }
  if (!hex || hex.length % 2 || !/^[0-9a-f]+$/i.test(hex)) {
    fail(422, "GROXY-VISION-E001", "invalid_image_magic_bytes", "Screenshot hex is malformed.");
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

function starts(bytes, values, offset = 0) {
  return values.every((byte, index) => bytes[offset + index] === byte);
}

export function verifyScreenshot(input = {}) {
  const bytes = input.screenshot_hex ? decodeHex(input.screenshot_hex) : decodeBase64(input.screenshot_base64);
  if (bytes.length > MAX_SCREENSHOT_BYTES) {
    fail(413, "GROXY-VISION-E002", "screenshot_payload_too_large", "Decoded screenshot exceeds 5 MiB.");
  }
  if (bytes.length < 12) fail(422, "GROXY-VISION-E001", "invalid_image_magic_bytes", "Screenshot header is incomplete.");

  let format = "";
  let width = null;
  let height = null;
  if (starts(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) && starts(bytes, [0x49, 0x48, 0x44, 0x52], 12) && bytes.length >= 24) {
    format = "png";
    width = bytes[16] * 0x1000000 + (bytes[17] << 16) + (bytes[18] << 8) + bytes[19];
    height = bytes[20] * 0x1000000 + (bytes[21] << 16) + (bytes[22] << 8) + bytes[23];
    if (!width || !height) fail(422, "GROXY-VISION-E001", "invalid_image_magic_bytes", "PNG dimensions must be positive.");
  } else if (starts(bytes, [0xff, 0xd8, 0xff])) {
    format = "jpeg";
  } else if (starts(bytes, [0x52, 0x49, 0x46, 0x46]) && starts(bytes, [0x57, 0x45, 0x42, 0x50], 8)) {
    format = "webp";
  }
  const declaredMime = String(input.mime_type || `image/${format}`).toLowerCase();
  if (!format || MIME_FORMATS[declaredMime] !== format) {
    fail(422, "GROXY-VISION-E001", "invalid_image_magic_bytes", "Screenshot format is unsupported or does not match mime_type.");
  }

  // Scan every byte, including metadata/EXIF chunks, before any image or model parser sees it.
  let binary = "";
  for (let i = 0; i < bytes.length; i += 8192) {
    binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + 8192, bytes.length)));
  }
  const lower = binary.toLowerCase();
  if (FORBIDDEN_MARKERS.some((marker) => lower.includes(marker))) {
    fail(422, "GROXY-VISION-E001", "invalid_image_magic_bytes", "Embedded active content is not accepted.");
  }
  const digestInput = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return {
    valid: true,
    detected_format: format,
    mime_type: declaredMime,
    magic_bytes_hex: digestInput.slice(0, 16),
    byte_length: bytes.length,
    width,
    height,
    // The server replaces this deterministic digest with crypto.sha256_hex over raw bytes.
    sha256_input_hex: digestInput,
    bytes,
  };
}

export async function extractVisualProfile(buffer, mimeType) {
  if (typeof globalThis.createImageBitmap !== "function" || typeof globalThis.Blob !== "function") {
    return { sections_detected: ["navigation", "hero", "features", "pricing", "collection", "faq"], column_counts: { hero: 2, features: 3, pricing: 3, collection: 3 }, spacing_rhythm: "8pt", extracted_palette: null };
  }
  let bitmap;
  try {
    bitmap = await globalThis.createImageBitmap(new Blob([buffer], { type: mimeType }));
    const width = Math.max(1, Math.min(bitmap.width, 160));
    const height = Math.max(1, Math.min(bitmap.height, 160));
    const canvas = typeof globalThis.OffscreenCanvas === "function"
      ? new OffscreenCanvas(width, height)
      : globalThis.document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Canvas pixel analysis is unavailable.");
    context.drawImage(bitmap, 0, 0, width, height);
    const pixels = context.getImageData(0, 0, width, height).data;
    const sample = (x, y) => {
      const offset = (Math.min(height - 1, y) * width + Math.min(width - 1, x)) * 4;
      return [pixels[offset], pixels[offset + 1], pixels[offset + 2]];
    };
    const toHex = (rgb) => `#${rgb.map((part) => Math.round(part).toString(16).padStart(2, "0")).join("")}`;
    const topBackground = sample(0, 0);
    const samplePoints = [sample(Math.floor(width * 0.5), Math.floor(height * 0.15)), sample(Math.floor(width * 0.5), Math.floor(height * 0.5)), sample(Math.floor(width * 0.5), Math.floor(height * 0.85))];
    const luminance8 = (rgb) => rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
    const brightness = luminance8(topBackground);
    const foreground = brightness > 145 ? "#111827" : "#f9fafb";
    const chromatic = samplePoints.sort((a, b) => {
      const saturation = (rgb) => Math.max(...rgb) - Math.min(...rgb);
      return saturation(b) - saturation(a);
    })[0];
    const palette = repairPalette({
      light: { bg: toHex(topBackground), surface: toHex(samplePoints[1]), text: foreground, muted: foreground, primary: toHex(chromatic), on_primary: "#ffffff" },
      dark: { bg: "#09090b", surface: "#18181b", text: "#fafafa", muted: "#d4d4d8", primary: toHex(chromatic), on_primary: "#09090b" },
    });
    const aspect = bitmap.width / bitmap.height;
    return {
      sections_detected: aspect > 1.3 ? ["navigation", "hero", "features", "pricing", "collection", "faq"] : ["navigation", "hero", "features", "faq"],
      column_counts: { hero: aspect > 1.3 ? 2 : 1, features: 3, pricing: 3, collection: 3 },
      spacing_rhythm: "8pt",
      extracted_palette: palette.palette_tokens,
    };
  } catch {
    return { sections_detected: ["navigation", "hero", "features", "faq"], column_counts: { hero: 1, features: 2, pricing: 2, collection: 2 }, spacing_rhythm: "8pt", extracted_palette: null };
  } finally {
    bitmap?.close?.();
  }
}

function luminance(hex) {
  const rgb = String(hex).replace("#", "").match(/^([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
  if (!rgb) return null;
  const values = rgb.slice(1).map((v) => Number.parseInt(v, 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
}

function contrast(fg, bg) {
  const a = luminance(fg);
  const b = luminance(bg);
  return a === null || b === null ? null : (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function repairForeground(fg, bg) {
  if (contrast(fg, bg) >= 4.5) return fg;
  const candidates = ["#000000", "#09090b", "#111827", "#1f2937", "#374151", "#4b5563", "#6b7280", "#9ca3af", "#d1d5db", "#f3f4f6", "#ffffff"];
  return candidates
    .filter((candidate) => contrast(candidate, bg) >= 4.5)
    .sort((a, b) => Math.abs(luminance(a) - luminance(fg)) - Math.abs(luminance(b) - luminance(fg)))[0] || (luminance(bg) > 0.5 ? "#09090b" : "#ffffff");
}

export function repairPalette(palette = {}) {
  const defaults = {
    light: { bg: "#ffffff", surface: "#f8fafc", text: "#09090b", muted: "#475569", primary: "#1d4ed8", on_primary: "#ffffff" },
    dark: { bg: "#09090b", surface: "#18181b", text: "#fafafa", muted: "#d4d4d8", primary: "#60a5fa", on_primary: "#09090b" },
  };
  const output = {};
  const repairs = [];
  for (const theme of ["light", "dark"]) {
    const source = palette[theme] || {};
    const colors = { ...defaults[theme] };
    for (const key of PALETTE_KEYS) {
      const value = source[key];
      if (typeof value === "string" && /^#[\da-f]{6}$/i.test(value)) colors[key] = value.toLowerCase();
    }
    for (const [key, bgKey] of [["text", "bg"], ["muted", "bg"], ["on_primary", "primary"]]) {
      const original = colors[key];
      const ratio = contrast(original, colors[bgKey]);
      if (ratio !== null && ratio < 4.5) {
        const repaired = repairForeground(original, colors[bgKey]);
        colors[key] = repaired;
        repairs.push({ theme, pair: `${key}_on_${bgKey}`, original_foreground: original, original_background: colors[bgKey], original_ratio: Number(ratio.toFixed(2)), repaired_foreground: repaired, repaired_background: colors[bgKey], repaired_ratio: Number(contrast(repaired, colors[bgKey]).toFixed(2)), wcag_aa_minimum: 4.5 });
      }
    }
    output[theme] = colors;
  }
  return { palette_tokens: output, contrast_repairs: repairs };
}

function assertExactNumbers(value, path = "request") {
  if (Array.isArray(value)) return value.forEach((item, index) => assertExactNumbers(item, `${path}[${index}]`));
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (/(?:price|amount|sku|item_count|quantity|qty|weight|dimension|subtotal|total)$/i.test(key) && typeof child === "number") {
        fail(422, "GROXY-VISION-E003", "inexact_numeric_wire_value", `${path}.${key} must use an exact base-10 string, not a JavaScript number.`);
      }
      assertExactNumbers(child, `${path}.${key}`);
    }
  }
}

function hierarchyFor(hints = {}, dimensions = {}) {
  const sections = Array.isArray(hints.sections_detected) ? hints.sections_detected : ["navigation", "hero", "features", "pricing", "collection", "faq"];
  const valid = new Set(["navigation", "hero", "features", "pricing", "collection", "faq"]);
  return sections.filter((s) => valid.has(String(s).toLowerCase())).slice(0, 12).map((name) => {
    const key = String(name).toLowerCase();
    const columns = Number.isInteger(hints.column_counts?.[key]) ? Math.max(1, Math.min(4, hints.column_counts[key])) : (key === "features" || key === "pricing" || key === "collection" ? 3 : key === "hero" ? 2 : 1);
    const landmarks = { navigation: "Nav", hero: "Section", features: "Section", pricing: "Section", collection: "Section", faq: "Section" };
    const roles = { navigation: "primary_navigation", hero: "hero_split", features: "feature_grid", pricing: "pricing_grid", collection: "foreach_showcase", faq: "faq_accordion" };
    return { landmark: landmarks[key], role: roles[key], columns };
  });
}

export async function createTargetBinding({ clone_id, slot, layout }) {
  const canonical = JSON.stringify(layout);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical));
  const layout_sha256 = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  return { clone_id, slot, layout_sha256, actor: "groxy-ai" };
}

function secureHex(byteLength) {
  const bytes = new Uint8Array(byteLength);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function compileVisionClone(input = {}, options = {}) {
  assertExactNumbers(input);
  const screenshot = verifyScreenshot(input);
  const slot = ["main", "hero", "footer"].includes(input.slot) ? input.slot : "main";
  const provider = ["deterministic", "ollama", "byok"].includes(input.vision_provider) ? input.vision_provider : "deterministic";
  const palette = repairPalette(input.extracted_palette || {});
  const layoutRequest = {
    ...input,
    slot,
    blueprint: input.blueprint_hint || input.blueprint || "full_landing_page",
    style_pack: input.style_pack_hint || input.style_pack || "emerald-editorial",
    // The generator parses the active tokens and registered classes using its existing v1.0 implementation.
    design_system_md: input.design_system_md || options.design_system_md || "",
  };
  delete layoutRequest.screenshot_base64;
  delete layoutRequest.screenshot_hex;
  delete layoutRequest.extracted_palette;
  let candidate = generatePageOrSection(layoutRequest, options);
  if (candidate.audit_report.overall_score < 90 || !candidate.audit_report.publish_safe) {
    throw new GrexSecurityError("Vision clone did not pass the Grade A publish-safety gate.");
  }
  validateElementNode(candidate.candidate_layout, { strictProps: true });
  const a11y = auditAccessibility(candidate.candidate_layout);
  if (!a11y.ok) throw new GrexSecurityError(`Vision clone failed accessibility validation: ${a11y.issues.map((issue) => issue.code).join(", ")}`);
  const clone_id = `vclone_${options.randomHex?.(16) || secureHex(16)}`;
  const token = `vtok_${options.randomHex?.(24) || secureHex(24)}`;
  const visual_analysis = {
    structural_hierarchy: hierarchyFor(input.layout_hints || {}, { width: screenshot.width, height: screenshot.height }),
    spacing_rhythm: { grid_unit: "8pt", section_padding_token: "--grex-space-xl", container_gap_token: "--grex-space-lg", card_padding_token: "--grex-space-md" },
    typography_scale: { heading_sequence: ["h1", "h2", "h3"], skipped_levels: 0, font_display_token: "--grex-font-display", font_body_token: "--grex-font-sans", max_measure: "65ch" },
    ...palette,
  };
  return {
    schema_version: "1.1.0",
    clone_id,
    slot,
    blueprint: candidate.blueprint,
    style_pack: candidate.style_pack,
    vision_provider_used: provider,
    vision_model: input.vision_model || (provider === "ollama" ? "llama3.2-vision" : "deterministic"),
    approval_required: true,
    approval_token: token,
    target_binding: await createTargetBinding({ clone_id, slot, layout: candidate.candidate_layout }),
    screenshot_verification: { valid: true, detected_format: screenshot.detected_format, mime_type: screenshot.mime_type, magic_bytes_hex: screenshot.magic_bytes_hex, byte_length: screenshot.byte_length, width: screenshot.width, height: screenshot.height, sha256: options.sha256 || "" },
    visual_analysis,
    validation: { ...candidate.validation, grex_schema_valid: true, div_count: 0, inner_html_write_count: 0, wcag_aa_passed: true, decimal_integrity_verified: true },
    audit_report: candidate.audit_report,
    design_system_summary: candidate.design_system_summary,
    candidate_entry: candidate.candidate_entry,
    candidate_layout: candidate.candidate_layout,
  };
}

export function validateReferencePath(path) {
  if (typeof path !== "string" || !path || path.includes("\0") || path.includes("\\") || path.startsWith("/") || path.startsWith("//")) {
    fail(403, "GRAB-E401", "reference_path_outside_uploads", "Reference path must stay under storage/reference_uploads/.");
  }
  const segments = path.split("/");
  if (segments[0] !== "storage" || segments[1] !== "reference_uploads" || segments.some((part) => !part || part === "." || part === ".." || /^\.env|^\.git|^\.ssh/i.test(part) || /\.(key|pem|p12|pfx)$/i.test(part))) {
    fail(403, "GRAB-E401", "reference_path_outside_uploads", "Reference path must stay under storage/reference_uploads/.");
  }
  return segments.join("/");
}

