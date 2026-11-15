import test from "node:test";
import assert from "node:assert/strict";

import {
  auditEntryAndLayout,
  isExactGrabDecimalString,
  isExactGrabIntegerString,
  scoreToGrade,
} from "../public/groxy/auditor.js";
import { EXPECTED_RULE_IDS } from "../public/groxy/playbook.js";
import { SAMPLE_AUDIT_PRESETS } from "../public/groxy/dashboard.js";

test("scoreToGrade enforces A+-F boundaries and publishSafe cap", () => {
  assert.equal(scoreToGrade(100, true), "A+");
  assert.equal(scoreToGrade(97, true), "A+");
  assert.equal(scoreToGrade(96, true), "A");
  assert.equal(scoreToGrade(90, true), "A");
  assert.equal(scoreToGrade(89, true), "B");
  assert.equal(scoreToGrade(80, true), "B");
  assert.equal(scoreToGrade(79, true), "C");
  assert.equal(scoreToGrade(70, true), "C");
  assert.equal(scoreToGrade(69, true), "D");
  assert.equal(scoreToGrade(60, true), "D");
  assert.equal(scoreToGrade(59, true), "F");
  assert.equal(scoreToGrade(98, false), "F");
});

test("deterministic audit produces byte-identical AuditReport across repeated runs and covers all 22 rules", () => {
  const input = {
    entry: SAMPLE_AUDIT_PRESETS.clean.entry,
    grex_layout: SAMPLE_AUDIT_PRESETS.clean.grex_layout,
    focus_keyword: SAMPLE_AUDIT_PRESETS.clean.entry.focus_keyword,
    internal_routes: ["/blog", "/guides", "/"],
  };

  const report1 = auditEntryAndLayout(input);
  const report2 = auditEntryAndLayout(input);

  assert.deepEqual(report1, report2);
  assert.equal(JSON.stringify(report1), JSON.stringify(report2));
  assert.equal(report1.schema_version, "0.1.0");
  assert.equal(report1.playbook_version, "1.0.0");
  assert.equal(report1.publish_safe, true);
  assert.ok(["A+", "A"].includes(report1.overall_grade));
  assert.ok(report1.overall_score >= 90);

  const findingIds = report1.findings.map((f) => f.rule_id);
  assert.deepEqual(findingIds, EXPECTED_RULE_IDS);
});

test("GROXY-DOM-001 wrapper <div> detection hard-caps score <= 59, overall_grade F, publish_safe false", () => {
  const report = auditEntryAndLayout({
    entry: {
      ...SAMPLE_AUDIT_PRESETS.clean.entry,
      slug: "clean-entry-with-div",
    },
    grex_layout: {
      element: "div",
      tag: "div",
      props: { id: "bad-wrapper" },
      children: [
        { element: "Heading", props: { id: "h1", level: 1, text: "Fast GRAB Themes" } },
      ],
    },
  });

  assert.equal(report.publish_safe, false);
  assert.equal(report.overall_grade, "F");
  assert.ok(report.overall_score <= 59);
  const dom001 = report.findings.find((f) => f.rule_id === "GROXY-DOM-001");
  assert.equal(dom001.severity, "critical");
  assert.equal(dom001.points_earned, 0);
});

test("GROXY-DOM-003 blocks unsafe <script>, javascript: hrefs, and inline onclick handlers with F cap", () => {
  const report = auditEntryAndLayout({
    entry: SAMPLE_AUDIT_PRESETS.clean.entry,
    grex_layout: {
      element: "Container",
      tag: "main",
      children: [
        { element: "Heading", props: { id: "h1", level: 1, text: "Fast GRAB Themes" } },
        {
          element: "Link",
          props: { id: "bad-link", href: "javascript:alert(1)", onclick: "hack()", text: "Click" },
        },
      ],
    },
  });

  assert.equal(report.publish_safe, false);
  assert.equal(report.overall_grade, "F");
  assert.ok(report.overall_score <= 59);
  const dom003 = report.findings.find((f) => f.rule_id === "GROXY-DOM-003");
  assert.equal(dom003.severity, "critical");
  assert.equal(dom003.points_earned, 0);
});

test("GROXY-SEO-008 preserves exact GrabDecimal strings and flags JS Number float drift", () => {
  assert.equal(isExactGrabDecimalString("19.95"), true);
  assert.equal(isExactGrabDecimalString("-0.01"), true);
  assert.equal(isExactGrabDecimalString("19.950000000000003"), false);
  assert.equal(isExactGrabIntegerString("42"), true);
  assert.equal(isExactGrabIntegerString("42.5"), false);

  const exactReport = auditEntryAndLayout({
    entry: {
      ...SAMPLE_AUDIT_PRESETS.clean.entry,
      custom_fields: { price: "19.95", stock: "12" },
    },
    grex_layout: SAMPLE_AUDIT_PRESETS.clean.grex_layout,
  });
  const seo008Pass = exactReport.findings.find((f) => f.rule_id === "GROXY-SEO-008");
  assert.equal(seo008Pass.severity, "pass");
  assert.equal(seo008Pass.points_earned, 5);

  const driftReport = auditEntryAndLayout({
    entry: {
      ...SAMPLE_AUDIT_PRESETS.clean.entry,
      custom_fields: { price: 19.95, noisy: 0.1 + 0.2 },
    },
    grex_layout: SAMPLE_AUDIT_PRESETS.clean.grex_layout,
  });
  const seo008Error = driftReport.findings.find((f) => f.rule_id === "GROXY-SEO-008");
  assert.equal(seo008Error.severity, "error");
  assert.equal(seo008Error.points_earned, 0);
});

test("GROXY-LINK-001..004 verify redirect history, anchor hygiene, orphan discoverability, and structured metadata", () => {
  const report = auditEntryAndLayout({
    entry: {
      id: "505",
      content_type: "post",
      title: "Orphan Post Without Author or Published Timestamp Yet",
      slug: "orphan-post",
      excerpt: "Sample summary excerpt crafted for link and schema readiness verification across all four link rules.",
    },
    site_context: {
      redirects: [{ old_slug: "old-slug", new_slug: "new-slug", status: 301 }],
      entries: [{ id: "101", slug: "new-slug", title: "Canonical Target", body_html: "" }],
      menus: [{ label: "Home", href: "/" }],
    },
    grex_layout: {
      element: "Container",
      tag: "main",
      children: [
        { element: "Heading", props: { id: "h1", level: 1, text: "Fast GRAB Themes" } },
        { element: "Link", props: { id: "vague-link", href: "/old-slug", text: "click here" } },
      ],
    },
  });

  const link001 = report.findings.find((f) => f.rule_id === "GROXY-LINK-001");
  const link002 = report.findings.find((f) => f.rule_id === "GROXY-LINK-002");
  const link003 = report.findings.find((f) => f.rule_id === "GROXY-LINK-003");
  const link004 = report.findings.find((f) => f.rule_id === "GROXY-LINK-004");

  assert.equal(link001.severity, "warning");
  assert.equal(link002.severity, "error");
  assert.equal(link003.severity, "warning");
  assert.equal(link004.severity, "warning");
});
