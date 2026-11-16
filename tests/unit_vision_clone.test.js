import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  compileVisionClone,
  createTargetBinding,
  repairPalette,
  validateReferencePath,
  verifyScreenshot,
} from "../public/groxy/vision-clone.js";

function pngBytes(extra = []) {
  return Uint8Array.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52,
    0, 0, 5, 160, 0, 0, 3, 132, ...extra,
  ]);
}
const hex = (bytes) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

test("magic-byte verification accepts PNG, JPEG, and WebP and returns dimensions", () => {
  const png = verifyScreenshot({ screenshot_hex: hex(pngBytes()), mime_type: "image/png" });
  assert.equal(png.detected_format, "png");
  assert.equal(png.width, 1440);
  assert.equal(png.height, 900);
  assert.equal(verifyScreenshot({ screenshot_base64: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]).toString("base64"), mime_type: "image/jpeg" }).detected_format, "jpeg");
  assert.equal(verifyScreenshot({ screenshot_hex: "524946460000000057454250", mime_type: "image/webp" }).detected_format, "webp");
});

test("unsupported, forged, polyglot, and mismatched image payloads fail closed with 422", () => {
  for (const payload of [
    { screenshot_base64: Buffer.from("<svg></svg>").toString("base64"), mime_type: "image/svg+xml" },
    { screenshot_base64: Buffer.from("<html><script>").toString("base64"), mime_type: "image/png" },
    { screenshot_hex: hex(pngBytes(Array.from(Buffer.from("<script>alert(1)</script>")))), mime_type: "image/png" },
    { screenshot_hex: hex(pngBytes()), mime_type: "image/jpeg" },
    { screenshot_hex: "", mime_type: "image/png" },
  ]) {
    assert.throws(() => verifyScreenshot(payload), (error) => error.status === 422 && error.error_code === "GROXY-VISION-E001");
  }
});

test("5 MiB decoded payload cap returns 413", () => {
  const tooLarge = new Uint8Array(5 * 1024 * 1024 + 1);
  tooLarge.set(pngBytes());
  assert.throws(() => verifyScreenshot({ screenshot_hex: hex(tooLarge), mime_type: "image/png" }), (error) => error.status === 413 && error.error_code === "GROXY-VISION-E002");
});

test("Light and Dark palette repairs meet 4.5:1 and record before/after values", () => {
  const result = repairPalette({ light: { bg: "#ffffff", text: "#94a3b8" }, dark: { bg: "#09090b", text: "#27272a" } });
  assert.ok(result.contrast_repairs.length >= 2);
  for (const repair of result.contrast_repairs) assert.ok(repair.repaired_ratio >= 4.5);
});

test("path confinement accepts only storage/reference_uploads descendants", () => {
  assert.equal(validateReferencePath("storage/reference_uploads/ref.png"), "storage/reference_uploads/ref.png");
  for (const bad of ["../.env", "storage/reference_uploads/../.git/config", "storage/reference_uploads/secret.pem", "//server/share/ref.png", "C:\\outside.png"]) {
    assert.throws(() => validateReferencePath(bad), (error) => error.status === 403 && error.error_code === "GRAB-E401");
  }
});

test("compiled replica is zero-div, accessibility validated, and rejects JS float prices", async () => {
  const input = {
    screenshot_hex: hex(pngBytes()),
    mime_type: "image/png",
    blueprint_hint: "full_landing_page",
    style_pack_hint: "obsidian-tech",
    focus_keyword: "visual theme studio",
    topic_title: "Visual Theme Studio for High Velocity Teams",
  };
  const result = await compileVisionClone(input);
  assert.equal(result.schema_version, "1.1.0");
  assert.equal(result.validation.div_count, 0);
  assert.equal(result.validation.inner_html_write_count, 0);
  assert.equal(result.validation.wcag_aa_passed, true);
  assert.ok(result.audit_report.overall_score >= 90);
  assert.equal(result.audit_report.publish_safe, true);
  await assert.rejects(compileVisionClone({ ...input, pricing_tiers: [{ name: "Studio", price: 49.99 }] }), (error) => error.status === 422 && error.error_code === "GROXY-VISION-E003");
});

test("target binding uses a cryptographic SHA-256 layout digest", async () => {
  const layout = { type: "Section", children: [] };
  const binding = await createTargetBinding({ clone_id: "vclone_unit", slot: "main", layout });
  assert.equal(binding.layout_sha256, createHash("sha256").update(JSON.stringify(layout)).digest("hex"));
  assert.equal(binding.actor, "groxy-ai");
});
