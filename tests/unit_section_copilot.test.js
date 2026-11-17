import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  DEFAULT_DESIGN_CRAFT_PLAYBOOK,
  GROXY_VERSION,
  SectionCopilotError,
  auditAndRepairDualThemeContrast,
  auditDesignCraft,
  auditSectionCopilotStudio,
  canonicalJson,
  computeSubtreeDiff,
  mountSectionCopilotStudio,
  refineSectionDeterministically,
  resolveSectionTarget,
  sha256,
  spliceSectionSubtree,
  validateDesignCraftPlaybook,
  validateSubtreeStrict,
} from "../public/groxy/section-copilot.js";
import * as assetSectionCopilot from "../assets/section-copilot.js";
import { auditDom, createDomDocument } from "./helpers/dom-shim.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

const FULL_DESIGN_SYSTEM_MD = `# GRAB-DESIGN-SYSTEM.md

## 1. Active \`--grex-*\` Design Tokens

### Base \`:root\` Tokens
| Token | Value |
|---|---|
| \`--grex-bg\` | \`#ffffff\` |
| \`--grex-surface\` | \`#f8fafc\` |
| \`--grex-surface-1\` | \`#f8fafc\` |
| \`--grex-surface-2\` | \`#f1f5f9\` |
| \`--grex-ink\` | \`#0f172a\` |
| \`--grex-space-sm\` | \`12px\` |
| \`--grex-space-md\` | \`24px\` |
| \`--grex-space-lg\` | \`48px\` |
| \`--grex-measure\` | \`62ch\` |

### Mode: \`light\`
| Token | Value |
|---|---|
| \`--grex-bg\` | \`#ffffff\` |
| \`--grex-surface-1\` | \`#f8fafc\` |
| \`--grex-surface-2\` | \`#f1f5f9\` |
| \`--grex-ink\` | \`#0f172a\` |

### Mode: \`dark\`
| Token | Value |
|---|---|
| \`--grex-bg\` | \`#0f172a\` |
| \`--grex-surface-1\` | \`#1e293b\` |
| \`--grex-surface-2\` | \`#334155\` |
| \`--grex-ink\` | \`#f8fafc\` |

## 2. Reusable \`.grex-c-*\` Class Registry

- **\`.grex-c-card\`**
  - \`base\`: \`padding: var(--grex-space-md);\`
- **\`.grex-c-btn-primary\`**
  - \`base\`: \`color: #ffffff;\`
- **\`.grex-c-btn-secondary\`**
  - \`base\`: \`color: var(--grex-ink);\`
`;

const MINIMAL_BUILDER_DESIGN_SYSTEM_MD = `# GRAB-DESIGN-SYSTEM.md

## 1. Active \`--grex-*\` Design Tokens

### Base \`:root\` Tokens
| Token | Value |
|---|---|
| \`--grex-bg\` | \`#f8fafc\` |
| \`--grex-surface\` | \`#ffffff\` |
| \`--grex-ink\` | \`#0f172a\` |
| \`--grex-space-sm\` | \`12px\` |
| \`--grex-space-md\` | \`24px\` |
| \`--grex-space-lg\` | \`48px\` |

## 2. Reusable \`.grex-c-*\` Class Registry
_No author-defined \`.grex-c-*\` classes registered yet._
`;

const SAMPLE_SLOT_TREE = {
  element: "Fragment",
  children: [
    { element: "TemplatePart", props: { id: "home-header-part", name: "header" } },
    {
      element: "Container",
      tag: "main",
      props: { id: "home-main", class: "grex-main" },
      children: [
        {
          element: "Section",
          tag: "section",
          props: { id: "home-hero", class: "grex-hero", "aria-label": "Site Hero" },
          children: [
            { element: "Heading", props: { id: "home-title", level: 1, text: "Fast GRAB Publishing" } },
            { element: "Text", tag: "p", props: { id: "home-tagline", text: "Semantic layouts with instant undo." } },
          ],
        },
        {
          element: "Section",
          tag: "section",
          props: { id: "home-feed", class: "grex-feed", "aria-label": "Published Content" },
          children: [
            { element: "Heading", props: { id: "home-feed-heading", level: 2, text: "Latest Published" } },
            {
              element: "ForEach",
              props: {
                id: "home-query-loop",
                query: { content_type: "post", per_page: "6", sort_by: "published_at", sort_dir: "desc" },
              },
            },
          ],
        },
      ],
    },
    { element: "TemplatePart", props: { id: "home-footer-part", name: "footer" } },
  ],
};

test("playbook/design-craft.v1.json passes schema validation and malformed playbook fails closed", () => {
  assert.equal(GROXY_VERSION, "1.6.0");
  assert.equal(assetSectionCopilot.GROXY_VERSION, "1.6.0");

  const diskPlaybook = JSON.parse(
    fs.readFileSync(path.join(REPO_ROOT, "playbook", "design-craft.v1.json"), "utf8")
  );
  const validated = validateDesignCraftPlaybook(diskPlaybook);
  assert.equal(validated.rules.length, 5);
  assert.deepEqual(
    validated.rules.map((r) => r.id),
    DEFAULT_DESIGN_CRAFT_PLAYBOOK.rules.map((r) => r.id)
  );

  // Malformed playbooks must fail closed
  assert.throws(() => validateDesignCraftPlaybook(null), /JSON object/);
  assert.throws(() => validateDesignCraftPlaybook({ ...diskPlaybook, rules: [] }), /malformed/);
  assert.throws(
    () => validateDesignCraftPlaybook({ ...diskPlaybook, rules: diskPlaybook.rules.slice(0, 4) }),
    /malformed|Missing required/
  );
  assert.throws(
    () =>
      validateDesignCraftPlaybook({
        ...diskPlaybook,
        rules: [...diskPlaybook.rules.slice(0, 4), { ...diskPlaybook.rules[0] }],
      }),
    /Duplicate/
  );
});

test("C1 target resolution & subtree splicing isolate target and preserve siblings/ancestors byte-for-byte", () => {
  const resolved = resolveSectionTarget(SAMPLE_SLOT_TREE, "home-hero");
  assert.equal(resolved.matchCount, 1);
  assert.equal(resolved.targetNode.props.id, "home-hero");

  // Unknown section -> 404
  assert.throws(
    () => resolveSectionTarget(SAMPLE_SLOT_TREE, "does-not-exist"),
    (err) => err instanceof SectionCopilotError && err.status === 404
  );

  // Duplicate section_id -> 422
  const dupTree = JSON.parse(JSON.stringify(SAMPLE_SLOT_TREE));
  dupTree.children[1].children.push({
    element: "Section",
    props: { id: "home-hero", "aria-label": "Duplicate" },
    children: [],
  });
  assert.throws(
    () => resolveSectionTarget(dupTree, "home-hero"),
    (err) => err instanceof SectionCopilotError && err.status === 422 && err.code === "DUPLICATE_SECTION_ID"
  );

  // Cannot target Fragment, TemplatePart, or slot root -> 422
  assert.throws(
    () => resolveSectionTarget(SAMPLE_SLOT_TREE, "home-header-part"),
    (err) => err instanceof SectionCopilotError && err.status === 422 && err.code === "INVALID_TARGET_NODE"
  );
  const rootWithId = { ...SAMPLE_SLOT_TREE, id: "slot-root" };
  assert.throws(
    () => resolveSectionTarget(rootWithId, "slot-root"),
    (err) => err instanceof SectionCopilotError && err.status === 422 && err.code === "INVALID_TARGET_NODE"
  );

  // Subtree splice leaves sibling home-feed and TemplateParts canonically identical
  const replacement = {
    ...resolved.targetNode,
    props: { ...resolved.targetNode.props, "aria-label": "Calmer Hero" },
  };
  const spliced = spliceSectionSubtree(SAMPLE_SLOT_TREE, "home-hero", replacement);
  assert.equal(canonicalJson(spliced.children[0]), canonicalJson(SAMPLE_SLOT_TREE.children[0]));
  assert.equal(canonicalJson(spliced.children[1].children[1]), canonicalJson(SAMPLE_SLOT_TREE.children[1].children[1]));
  assert.equal(canonicalJson(spliced.children[2]), canonicalJson(SAMPLE_SLOT_TREE.children[2]));
  assert.equal(spliced.children[1].children[0].props["aria-label"], "Calmer Hero");
});

test("strict subtree gate blocks <div>, <script>, unsafe URLs, unknown tokens/classes, and JS float prices (422)", () => {
  const validNode = {
    element: "Section",
    tag: "section",
    props: { id: "s1", class: "grex-c-card", "aria-label": "Pricing" },
    styles: { base: { padding: "var(--grex-space-md)" } },
    children: [
      { element: "Text", tag: "p", props: { id: "p1", price: "19.95", quantity: "2", text: "$19.95" } },
    ],
  };
  assert.equal(validateSubtreeStrict(validNode, FULL_DESIGN_SYSTEM_MD), true);

  assert.throws(
    () => validateSubtreeStrict({ element: "div", tag: "div", props: { id: "bad" } }, FULL_DESIGN_SYSTEM_MD),
    /disallowed element/
  );
  assert.throws(
    () =>
      validateSubtreeStrict(
        { element: "Section", props: { id: "s1" }, children: [{ element: "Text", tag: "script", props: { text: "x" } }] },
        FULL_DESIGN_SYSTEM_MD
      ),
    /Forbidden HTML tag/
  );
  assert.throws(
    () =>
      validateSubtreeStrict(
        { element: "Link", props: { id: "l1", href: "javascript:alert(1)", text: "Go" } },
        FULL_DESIGN_SYSTEM_MD
      ),
    /Unsafe URL/
  );
  assert.throws(
    () =>
      validateSubtreeStrict(
        { element: "Section", props: { id: "s1", class: "grex-c-unpublished" } },
        FULL_DESIGN_SYSTEM_MD
      ),
    /Unregistered class/
  );
  assert.throws(
    () =>
      validateSubtreeStrict(
        { element: "Section", props: { id: "s1" }, styles: { base: { color: "var(--grex-nonexistent)" } } },
        FULL_DESIGN_SYSTEM_MD
      ),
    /Unknown design token/
  );
  // ADR-025c: JS float price rejected with 422
  assert.throws(
    () =>
      validateSubtreeStrict(
        { element: "Section", props: { id: "s1" }, children: [{ element: "Text", props: { price: 19.95, text: "19.95" } }] },
        FULL_DESIGN_SYSTEM_MD
      ),
    (err) => err instanceof SectionCopilotError && err.status === 422 && err.code === "ADR025C_WIRE_REQUIRED"
  );
});

test("Design-Craft rules cover 8pt spacing, 60-65ch measure, C4 token_unavailable, 1-CTA demotion, C6 Light/Dark contrast, and C7 CMS wiring", () => {
  // 1. Minimal Builder design system lacks --grex-surface-1/-2 and --grex-measure -> C4 reports token_unavailable without fabricating
  const outOfRangeMeasureSubtree = {
    element: "Section",
    tag: "section",
    props: { id: "hero-1", "aria-label": "Hero" },
    styles: { base: { padding: "12px", "max-width": "120ch" } },
    children: [
      { element: "Heading", props: { id: "h1", level: 1, text: "Hero Heading" } },
      { element: "Button", props: { id: "cta-1", text: "Start Free", variant: "primary" } },
      { element: "Button", props: { id: "cta-2", text: "Watch Demo", variant: "primary" } },
    ],
  };

  const minimalCraft = auditDesignCraft(outOfRangeMeasureSubtree, {
    designSystem: MINIMAL_BUILDER_DESIGN_SYSTEM_MD,
  });
  assert.equal(minimalCraft.valid, true);
  assert.ok(minimalCraft.token_unavailable.some((t) => t.token_role === "line_measure"));
  assert.ok(minimalCraft.token_unavailable.some((t) => t.token_role === "surface_elevation"));
  // Never fabricated missing tokens or hardcoded 65ch
  const serializedMinimal = JSON.stringify(minimalCraft.repaired_subtree);
  assert.equal(serializedMinimal.includes("--grex-surface-1"), false);
  assert.equal(serializedMinimal.includes("--grex-measure"), false);
  assert.equal(serializedMinimal.includes("65ch"), false);
  // 12px on non-inline Section snapped to nearest 8pt token (--grex-space-md = 24px)
  assert.equal(minimalCraft.repaired_subtree.styles.base.padding, "var(--grex-space-md)");
  // 2nd primary CTA demoted to secondary
  assert.equal(minimalCraft.repaired_subtree.children[1].props.variant, "primary");
  assert.equal(minimalCraft.repaired_subtree.children[2].props.variant, "secondary");

  // 2. Tight inline pair allows 12px (4pt) without snapping
  const inlinePair = {
    element: "Stack",
    props: { id: "nav-pair", direction: "row" },
    styles: { base: { gap: "var(--grex-space-sm)" } },
    children: [],
  };
  const inlineCraft = auditDesignCraft(inlinePair, { designSystem: FULL_DESIGN_SYSTEM_MD });
  assert.equal(inlineCraft.repaired_subtree.styles.base.gap, "var(--grex-space-sm)");

  // 3. Full design system with --grex-measure attaches var(--grex-measure) when repairing out-of-range max-width
  const fullCraft = auditDesignCraft(
    {
      element: "Section",
      props: { id: "prose-1", "aria-label": "Prose" },
      styles: { base: { "max-width": "100ch" } },
      children: [],
    },
    { designSystem: FULL_DESIGN_SYSTEM_MD }
  );
  assert.equal(fullCraft.repaired_subtree.styles.base["max-width"], "var(--grex-measure)");
  assert.equal(fullCraft.token_unavailable.length, 0);

  // 4. C6 Light/Dark contrast auto-repair
  const lowContrastNode = {
    element: "Section",
    props: { id: "c-test", "aria-label": "Contrast" },
    styles: { base: { color: "#9ca3af", "background-color": "#ffffff" } },
    children: [],
  };
  const cRepaired = auditAndRepairDualThemeContrast(lowContrastNode, FULL_DESIGN_SYSTEM_MD);
  assert.equal(cRepaired.light_passed, true);
  assert.equal(cRepaired.dark_passed, true);
  assert.equal(cRepaired.contrast_repairs.length, 1);
  assert.equal(cRepaired.repaired_subtree.styles.base.color, "#0f172a");

  // 5. C7 CMS & ForEach wiring: strips fabricated Form action, validates live content types/fields
  const cmsTypes = [
    {
      slug: "product",
      fields: [
        { field_key: "price", field_type: "decimal" },
        { field_key: "sku", field_type: "text" },
      ],
    },
  ];
  const formAndLoop = {
    element: "Section",
    props: { id: "shop-sec", "aria-label": "Shop" },
    children: [
      {
        element: "Form",
        props: { id: "lead-form", content_type: "product", action: "/api/cms/submit" },
        children: [{ element: "Input", props: { id: "inp-sku", label: "SKU", name: "sku" } }],
      },
      {
        element: "ForEach",
        props: { id: "prod-loop", query: { content_type: "product", per_page: "6" } },
        children: [{ element: "Text", props: { id: "p-price", text: "{price}" } }],
      },
    ],
  };
  const cmsOk = auditDesignCraft(formAndLoop, { designSystem: FULL_DESIGN_SYSTEM_MD, cmsContentTypes: cmsTypes });
  assert.equal(cmsOk.valid, true);
  assert.equal(cmsOk.repaired_subtree.children[0].props.action, undefined);

  // Unknown content type fails closed
  const badCt = {
    element: "ForEach",
    props: { id: "bad-loop", query: { content_type: "nonexistent_type", per_page: "6" } },
  };
  const cmsFail = auditDesignCraft(badCt, { designSystem: FULL_DESIGN_SYSTEM_MD, cmsContentTypes: cmsTypes });
  assert.equal(cmsFail.valid, false);
  assert.equal(cmsFail.blocking_errors[0].code, "unknown_content_type");
});

test("deterministic refinement preserves human copy unless targeted and produces structured diff", async () => {
  const hero = SAMPLE_SLOT_TREE.children[1].children[0];
  const res = refineSectionDeterministically(
    hero,
    "Make this hero calmer, one button, and improve spacing.",
    { designSystem: FULL_DESIGN_SYSTEM_MD }
  );
  assert.equal(res.diff.copy_preserved, true);
  assert.equal(res.refined_subtree.children[0].props.text, "Fast GRAB Publishing");
  assert.equal(res.refined_subtree.children[1].props.text, "Semantic layouts with instant undo.");
  assert.equal(res.craft_report.valid, true);

  const hashA = await sha256({ slot: "home", section_id: "home-hero", subtree: res.refined_subtree });
  const hashB = await sha256({ subtree: res.refined_subtree, section_id: "home-hero", slot: "home" });
  assert.equal(hashA, hashB, "Canonical SHA-256 digest must be key-order independent");
});

test("Section Co-Pilot Studio UI enforces zero <div>, zero innerHTML, Escape/focus-restoring dialog, and Light/Dark WCAG AA", async () => {
  assert.equal(auditSectionCopilotStudio("light").valid, true);
  assert.equal(auditSectionCopilotStudio("dark").valid, true);

  const { doc, root } = createDomDocument({ csrfToken: "csrf-v160-test" });
  let applyCalls = 0;
  const mockFetch = async (url, init) => {
    if (url === "/api/groxy/section-refine") {
      const reqBody = JSON.parse(init.body);
      return new Response(
        JSON.stringify({
          ok: true,
          schema_version: "1.6.0",
          refine_id: "ref_" + "a".repeat(32),
          slot: reqBody.slot,
          builder_slot: "home",
          section_id: reqBody.section_id,
          subtree_sha256: "b".repeat(64),
          before_subtree: SAMPLE_SLOT_TREE.children[1].children[0],
          after_subtree: SAMPLE_SLOT_TREE.children[1].children[0],
          design_craft: { valid: true, repairs: [], token_unavailable: [] },
          audit_report: { overall_score: 98, overall_grade: "A+", publish_safe: true },
          approval_token: "rtok_" + "c".repeat(64),
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
    if (url === "/api/groxy/section-refine/apply") {
      applyCalls += 1;
      return new Response(
        JSON.stringify({
          ok: true,
          approved: true,
          builder_slot: "home",
          actor: "groxy-ai",
          command_stack_action: "applyAiLayout",
        }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      );
    }
    return new Response("{}", { status: 404 });
  };

  const studio = mountSectionCopilotStudio({
    root,
    document: doc,
    csrfToken: "csrf-v160-test",
    fetchFn: mockFetch,
  });

  const domAudit = auditDom(root, doc);
  assert.equal(domAudit.divCount, 0);
  assert.equal(domAudit.innerHTMLWriteCount, 0);
  assert.deepEqual(domAudit.unlabeledControls, []);
  assert.equal(domAudit.scriptElements, 0);
  assert.deepEqual(domAudit.unsafeUrls, []);

  const staged = await studio.propose();
  assert.ok(staged);
  assert.equal(applyCalls, 0);

  // Open dialog, verify Escape closes and restores focus
  const reviewBtn = root.querySelector("#copilot-review-apply-btn");
  let focusedBack = false;
  reviewBtn.focus = () => {
    focusedBack = true;
  };
  reviewBtn.dispatchEvent({ type: "keydown", key: "Enter" });
  const dialog = root.querySelector("#copilot-confirm-dialog");
  assert.equal(dialog.hasAttribute("open"), true);
  dialog.dispatchEvent({ type: "keydown", key: "Escape" });
  assert.equal(dialog.hasAttribute("open"), false);
  assert.equal(focusedBack, true);

  // Apply after explicit human confirmation
  const applied = await studio.applyStaged();
  assert.equal(applied.approved, true);
  assert.equal(applyCalls, 1);
  studio.dispose();
});

test("src/groxy.grab implements C2 freshness/drift checks, C3 one-slot dispatch, and C8 ledger guards", () => {
  const grabSrc = fs.readFileSync(path.join(REPO_ROOT, "src", "groxy.grab"), "utf8");
  assert.ok(grabSrc.includes('route "POST" "/api/groxy/section-refine"'));
  assert.ok(grabSrc.includes('route "POST" "/api/groxy/section-refine/apply"'));
  assert.ok(grabSrc.includes("groxy_section_refine_ledger"));
  assert.ok(grabSrc.includes("SECTION_SLOT_DRIFT"));
  assert.ok(grabSrc.includes('status: "dispatch_failed"'));
  assert.ok(grabSrc.includes("json_has_duplicate_keys"));
  // C3: one-slot dispatch only; never document-form in section-refine/apply
  const applySection = grabSrc.slice(grabSrc.indexOf('route "POST" "/api/groxy/section-refine/apply"'));
  assert.ok(applySection.includes("slot: staged.builder_slot"));
  assert.equal(applySection.includes("document: "), false);
});
