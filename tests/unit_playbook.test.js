import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  DEFAULT_SEO_PLAYBOOK,
  EXPECTED_RULE_IDS,
  loadPlaybook,
  parseDesignSystemMarkdown,
  validatePlaybook,
} from "../public/groxy/playbook.js";
import * as assetPlaybook from "../assets/playbook.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLAYBOOK_JSON_PATH = path.resolve(__dirname, "..", "playbook", "seo-playbook.v1.json");

test("playbook/seo-playbook.v1.json matches DEFAULT_SEO_PLAYBOOK and passes validation", async () => {
  const raw = fs.readFileSync(PLAYBOOK_JSON_PATH, "utf8");
  const diskPlaybook = JSON.parse(raw);

  validatePlaybook(diskPlaybook);
  assert.deepEqual(diskPlaybook, DEFAULT_SEO_PLAYBOOK);

  const loaded = await loadPlaybook(PLAYBOOK_JSON_PATH);
  assert.equal(loaded.playbook_version, "1.0.0");
  assert.equal(loaded.rules.length, 22);

  // Also confirm assets/playbook.js re-exports cleanly
  assert.equal(assetPlaybook.DEFAULT_SEO_PLAYBOOK.playbook_version, "1.0.0");
  assert.deepEqual(assetPlaybook.EXPECTED_RULE_IDS, EXPECTED_RULE_IDS);
});

test("playbook defines 4 equal pillars summing to 100 and 22 rules summing to 100 per pillar", () => {
  const pillars = Object.values(DEFAULT_SEO_PLAYBOOK.pillars);
  assert.equal(pillars.length, 4);
  const weightSum = pillars.reduce((s, p) => s + p.weight, 0);
  assert.equal(weightSum, 100);

  const seenIds = DEFAULT_SEO_PLAYBOOK.rules.map((r) => r.rule_id);
  assert.deepEqual(seenIds, EXPECTED_RULE_IDS);

  for (const pillarKey of Object.keys(DEFAULT_SEO_PLAYBOOK.pillars)) {
    const pillarRules = DEFAULT_SEO_PLAYBOOK.rules.filter((r) => r.category === pillarKey);
    const maxSum = pillarRules.reduce((s, r) => s + r.max_points, 0);
    assert.equal(maxSum, 100, `Pillar ${pillarKey} rules must sum to 100 points`);
  }
});

test("parseDesignSystemMarkdown parses both studio.grab and design-system.js GRAB-DESIGN-SYSTEM.md formats", () => {
  const studioStyleMd = `# GRAB-DESIGN-SYSTEM.md

## 1. Design Tokens

### Mode: \`light\`

- \`--grex-bg-surface\`: \`#ffffff\`
- \`--grex-text-primary\`: \`#0f172a\`

### Mode: \`dark\`

- \`--grex-bg-surface\`: \`#0b1120\`
- \`--grex-text-primary\`: \`#f8fafc\`

## 2. Reusable Classes

### \`.grex-c-hero-card\`

- \`base\`: \`padding: 1.5rem; background-color: #ffffff; color: #0f172a;\`

## 3. Approved Element Taxonomy

- **Approved 20 Elements:** \`Container\`, \`Text\`, \`Heading\`, \`Button\`

## 4. Template Registry & Slot Contract

| Slot / Rule ID | Kind | Priority |
|---|---|---|
| \`home\` | \`template\` | \`10\` |
| \`header\` | \`part-slot\` | \`10\` |
`;

  const parsedStudio = parseDesignSystemMarkdown(studioStyleMd);
  assert.equal(parsedStudio.tokens_loaded, 2);
  assert.equal(Object.keys(parsedStudio.modes.light).length, 2);
  assert.equal(Object.keys(parsedStudio.modes.dark).length, 2);
  assert.equal(parsedStudio.modes.light["--grex-bg-surface"], "#ffffff");
  assert.equal(parsedStudio.modes.dark["--grex-text-primary"], "#f8fafc");
  assert.equal(parsedStudio.reusable_classes_loaded, 1);
  assert.ok(parsedStudio.reusableClasses["hero-card"]);
  assert.equal(parsedStudio.elements.length, 4);
  assert.ok(parsedStudio.activeSlots.includes("header"));
  assert.equal(parsedStudio.templateRegistry.length, 1);

  const dsModuleStyleMd = `# GRAB-DESIGN-SYSTEM.md

## 1. Design Tokens

### Light Mode (\`[data-grex-theme="light"]\`)

- \`--grex-color-surface\`: \`#f8fafc\`
- \`--grex-color-text\`: \`#111827\`

## 2. Reusable Classes

### \`.grex-c-cta\`

- \`base\`: \`color: #ffffff; background-color: #1d4ed8;\`

## 3. Approved 20 Grex Elements

| Element | Category | Default Semantic HTML Tag |
|---|---|---|
| \`Container\` | Layout | \`<section>\` |
| \`Heading\` | Typography | \`<h2>\` |

## 4. Template Registry

- **Active Slots (4):** \`home\`, \`single\`, \`archive\`, \`page\`

| Template ID | Slot | Priority | Tree Slot | Conditions |
|---|---|---|---|---|
| \`tmpl_home\` | \`home\` | \`10\` | \`home\` | \`default\` |
`;

  const parsedModule = parseDesignSystemMarkdown(dsModuleStyleMd);
  assert.equal(parsedModule.modes.light["--grex-color-surface"], "#f8fafc");
  assert.equal(parsedModule.reusable_classes_loaded, 1);
  assert.equal(parsedModule.elements[0].name, "Container");
  assert.equal(parsedModule.elements[0].defaultTag, "section");
  assert.ok(parsedModule.activeSlots.includes("archive"));
  assert.equal(parsedModule.templateRegistry[0].id, "tmpl_home");
});
